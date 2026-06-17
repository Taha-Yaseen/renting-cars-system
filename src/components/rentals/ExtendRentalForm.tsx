import { useMemo, useState, type FormEvent } from 'react'
import { CalendarPlus } from 'lucide-react'
import type { Car, Client, Rental } from '../../types'
import { useLocale } from '../../context/LocaleContext'
import { formatNumber } from '../../utils/format'
import {
  calculateRentalCost,
  extensionExtraDays,
  getRentalDailyRate,
} from '../../utils/calculations'
import { daysBetween, formatDate } from '../../utils/dates'

interface ExtendResult {
  success: boolean
  errorKey?: string
}

interface Props {
  rental: Rental
  car: Car | undefined
  client: Client | undefined
  onSubmit: (newEndDate: string) => Promise<ExtendResult>
  onCancel: () => void
}

function dayAfter(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setDate(d.getDate() + 1)
  return d.toISOString().split('T')[0]
}

export default function ExtendRentalForm({ rental, car, client, onSubmit, onCancel }: Props) {
  const { locale, t } = useLocale()
  const [newEndDate, setNewEndDate] = useState('')
  const [error, setError] = useState('')
  const [submitError, setSubmitError] = useState('')

  const isOpenEnded = !rental.endDate
  const dailyRate = getRentalDailyRate(rental, car)
  const minEndDate = isOpenEnded ? rental.startDate : dayAfter(rental.endDate!)

  const extraDays = useMemo(() => {
    if (!newEndDate) return 0
    if (isOpenEnded) {
      if (new Date(newEndDate) < new Date(rental.startDate)) return 0
      return daysBetween(rental.startDate, newEndDate)
    }
    if (new Date(newEndDate) <= new Date(rental.endDate!)) return 0
    return extensionExtraDays(rental.endDate!, newEndDate)
  }, [newEndDate, rental.endDate, rental.startDate, isOpenEnded])

  const newTotal = useMemo(() => {
    if (!newEndDate || extraDays === 0) return 0
    return calculateRentalCost(dailyRate, rental.startDate, newEndDate)
  }, [newEndDate, extraDays, dailyRate, rental.startDate])

  const additionalCost = newTotal > 0 ? newTotal - rental.totalCost : 0

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitError('')
    if (!newEndDate) {
      setError(t('rentals.errors.selectNewEnd'))
      return
    }
    if (isOpenEnded) {
      if (new Date(newEndDate) < new Date(rental.startDate)) {
        setError(t('rentals.errors.endAfterStart'))
        return
      }
    } else if (new Date(newEndDate) <= new Date(rental.endDate!)) {
      setError(t('rentals.errors.newEndAfter'))
      return
    }
    setError('')
    const result = await onSubmit(newEndDate)
    if (!result?.success) {
      setSubmitError(t(result.errorKey ?? ''))
    }
  }

  const dayLabel = extraDays === 1 ? t('rentals.day') : t('rentals.days')
  const periodEnd = rental.endDate ? formatDate(rental.endDate, locale) : t('rentals.openEnded')

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm">
        <p className="font-medium text-zinc-900">
          {car ? `${car.make} ${car.model}` : t('rentals.vehicle')} · {client?.fullName ?? t('rentals.client')}
        </p>
        <p className="mt-1 text-zinc-500">
          {t('rentals.currentPeriod', {
            start: formatDate(rental.startDate, locale),
            end: periodEnd,
          })}
        </p>
        <p className="mt-1 text-zinc-500">
          {t('rentals.contractRate', {
            rate: formatNumber(dailyRate, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            total: formatNumber(rental.totalCost, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
          })}
        </p>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {isOpenEnded ? t('rentals.endDate') : t('rentals.newEndDate')}
        </label>
        <input
          type="date"
          value={newEndDate}
          min={minEndDate}
          onChange={(e) => {
            setNewEndDate(e.target.value)
            setError('')
          }}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${error ? 'border-red-300' : 'border-zinc-200'}`}
        />
        {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        <p className="mt-1 text-xs text-zinc-500">
          {isOpenEnded
            ? t('rentals.mustBeOnOrAfter', { date: formatDate(rental.startDate, locale) })
            : t('rentals.mustBeAfter', { date: formatDate(rental.endDate!, locale) })}
        </p>
      </div>

      {extraDays > 0 && (
        <div className="rounded-lg bg-indigo-50 px-4 py-3">
          <div className="flex items-start gap-2">
            <CalendarPlus className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" />
            <div className="text-sm text-indigo-700">
              <p>
                {t('rentals.additionalDays', {
                  count: formatNumber(extraDays, locale),
                  unit: dayLabel,
                  rate: formatNumber(dailyRate, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                })}
              </p>
              {!isOpenEnded && (
                <p className="mt-1">
                  {t('rentals.additionalCharge', {
                    amount: formatNumber(additionalCost, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                  })}
                </p>
              )}
              <p className="mt-1 text-base font-bold">
                {t('rentals.newTotal', {
                  total: formatNumber(newTotal, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
                })}
              </p>
            </div>
          </div>
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
          {isOpenEnded ? t('rentals.setEndDate') : t('rentals.confirmExtension')}
        </button>
      </div>
    </form>
  )
}
