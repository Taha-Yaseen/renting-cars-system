import { useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import type { Rental } from '../../types'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import { canRentCar } from '../../constants/carStatuses'
import { formatNumber } from '../../utils/format'
import { calculateRentalCost } from '../../utils/calculations'
import { daysBetween } from '../../utils/dates'

interface SubmitResult {
  success: boolean
  errorKey?: string
}

interface Props {
  rental: Rental
  onSubmit: (data: {
    carId: string
    clientId: string
    startDate: string
    endDate: string | null
    dailyRate: number
  }) => Promise<SubmitResult>
  onCancel: () => void
}

export default function EditRentalForm({ rental, onSubmit, onCancel }: Props) {
  const { cars, clients } = useApp()
  const { t, locale } = useLocale()
  const isCompleted = rental.status === 'Completed'

  const [form, setForm] = useState({
    carId: rental.carId,
    clientId: rental.clientId,
    startDate: rental.startDate,
    endDate: rental.endDate ?? '',
    dailyRate: String(rental.dailyRate),
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState('')

  const carOptions = useMemo(() => {
    if (isCompleted) {
      const current = cars.find((c) => c.id === rental.carId)
      return current ? [current] : []
    }
    return cars.filter((c) => c.id === rental.carId || canRentCar(c))
  }, [cars, rental.carId, isCompleted])

  const clientOptions = useMemo(() => {
    const current = clients.find((c) => c.id === rental.clientId)
    const active = clients.filter((c) => c.status === 'Active')
    if (current && current.status !== 'Active') return [current, ...active]
    return active
  }, [clients, rental.clientId])

  const selectedCar = cars.find((c) => c.id === form.carId)
  const dailyRateNum = Number(form.dailyRate)
  const isCustomRate = selectedCar && form.dailyRate !== '' && dailyRateNum !== selectedCar.dailyRate

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
    const result = await onSubmit({
      carId: form.carId,
      clientId: form.clientId,
      startDate: form.startDate,
      endDate: form.endDate || null,
      dailyRate: dailyRateNum,
    })
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
          disabled={isCompleted}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-zinc-50 disabled:text-zinc-500 ${errors.carId ? 'border-red-300' : 'border-zinc-200'}`}
        >
          {carOptions.map((car) => (
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
        {isCompleted && (
          <p className="mt-1 text-xs text-zinc-400">{t('rentals.carLockedCompleted')}</p>
        )}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">{t('rentals.dailyRate')}</label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={form.dailyRate}
          onChange={(e) => setForm({ ...form, dailyRate: e.target.value })}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${errors.dailyRate ? 'border-red-300' : 'border-zinc-200'}`}
        />
        {selectedCar && (
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
        )}
        {errors.dailyRate && <p className="mt-1 text-xs text-red-500">{errors.dailyRate}</p>}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">{t('rentals.client')}</label>
        <select
          value={form.clientId}
          onChange={(e) => setForm({ ...form, clientId: e.target.value })}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.clientId ? 'border-red-300' : 'border-zinc-200'}`}
        >
          {clientOptions.map((client) => (
            <option key={client.id} value={client.id}>
              {client.fullName}
              {client.status !== 'Active' ? ` (${t(`status.${client.status}`)})` : ''}
            </option>
          ))}
        </select>
        {errors.clientId && <p className="mt-1 text-xs text-red-500">{errors.clientId}</p>}
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
          className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {t('common.saveChanges')}
        </button>
      </div>
    </form>
  )
}
