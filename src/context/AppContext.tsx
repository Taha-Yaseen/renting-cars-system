import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, Car, CarStatus, Client, Payment, Rental } from '../types'
import { isSupabaseConfigured } from '../lib/supabase'
import { loadState, saveState, generateId } from '../utils/storage'
import { canRentCar } from '../constants/carStatuses'
import * as db from '../services/supabaseDb'
import {
  calculateRentalCost,
  deriveRentalStatus,
  getRentalDailyRate,
  isOpenEndedRental,
  syncRentalStatuses,
} from '../utils/calculations'
import { isOverdue, todayISO } from '../utils/dates'
import LoadingScreen from '../components/ui/LoadingScreen'

type RentalActionResult =
  | { success: true; rental: Rental }
  | { success: false; errorKey: string }

type ExtendRentalResult =
  | { success: true; rental: Rental; previousTotal: number }
  | { success: false; errorKey: string }

interface NewRentalInput {
  carId: string
  clientId: string
  startDate: string
  endDate: string
  dailyRate: number
}

interface AppContextValue {
  cars: Car[]
  clients: Client[]
  rentals: Rental[]
  payments: Payment[]
  loading: boolean
  error: string | null
  clearError: () => void
  useSupabase: boolean
  addCar: (carData: Omit<Car, 'id'>) => Promise<Car | null>
  updateCar: (id: string, updates: Partial<Car>) => Promise<void>
  toggleCarStatus: (id: string, newStatus: CarStatus) => Promise<void>
  addClient: (clientData: Omit<Client, 'id'>) => Promise<Client | null>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  addRental: (input: NewRentalInput) => Promise<RentalActionResult>
  extendRental: (rentalId: string, newEndDate: string) => Promise<ExtendRentalResult>
  returnCar: (rentalId: string, returnDate?: string) => Promise<RentalActionResult>
  refreshOverdue: () => Promise<void>
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment | null>
  deletePayment: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)
const useSupabase = isSupabaseConfigured()

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(() => {
    if (useSupabase) {
      return { cars: [], clients: [], rentals: [], payments: [] }
    }
    const loaded = loadState()
    return { ...loaded, rentals: syncRentalStatuses(loaded.rentals) }
  })
  const [loading, setLoading] = useState(useSupabase)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const handleDbError = useCallback((err: unknown, message: string) => {
    setError(err instanceof Error ? err.message : message)
  }, [])

  useEffect(() => {
    if (!useSupabase) return undefined

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await db.fetchAppState()
        if (!cancelled) {
          setState({ ...data, rentals: syncRentalStatuses(data.rentals) })
        }
      } catch (err) {
        if (!cancelled) handleDbError(err, 'Failed to load data from Supabase')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [handleDbError])

  useEffect(() => {
    if (useSupabase || loading) return
    saveState(state)
  }, [state, loading])

  const actions = useMemo(
    () => ({
      addCar: async (carData: Omit<Car, 'id'>): Promise<Car | null> => {
        clearError()
        const payload: Omit<Car, 'id'> = { ...carData, status: carData.status || 'Available' }

        if (!useSupabase) {
          const car: Car = { ...payload, id: generateId('car') }
          setState((s) => ({ ...s, cars: [...s.cars, car] }))
          return car
        }

        try {
          const car = await db.insertCar(payload)
          setState((s) => ({ ...s, cars: [...s.cars, car] }))
          return car
        } catch (err) {
          handleDbError(err, 'Failed to add car')
          return null
        }
      },

      updateCar: async (id: string, updates: Partial<Car>): Promise<void> => {
        clearError()
        const previous = state.cars.find((c) => c.id === id)
        setState((s) => ({
          ...s,
          cars: s.cars.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))

        if (!useSupabase) return

        try {
          const car = await db.updateCar(id, updates)
          setState((s) => ({
            ...s,
            cars: s.cars.map((c) => (c.id === id ? car : c)),
          }))
        } catch (err) {
          if (previous) {
            setState((s) => ({
              ...s,
              cars: s.cars.map((c) => (c.id === id ? previous : c)),
            }))
          }
          handleDbError(err, 'Failed to update car')
        }
      },

      toggleCarStatus: async (id: string, newStatus: CarStatus): Promise<void> => {
        clearError()
        const previous = state.cars.find((c) => c.id === id)
        setState((s) => ({
          ...s,
          cars: s.cars.map((c) => (c.id === id ? { ...c, status: newStatus } : c)),
        }))

        if (!useSupabase) return

        try {
          const car = await db.updateCar(id, { status: newStatus })
          setState((s) => ({
            ...s,
            cars: s.cars.map((c) => (c.id === id ? car : c)),
          }))
        } catch (err) {
          if (previous) {
            setState((s) => ({
              ...s,
              cars: s.cars.map((c) => (c.id === id ? previous : c)),
            }))
          }
          handleDbError(err, 'Failed to update car status')
        }
      },

      addClient: async (clientData: Omit<Client, 'id'>): Promise<Client | null> => {
        clearError()
        const payload: Omit<Client, 'id'> = { ...clientData, status: clientData.status || 'Active' }

        if (!useSupabase) {
          const client: Client = { ...payload, id: generateId('client') }
          setState((s) => ({ ...s, clients: [...s.clients, client] }))
          return client
        }

        try {
          const client = await db.insertClient(payload)
          setState((s) => ({ ...s, clients: [...s.clients, client] }))
          return client
        } catch (err) {
          handleDbError(err, 'Failed to add client')
          return null
        }
      },

      updateClient: async (id: string, updates: Partial<Client>): Promise<void> => {
        clearError()
        const previous = state.clients.find((c) => c.id === id)
        setState((s) => ({
          ...s,
          clients: s.clients.map((c) => (c.id === id ? { ...c, ...updates } : c)),
        }))

        if (!useSupabase) return

        try {
          const client = await db.updateClient(id, updates)
          setState((s) => ({
            ...s,
            clients: s.clients.map((c) => (c.id === id ? client : c)),
          }))
        } catch (err) {
          if (previous) {
            setState((s) => ({
              ...s,
              clients: s.clients.map((c) => (c.id === id ? previous : c)),
            }))
          }
          handleDbError(err, 'Failed to update client')
        }
      },

      addRental: async ({
        carId,
        clientId,
        startDate,
        endDate,
        dailyRate,
      }: NewRentalInput): Promise<RentalActionResult> => {
        clearError()
        const car = state.cars.find((c) => c.id === carId)
        const client = state.clients.find((c) => c.id === clientId)

        if (!car || !canRentCar(car)) {
          return { success: false, errorKey: 'rentals.errors.carNotAvailable' }
        }
        if (!client || client.status !== 'Active') {
          return { success: false, errorKey: 'rentals.errors.clientNotActive' }
        }

        const normalizedEndDate = endDate || null
        if (normalizedEndDate && new Date(normalizedEndDate) < new Date(startDate)) {
          return { success: false, errorKey: 'rentals.errors.endAfterStart' }
        }

        const rate = dailyRate != null && dailyRate !== 0 ? Number(dailyRate) : car.dailyRate
        if (!rate || rate <= 0) {
          return { success: false, errorKey: 'rentals.errors.ratePositive' }
        }

        const totalCost = calculateRentalCost(rate, startDate, normalizedEndDate)
        const rental: Rental = {
          id: useSupabase ? 'pending' : generateId('rental'),
          carId,
          clientId,
          startDate,
          endDate: normalizedEndDate,
          dailyRate: rate,
          totalCost,
          status: 'Active',
        }
        const updatedCar: Car = { ...car, status: 'Rented' }

        if (!useSupabase) {
          setState((s) => ({
            ...s,
            rentals: [...s.rentals, rental],
            cars: s.cars.map((c) => (c.id === carId ? updatedCar : c)),
          }))
          return { success: true, rental }
        }

        const snapshot = state
        setState((s) => ({
          ...s,
          rentals: [...s.rentals, rental],
          cars: s.cars.map((c) => (c.id === carId ? updatedCar : c)),
        }))

        try {
          const { id: _pendingId, ...rentalPayload } = rental
          const saved = await db.persistNewRental(rentalPayload, updatedCar)
          setState((s) => ({
            ...s,
            rentals: s.rentals.map((r) => (r.id === 'pending' ? saved : r)),
            cars: s.cars.map((c) => (c.id === carId ? updatedCar : c)),
          }))
          return { success: true, rental: saved }
        } catch (err) {
          setState(snapshot)
          handleDbError(err, 'Failed to create rental')
          return { success: false, errorKey: 'rentals.errors.saveFailed' }
        }
      },

      extendRental: async (rentalId: string, newEndDate: string): Promise<ExtendRentalResult> => {
        clearError()
        const rental = state.rentals.find((r) => r.id === rentalId)
        const car = state.cars.find((c) => c.id === rental?.carId)

        if (!rental || rental.status === 'Completed') {
          return { success: false, errorKey: 'rentals.errors.rentalNotFound' }
        }
        if (rental.endDate) {
          if (new Date(newEndDate) <= new Date(rental.endDate)) {
            return { success: false, errorKey: 'rentals.errors.newEndAfter' }
          }
        } else if (new Date(newEndDate) < new Date(rental.startDate)) {
          return { success: false, errorKey: 'rentals.errors.endAfterStart' }
        }
        if (new Date(newEndDate) < new Date(rental.startDate)) {
          return { success: false, errorKey: 'rentals.errors.endBeforeStart' }
        }

        const rate = getRentalDailyRate(rental, car)
        if (!rate || rate <= 0) {
          return { success: false, errorKey: 'rentals.errors.invalidRate' }
        }

        const totalCost = calculateRentalCost(rate, rental.startDate, newEndDate)
        const updated: Rental = {
          ...rental,
          endDate: newEndDate,
          totalCost,
          status: deriveRentalStatus({ ...rental, endDate: newEndDate }),
        }

        const snapshot = state
        setState((s) => ({
          ...s,
          rentals: s.rentals.map((r) => (r.id === rentalId ? updated : r)),
        }))

        if (!useSupabase) {
          return { success: true, rental: updated, previousTotal: rental.totalCost }
        }

        try {
          const saved = await db.persistExtendRental(updated)
          setState((s) => ({
            ...s,
            rentals: s.rentals.map((r) => (r.id === rentalId ? saved : r)),
          }))
          return { success: true, rental: saved, previousTotal: rental.totalCost }
        } catch (err) {
          setState(snapshot)
          handleDbError(err, 'Failed to extend rental')
          return { success: false, errorKey: 'rentals.errors.saveFailed' }
        }
      },

      returnCar: async (
        rentalId: string,
        returnDate = todayISO(),
      ): Promise<RentalActionResult> => {
        clearError()
        const rental = state.rentals.find((r) => r.id === rentalId)
        if (!rental || rental.status === 'Completed') {
          return { success: false, errorKey: 'rentals.errors.rentalNotFound' }
        }

        const car = state.cars.find((c) => c.id === rental.carId)
        const rate = getRentalDailyRate(rental, car)
        const resolvedReturnDate = returnDate || todayISO()
        const isOpenEnded = isOpenEndedRental(rental)
        const endDate = isOpenEnded ? resolvedReturnDate : rental.endDate ?? resolvedReturnDate
        const totalCost = isOpenEnded
          ? calculateRentalCost(rate, rental.startDate, resolvedReturnDate)
          : rental.totalCost
        const completedRental: Rental = {
          ...rental,
          endDate,
          totalCost,
          status: 'Completed',
        }
        const updatedCar: Car | null = car ? { ...car, status: 'Available' } : null

        const snapshot = state
        setState((s) => ({
          ...s,
          rentals: s.rentals.map((r) => (r.id === rentalId ? completedRental : r)),
          cars: updatedCar
            ? s.cars.map((c) => (c.id === rental.carId ? updatedCar : c))
            : s.cars,
        }))

        if (!useSupabase) {
          return { success: true, rental: completedRental }
        }

        if (!updatedCar) {
          return { success: false, errorKey: 'rentals.errors.rentalNotFound' }
        }

        try {
          const saved = await db.persistReturnCar(completedRental, updatedCar)
          setState((s) => ({
            ...s,
            rentals: s.rentals.map((r) => (r.id === rentalId ? saved : r)),
          }))
          return { success: true, rental: saved }
        } catch (err) {
          setState(snapshot)
          handleDbError(err, 'Failed to return car')
          return { success: false, errorKey: 'rentals.errors.saveFailed' }
        }
      },

      refreshOverdue: async (): Promise<void> => {
        const synced = syncRentalStatuses(state.rentals)
        const changed = synced.filter((r, i) => r.status !== state.rentals[i]?.status)
        if (changed.length === 0) return

        setState((s) => ({ ...s, rentals: synced }))

        if (!useSupabase) return

        try {
          await Promise.all(changed.map((r) => db.updateRental(r.id, { status: r.status })))
        } catch (err) {
          handleDbError(err, 'Failed to sync rental statuses')
        }
      },

      addPayment: async (paymentData: Omit<Payment, 'id'>): Promise<Payment | null> => {
        clearError()
        if (!useSupabase) {
          const payment: Payment = { ...paymentData, id: generateId('pay') }
          setState((s) => ({ ...s, payments: [...s.payments, payment] }))
          return payment
        }

        try {
          const payment = await db.insertPayment(paymentData)
          setState((s) => ({ ...s, payments: [...s.payments, payment] }))
          return payment
        } catch (err) {
          handleDbError(err, 'Failed to add payment')
          return null
        }
      },

      deletePayment: async (id: string): Promise<void> => {
        clearError()
        setState((s) => ({ ...s, payments: s.payments.filter((p) => p.id !== id) }))

        if (!useSupabase) return

        try {
          await db.deletePayment(id)
        } catch (err) {
          handleDbError(err, 'Failed to delete payment')
        }
      },
    }),
    [state, clearError, handleDbError],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      cars: state.cars,
      clients: state.clients,
      rentals: state.rentals,
      payments: state.payments,
      loading,
      error,
      clearError,
      useSupabase,
      ...actions,
    }),
    [state, actions, loading, error, clearError],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => {
        const updated = syncRentalStatuses(s.rentals)
        const changed = updated.filter((r, i) => r.status !== s.rentals[i]?.status)
        if (changed.length === 0) return s

        if (useSupabase) {
          Promise.all(
            changed.map((r) => db.updateRental(r.id, { status: r.status })),
          ).catch((err) => handleDbError(err, 'Failed to sync overdue rentals'))
        }

        return { ...s, rentals: updated }
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [handleDbError])

  if (loading) {
    return <LoadingScreen />
  }

  return (
    <AppContext.Provider value={value}>
      {error && (
        <div
          role="alert"
          className="fixed inset-x-4 top-4 z-50 mx-auto flex max-w-lg items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 shadow-lg sm:inset-x-auto sm:right-6 sm:left-auto"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="shrink-0 font-medium underline hover:no-underline"
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </AppContext.Provider>
  )
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}

export { isOverdue }
