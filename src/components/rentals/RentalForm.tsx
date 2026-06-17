import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { useApp } from '../../context/AppContext'
import { canRentCar } from '../../constants/carStatuses'
import { useLocale } from '../../context/LocaleContext'
import { formatNumber } from '../../utils/format'
import { calculateRentalCost } from '../../utils/calculations'
import { daysBetween, todayISO } from '../../utils/dates'
import { UserPlus } from 'lucide-react'

interface RentalFormState {
  carId: string
  clientId: string
  startDate: string
  endDate: string
  dailyRate: string
}

interface SubmitResult {
  success: boolean
  errorKey?: string
}

interface Props {
  onSubmit: (data: { carId: string; clientId: string; startDate: string; endDate: string; dailyRate: number }) => Promise<SubmitResult>
  onCancel: () => void
}

export default function RentalForm({ onSubmit, onCancel }: Props) {
  const { cars, clients, addClient } = useApp()
  const { t, locale } = useLocale()
  const [form, setForm] = useState<RentalFormState>({
    carId: '',
    clientId: '',
    startDate: todayISO(),
    endDate: '',
    dailyRate: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')
  const [addingClient, setAddingClient] = useState(false)
  const [newClientData, setNewClientData] = useState({ fullName: '', phone: '' })
  const [newClientErrors, setNewClientErrors] = useState<Record<string, string>>({})
  const [savingClient, setSavingClient] = useState(false)

  const availableCars = cars.filter(canRentCar)
  const activeClients = clients.filter((c) => c.status === 'Active')

  const selectedCar = cars.find((c) => c.id === form.carId)

  useEffect(() => {
    if (selectedCar) {
      setForm((f) => ({ ...f, dailyRate: String(selectedCar.dailyRate) }))
    } else {
      setForm((f) => ({ ...f, dailyRate: '' }))
    }
  }, [form.carId, selectedCar?.dailyRate])

  const dailyRateNum = Number(form.dailyRate)
  const isCustomRate =
    selectedCar && form.dailyRate !== '' && dailyRateNum !== selectedCar.dailyRate

  const estimatedCost = useMemo(() => {
    if (!form.startDate || !form.endDate || !dailyRateNum || dailyRateNum <= 0) return 0
    if (new Date(form.endDate) < new Date(form.startDate)) return 0
    return calculateRentalCost(dailyRateNum, form.startDate, form.endDate)
  }, [dailyRateNum, form.startDate, form.endDate])

  const rentalDays = useMemo(() => {
    if (!form.startDate || !form.endDate) return 0
    if (new Date(form.endDate) < new Date(form.startDate)) return 0
    return daysBetween(form.startDate, form.endDate)
  }, [form.startDate, form.endDate])

  const handleAddNewClient = async () => {
    const e: Record<string, string> = {}
    if (!newClientData.fullName.trim()) e.fullName = t('clients.errors.nameRequired')
    if (!newClientData.phone.trim()) e.phone = t('clients.errors.phoneRequired')
    setNewClientErrors(e)
    if (Object.keys(e).length > 0) return
    setSavingClient(true)
    const newClient = await addClient({ fullName: newClientData.fullName.trim(), phone: newClientData.phone.trim(), status: 'Active' })
    setSavingClient(false)
    if (newClient) {
      setForm((f) => ({ ...f, clientId: newClient.id }))
      setAddingClient(false)
      setNewClientData({ fullName: '', phone: '' })
      setNewClientErrors({})
    }
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (!form.carId) e.carId = t('rentals.errors.selectCar')
    if (!form.clientId) e.clientId = t('rentals.errors.selectClient')
    if (!form.startDate) e.startDate = t('rentals.errors.startRequired')
    if (form.startDate && form.endDate && new Date(form.endDate) < new Date(form.startDate)) {
      e.endDate = t('rentals.errors.endAfterStart')
    }
    if (!form.dailyRate || dailyRateNum <= 0) e.dailyRate = t('rentals.errors.validRate')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!validate()) return
    const result = await onSubmit({ ...form, dailyRate: dailyRateNum })
    if (!result?.success) {
      setSubmitError(t(result.errorKey ?? ''))
    }
  }

  const dayLabel = rentalDays === 1 ? t('rentals.day') : t('rentals.days')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">{t('rentals.vehicle')}</label>
        <select
          value={form.carId}
          onChange={(e) => setForm({ ...form, carId: e.target.value })}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.carId ? 'border-red-300' : 'border-zinc-200'}`}
        >
          <option value="">{t('rentals.selectAvailableCar')}</option>
          {availableCars.map((car) => (
            <option key={car.id} value={car.id}>
              {t('rentals.carRateOption', {
                make: car.make,
                model: car.model,
                plate: car.licensePlate ?? '',
                rate: car.dailyRate,
              })}
            </option>
          ))}
        </select>
        {errors.carId && <p className="mt-1 text-xs text-red-500">{errors.carId}</p>}
        {availableCars.length === 0 && (
          <p className="mt-1 text-xs text-amber-600">{t('rentals.noAvailableCars')}</p>
        )}
      </div>

      {selectedCar && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {t('rentals.dailyRate')}
          </label>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={form.dailyRate}
            onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.dailyRate ? 'border-red-300' : 'border-zinc-200'}`}
          />
          <p className="mt-1 text-xs text-zinc-500">
            {t('rentals.carsDefault', {
              rate: formatNumber(selectedCar.dailyRate, locale, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }),
            })}
            {isCustomRate && (
              <span className="ms-1 font-medium text-indigo-600">{t('rentals.customForRental')}</span>
            )}
          </p>
          {errors.dailyRate && <p className="mt-1 text-xs text-red-500">{errors.dailyRate}</p>}
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">{t('rentals.client')}</label>
        <select
          value={addingClient ? '__new__' : form.clientId}
          onChange={(e) => {
            if (e.target.value === '__new__') {
              setAddingClient(true)
              setForm({ ...form, clientId: '' })
            } else {
              setAddingClient(false)
              setForm({ ...form, clientId: e.target.value })
            }
          }}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.clientId ? 'border-red-300' : 'border-zinc-200'}`}
        >
          <option value="">{t('rentals.selectActiveClient')}</option>
          {activeClients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName}
            </option>
          ))}
          <option value="__new__">{t('rentals.addNewClient')}</option>
        </select>
        {errors.clientId && !addingClient && <p className="mt-1 text-xs text-red-500">{errors.clientId}</p>}

        {addingClient && (
          <div className="mt-2 space-y-3 rounded-lg border border-indigo-200 bg-indigo-50/40 p-3">
            <p className="flex items-center gap-1.5 text-xs font-medium text-indigo-700">
              <UserPlus className="h-3.5 w-3.5" />
              {t('rentals.newClientTitle')}
            </p>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">{t('clients.fullName')} <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={newClientData.fullName}
                onChange={(e) => setNewClientData({ ...newClientData, fullName: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${newClientErrors.fullName ? 'border-red-300' : 'border-zinc-200'}`}
              />
              {newClientErrors.fullName && <p className="mt-1 text-xs text-red-500">{newClientErrors.fullName}</p>}
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-700">{t('clients.phone')} <span className="text-red-500">*</span></label>
              <input
                type="tel"
                value={newClientData.phone}
                onChange={(e) => setNewClientData({ ...newClientData, phone: e.target.value })}
                className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${newClientErrors.phone ? 'border-red-300' : 'border-zinc-200'}`}
              />
              {newClientErrors.phone && <p className="mt-1 text-xs text-red-500">{newClientErrors.phone}</p>}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAddNewClient}
                disabled={savingClient}
                className="rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {t('rentals.addAndSelect')}
              </button>
              <button
                type="button"
                onClick={() => { setAddingClient(false); setNewClientData({ fullName: '', phone: '' }); setNewClientErrors({}) }}
                className="text-sm text-zinc-500 hover:text-zinc-700"
              >
                {t('common.cancel')}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">{t('rentals.startDate')}</label>
          <input
            type="date"
            value={form.startDate}
            onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.startDate ? 'border-red-300' : 'border-zinc-200'}`}
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {t('rentals.endDate')}
            <span className="ms-1 font-normal text-zinc-400">({t('common.optional')})</span>
          </label>
          <input
            type="date"
            value={form.endDate}
            min={form.startDate}
            onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.endDate ? 'border-red-300' : 'border-zinc-200'}`}
          />
          {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
          {!form.endDate && (
            <p className="mt-1 text-xs text-zinc-500">{t('rentals.openEndedHint')}</p>
          )}
        </div>
      </div>

      {estimatedCost > 0 && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3">
          <p className="text-sm text-indigo-700">
            <span className="font-semibold">
              {formatNumber(rentalDays, locale)} {dayLabel}
            </span>
            {' × '}
            <span className="font-semibold">
              ${formatNumber(dailyRateNum, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
            </span>
            {' = '}
            <span className="text-lg font-bold">
              ${formatNumber(estimatedCost, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>
      )}

      {submitError && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{submitError}</p>
      )}

      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={availableCars.length === 0}
          className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
        >
          {t('rentals.createRental')}
        </button>
      </div>
    </form>
  )
}
