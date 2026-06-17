import { BadgeDollarSign, Calendar, Car, Droplets, History, Pencil, Wrench } from 'lucide-react'
import type { Car as CarType, CarStatus } from '../../types'
import { getCarColorHex } from '../../constants/carColors'
import { useLocale } from '../../context/LocaleContext'
import { formatNumber } from '../../utils/format'
import { formatDate, isOverdue } from '../../utils/dates'
import StatusBadge from '../ui/StatusBadge'

interface Props {
  car: CarType
  onEdit: (car: CarType) => void
  onStatusChange: (id: string, status: CarStatus) => void
  onViewHistory?: (car: CarType) => void
  rentalCount?: number
}

export default function CarCard({ car, onEdit, onStatusChange, onViewHistory, rentalCount = 0 }: Props) {
  const { t, locale } = useLocale()
  const isSold = car.status === 'Sold'
  const mechanicOverdue = car.mechanicFeeDueDate ? isOverdue(car.mechanicFeeDueDate) : false

  if (isSold) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-zinc-100 p-5 text-zinc-500 shadow-none">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-semibold text-zinc-600">
              {car.make} {car.model}
            </h3>
            <p className="text-sm text-zinc-500">{car.year}</p>
            {car.licensePlate && (
              <p className="text-sm text-zinc-500">
                {t('cars.licensePlate')}: {car.licensePlate}
              </p>
            )}
            {car.color && (
              <p className="flex items-center gap-1.5 text-sm text-zinc-500">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-zinc-300 opacity-70"
                  style={{ backgroundColor: getCarColorHex(car.color) }}
                />
                {t('cars.color')}: {t(`carColors.${car.color}`)}
              </p>
            )}
            {car.purchaseMonth && car.purchaseYear && (
              <p className="text-sm text-zinc-500">
                {t('cars.purchased', {
                  month: t(`months.${car.purchaseMonth}`),
                  year: formatNumber(car.purchaseYear, locale),
                })}
              </p>
            )}
          </div>
          <StatusBadge status={car.status} />
        </div>

        <div className="mt-auto border-t border-zinc-200/80 pt-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onViewHistory?.(car)}
              title={t('carHistory.view')}
              className="relative flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-zinc-200 bg-white/60 text-zinc-500 transition hover:border-zinc-300 hover:bg-white hover:text-zinc-700"
            >
              <History className="h-4 w-4" />
              {rentalCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
                  {rentalCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => onEdit(car)}
              className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
            >
              <Pencil className="h-3.5 w-3.5" />
              {t('common.edit')}
            </button>
            <button
              type="button"
              onClick={() => onStatusChange(car.id, 'Available')}
              className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100 active:bg-emerald-200"
            >
              {t('cars.undoSold')}
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-50">
            <Car className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-semibold text-zinc-900">
              {car.make} {car.model}
            </h3>
            <p className="text-sm text-zinc-500">
              {car.year}
              {car.licensePlate ? ` · ${car.licensePlate}` : ''}
            </p>
            {car.color && (
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                <span
                  className="inline-block h-3 w-3 rounded-full border border-zinc-200"
                  style={{ backgroundColor: getCarColorHex(car.color) }}
                />
                {t(`carColors.${car.color}`)}
              </p>
            )}
            {car.purchaseMonth && car.purchaseYear && (
              <p className="text-xs text-zinc-400">
                {t('cars.purchased', {
                  month: t(`months.${car.purchaseMonth}`),
                  year: car.purchaseYear,
                })}
              </p>
            )}
          </div>
        </div>
        <StatusBadge status={car.status} />
      </div>

      <div className="mt-4 text-sm">
        <span className="font-medium text-indigo-600">
          {t('cars.perDay', { rate: formatNumber(car.dailyRate, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) })}
        </span>
      </div>

      {(car.mechanicFeeDueDate || car.oilChangeDueKm != null) && (
        <div className="mt-3 space-y-1.5 rounded-lg bg-zinc-50 px-3 py-2 text-xs">
          {car.mechanicFeeDueDate && (
            <p className={`flex items-center gap-1.5 ${mechanicOverdue ? 'font-medium text-red-600' : 'text-zinc-600'}`}>
              <Calendar className="h-3.5 w-3.5 shrink-0" />
              {t('cars.mechanicFeeDue')}: {formatDate(car.mechanicFeeDueDate, locale)}
              {mechanicOverdue && ` (${t('cars.overdue')})`}
            </p>
          )}
          {car.oilChangeDueKm != null && (
            <p className="flex items-center gap-1.5 text-zinc-600">
              <Droplets className="h-3.5 w-3.5 shrink-0" />
              {t('cars.oilChangeDue')}: {t('cars.oilChangeDueKmValue', {
                value: formatNumber(car.oilChangeDueKm, locale),
                unit: t(car.oilChangeDistanceUnit === 'mile' ? 'cars.unitMile' : 'cars.unitKm'),
              })}
            </p>
          )}
        </div>
      )}

      <div className="mt-auto border-t border-zinc-100 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onViewHistory?.(car)}
            title={t('carHistory.view')}
            className="relative flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700 active:bg-zinc-100"
          >
            <History className="h-4 w-4" />
            {rentalCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-500 px-1 text-[9px] font-bold text-white">
                {formatNumber(rentalCount, locale)}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={() => onEdit(car)}
            className="flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-700 active:bg-indigo-800"
          >
            <Pencil className="h-3.5 w-3.5" />
            {t('common.edit')}
          </button>
          {car.status !== 'Rented' && (
            <>
              <button
                type="button"
                onClick={() =>
                  onStatusChange(car.id, car.status === 'Maintenance' ? 'Available' : 'Maintenance')
                }
                className={`flex min-h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                  car.status === 'Maintenance'
                    ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-200'
                    : 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 active:bg-amber-200'
                }`}
              >
                <Wrench className="h-3.5 w-3.5" />
                {car.status === 'Maintenance' ? t('cars.setAvailable') : t('cars.maintenance')}
              </button>
              <button
                type="button"
                onClick={() => onStatusChange(car.id, 'Sold')}
                title={t('cars.markSold')}
                className="flex min-h-9 min-w-9 items-center justify-center rounded-lg border border-red-200 bg-red-50 text-red-600 transition hover:bg-red-100 active:bg-red-200"
              >
                <BadgeDollarSign className="h-4 w-4" />
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
