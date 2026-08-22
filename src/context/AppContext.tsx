import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import type { AppState, Car, CarStatus, Client, OilChangeRecord, Payment, Rental, RentalNotification } from '../types'
import { useAuth } from './AuthContext'
import * as db from '../services/supabaseDb'
import { canRentCar } from '../constants/carStatuses'
import {
  calculateRentalCost,
  deriveRentalStatus,
  getRentalDailyRate,
  isOpenEndedRental,
  syncRentalStatuses,
} from '../utils/calculations'
import { isOverdue, todayISO } from '../utils/dates'
import { replaceOverdueNotification } from '../utils/notifications'
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

interface EditRentalInput {
  carId: string
  clientId: string
  startDate: string
  endDate: string | null
  dailyRate: number
}

interface AppContextValue {
  cars: Car[]
  clients: Client[]
  rentals: Rental[]
  payments: Payment[]
  oilChangeRecords: OilChangeRecord[]
  notifications: RentalNotification[]
  loading: boolean
  error: string | null
  clearError: () => void
  useSupabase: boolean
  companyName: string | null
  refetch: () => Promise<void>
  addCar: (carData: Omit<Car, 'id'>) => Promise<Car | null>
  updateCar: (id: string, updates: Partial<Car>) => Promise<void>
  deleteCar: (id: string) => Promise<void>
  toggleCarStatus: (id: string, newStatus: CarStatus) => Promise<void>
  addClient: (clientData: Omit<Client, 'id'>) => Promise<Client | null>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  addRental: (input: NewRentalInput) => Promise<RentalActionResult>
  editRental: (rentalId: string, input: EditRentalInput) => Promise<RentalActionResult>
  deleteRental: (rentalId: string) => Promise<void>
  extendRental: (rentalId: string, newEndDate: string) => Promise<ExtendRentalResult>
  returnCar: (rentalId: string, returnDate?: string) => Promise<RentalActionResult>
  refreshOverdue: () => Promise<void>
  addPayment: (payment: Omit<Payment, 'id'>) => Promise<Payment | null>
  deletePayment: (id: string) => Promise<void>
  addOilChangeRecord: (record: Omit<OilChangeRecord, 'id'>) => Promise<OilChangeRecord | null>
  deleteOilChangeRecord: (id: string) => Promise<void>
  addNotification: (
    notification: Omit<RentalNotification, 'id' | 'isSystem'>,
  ) => Promise<RentalNotification | null>
  deleteNotification: (id: string) => Promise<void>
}

const AppContext = createContext<AppContextValue | null>(null)

const emptyState: AppState = {
  cars: [],
  clients: [],
  rentals: [],
  payments: [],
  oilChangeRecords: [],
  notifications: [],
}

export function AppProvider({ children }: { children: ReactNode }) {
  const { companyId, companyName, signOut } = useAuth()
  const [state, setState] = useState<AppState>(emptyState)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const clearError = useCallback(() => setError(null), [])

  const handleDbError = useCallback((err: unknown, message: string) => {
    setError(err instanceof Error ? err.message : message)
  }, [])

  const refetch = useCallback(async () => {
    if (!companyId) return
    try {
      const data = await db.fetchAppState()
      setState({ ...data, rentals: syncRentalStatuses(data.rentals) })
    } catch (err) {
      handleDbError(err, 'Failed to load data from Supabase')
    }
  }, [companyId, handleDbError])

  useEffect(() => {
    if (!companyId) {
      setState(emptyState)
      setLoading(false)
      return undefined
    }

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
  }, [companyId, handleDbError])

  const actions = useMemo(
    () => ({
      addCar: async (carData: Omit<Car, 'id'>): Promise<Car | null> => {
        if (!companyId) return null
        clearError()
        const payload: Omit<Car, 'id'> = { ...carData, status: carData.status || 'Available' }
        try {
          const car = await db.insertCar(payload, companyId)
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

      deleteCar: async (id: string): Promise<void> => {
        clearError()
        const car = state.cars.find((c) => c.id === id)
        if (!car) return

        const rentalIds = new Set(state.rentals.filter((r) => r.carId === id).map((r) => r.id))
        const snapshot = state
        setState((s) => ({
          ...s,
          cars: s.cars.filter((c) => c.id !== id),
          rentals: s.rentals.filter((r) => r.carId !== id),
          payments: s.payments.filter((p) => !rentalIds.has(p.rentalId)),
          oilChangeRecords: s.oilChangeRecords.filter((r) => r.carId !== id),
          notifications: s.notifications.filter((n) => !rentalIds.has(n.rentalId)),
        }))

        try {
          await db.deleteCar(id)
        } catch (err) {
          setState(snapshot)
          handleDbError(err, 'Failed to delete car')
        }
      },

      addClient: async (clientData: Omit<Client, 'id'>): Promise<Client | null> => {
        if (!companyId) return null
        clearError()
        const payload: Omit<Client, 'id'> = { ...clientData, status: clientData.status || 'Active' }
        try {
          const client = await db.insertClient(payload, companyId)
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
        if (!companyId) return { success: false, errorKey: 'rentals.errors.saveFailed' }
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
          id: 'pending',
          carId,
          clientId,
          startDate,
          endDate: normalizedEndDate,
          dailyRate: rate,
          totalCost,
          status: 'Active',
        }
        const updatedCar: Car = { ...car, status: 'Rented' }
        const snapshot = state
        setState((s) => ({
          ...s,
          rentals: [...s.rentals, rental],
          cars: s.cars.map((c) => (c.id === carId ? updatedCar : c)),
        }))

        try {
          const { id: _pendingId, ...rentalPayload } = rental
          const saved = await db.persistNewRental(rentalPayload, updatedCar, companyId)
          const overdue = await db.syncOverdueNotification(saved, companyId)
          setState((s) => ({
            ...s,
            rentals: s.rentals.map((r) => (r.id === 'pending' ? saved : r)),
            cars: s.cars.map((c) => (c.id === carId ? updatedCar : c)),
            notifications: replaceOverdueNotification(s.notifications, saved.id, overdue),
          }))
          return { success: true, rental: saved }
        } catch (err) {
          setState(snapshot)
          handleDbError(err, 'Failed to create rental')
          return { success: false, errorKey: 'rentals.errors.saveFailed' }
        }
      },

      editRental: async (rentalId: string, input: EditRentalInput): Promise<RentalActionResult> => {
        clearError()
        const rental = state.rentals.find((r) => r.id === rentalId)
        if (!rental) {
          return { success: false, errorKey: 'rentals.errors.rentalNotFound' }
        }

        const newCar = state.cars.find((c) => c.id === input.carId)
        if (!newCar) {
          return { success: false, errorKey: 'rentals.errors.selectCar' }
        }

        const carChanged = input.carId !== rental.carId
        if (carChanged && rental.status !== 'Completed' && !canRentCar(newCar)) {
          return { success: false, errorKey: 'rentals.errors.carNotAvailable' }
        }

        if (input.startDate && input.endDate && new Date(input.endDate) < new Date(input.startDate)) {
          return { success: false, errorKey: 'rentals.errors.endAfterStart' }
        }
        if (!input.dailyRate || input.dailyRate <= 0) {
          return { success: false, errorKey: 'rentals.errors.ratePositive' }
        }

        const totalCost = calculateRentalCost(input.dailyRate, input.startDate, input.endDate)
        const updatedRental: Rental = {
          ...rental,
          carId: input.carId,
          clientId: input.clientId,
          startDate: input.startDate,
          endDate: input.endDate,
          dailyRate: input.dailyRate,
          totalCost,
          status: deriveRentalStatus({ status: rental.status, endDate: input.endDate }),
        }

        const oldCar = state.cars.find((c) => c.id === rental.carId)
        const updatedOldCar =
          carChanged && rental.status !== 'Completed' && oldCar
            ? { ...oldCar, status: 'Available' as const }
            : null
        const updatedNewCar =
          carChanged && rental.status !== 'Completed'
            ? { ...newCar, status: 'Rented' as const }
            : null

        const snapshot = state
        setState((s) => ({
          ...s,
          rentals: s.rentals.map((r) => (r.id === rentalId ? updatedRental : r)),
          cars: s.cars.map((c) => {
            if (updatedOldCar && c.id === updatedOldCar.id) return updatedOldCar
            if (updatedNewCar && c.id === updatedNewCar.id) return updatedNewCar
            return c
          }),
        }))

        try {
          const saved = await db.updateRental(rentalId, updatedRental)
          if (updatedOldCar) await db.updateCar(updatedOldCar.id, { status: 'Available' })
          if (updatedNewCar) await db.updateCar(updatedNewCar.id, { status: 'Rented' })
          const overdue = companyId
            ? await db.syncOverdueNotification(saved, companyId)
            : null
          setState((s) => ({
            ...s,
            rentals: s.rentals.map((r) => (r.id === rentalId ? saved : r)),
            notifications: replaceOverdueNotification(s.notifications, saved.id, overdue),
          }))
          return { success: true, rental: saved }
        } catch (err) {
          setState(snapshot)
          handleDbError(err, 'Failed to update rental')
          return { success: false, errorKey: 'rentals.errors.saveFailed' }
        }
      },

      deleteRental: async (rentalId: string): Promise<void> => {
        clearError()
        const rental = state.rentals.find((r) => r.id === rentalId)
        if (!rental) return

        const car = state.cars.find((c) => c.id === rental.carId)
        const shouldFreeCar = rental.status !== 'Completed' && car?.status === 'Rented'
        const updatedCar: Car | null = shouldFreeCar && car ? { ...car, status: 'Available' } : null

        const snapshot = state
        setState((s) => ({
          ...s,
          rentals: s.rentals.filter((r) => r.id !== rentalId),
          payments: s.payments.filter((p) => p.rentalId !== rentalId),
          notifications: s.notifications.filter((n) => n.rentalId !== rentalId),
          cars: updatedCar ? s.cars.map((c) => (c.id === updatedCar.id ? updatedCar : c)) : s.cars,
        }))

        try {
          await db.deleteRental(rentalId)
          if (updatedCar) await db.updateCar(updatedCar.id, { status: 'Available' })
        } catch (err) {
          setState(snapshot)
          handleDbError(err, 'Failed to delete rental')
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

        try {
          const saved = await db.persistExtendRental(updated)
          const overdue = companyId
            ? await db.syncOverdueNotification(saved, companyId)
            : null
          setState((s) => ({
            ...s,
            rentals: s.rentals.map((r) => (r.id === rentalId ? saved : r)),
            notifications: replaceOverdueNotification(s.notifications, saved.id, overdue),
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

        if (!updatedCar) {
          return { success: false, errorKey: 'rentals.errors.rentalNotFound' }
        }

        try {
          const saved = await db.persistReturnCar(completedRental, updatedCar)
          const overdue = companyId
            ? await db.syncOverdueNotification(saved, companyId)
            : null
          setState((s) => ({
            ...s,
            rentals: s.rentals.map((r) => (r.id === rentalId ? saved : r)),
            notifications: replaceOverdueNotification(s.notifications, saved.id, overdue),
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

        try {
          await Promise.all(changed.map((r) => db.updateRental(r.id, { status: r.status })))
        } catch (err) {
          handleDbError(err, 'Failed to sync rental statuses')
        }
      },

      addPayment: async (paymentData: Omit<Payment, 'id'>): Promise<Payment | null> => {
        if (!companyId) return null
        clearError()
        try {
          const payment = await db.insertPayment(paymentData, companyId)
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
        try {
          await db.deletePayment(id)
        } catch (err) {
          handleDbError(err, 'Failed to delete payment')
        }
      },

      addOilChangeRecord: async (
        recordData: Omit<OilChangeRecord, 'id'>,
      ): Promise<OilChangeRecord | null> => {
        if (!companyId) return null
        clearError()
        try {
          const record = await db.insertOilChangeRecord(recordData, companyId)
          setState((s) => ({ ...s, oilChangeRecords: [...s.oilChangeRecords, record] }))
          return record
        } catch (err) {
          handleDbError(err, 'Failed to add oil change record')
          return null
        }
      },

      deleteOilChangeRecord: async (id: string): Promise<void> => {
        clearError()
        setState((s) => ({
          ...s,
          oilChangeRecords: s.oilChangeRecords.filter((r) => r.id !== id),
        }))
        try {
          await db.deleteOilChangeRecord(id)
        } catch (err) {
          handleDbError(err, 'Failed to delete oil change record')
        }
      },

      addNotification: async (
        notificationData: Omit<RentalNotification, 'id' | 'isSystem'>,
      ): Promise<RentalNotification | null> => {
        if (!companyId) return null
        clearError()
        try {
          const notification = await db.insertNotification(
            { ...notificationData, isSystem: false },
            companyId,
          )
          setState((s) => ({ ...s, notifications: [...s.notifications, notification] }))
          return notification
        } catch (err) {
          handleDbError(err, 'Failed to add notification')
          return null
        }
      },

      deleteNotification: async (id: string): Promise<void> => {
        clearError()
        const existing = state.notifications.find((n) => n.id === id)
        if (existing?.isSystem) return
        setState((s) => ({
          ...s,
          notifications: s.notifications.filter((n) => n.id !== id),
        }))
        try {
          await db.deleteNotification(id)
        } catch (err) {
          handleDbError(err, 'Failed to delete notification')
        }
      },
    }),
    [state, companyId, clearError, handleDbError],
  )

  const value = useMemo<AppContextValue>(
    () => ({
      cars: state.cars,
      clients: state.clients,
      rentals: state.rentals,
      payments: state.payments,
      oilChangeRecords: state.oilChangeRecords,
      notifications: state.notifications,
      loading,
      error,
      clearError,
      useSupabase: true,
      companyName,
      refetch,
      ...actions,
    }),
    [state, actions, loading, error, clearError, refetch, companyName],
  )

  useEffect(() => {
    const interval = setInterval(() => {
      setState((s) => {
        const updated = syncRentalStatuses(s.rentals)
        const changed = updated.filter((r, i) => r.status !== s.rentals[i]?.status)
        if (changed.length === 0) return s

        Promise.all(
          changed.map((r) => db.updateRental(r.id, { status: r.status })),
        ).catch((err) => handleDbError(err, 'Failed to sync overdue rentals'))

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
          <div className="flex shrink-0 gap-3">
            <button
              type="button"
              onClick={() => void signOut()}
              className="font-medium underline hover:no-underline"
            >
              Sign out
            </button>
            <button
              type="button"
              onClick={clearError}
              className="font-medium underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
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
