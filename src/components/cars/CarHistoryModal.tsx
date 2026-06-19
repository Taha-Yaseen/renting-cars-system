import { Calendar, Car, DollarSign, FileText, User } from 'lucide-react'
import type { Car as CarType, Client, Rental, RentalStatus } from '../../types'
import { useLocale } from '../../context/LocaleContext'
import { formatNumber } from '../../utils/format'
import {
  getCarHistoryStats,
  getCarRentals,
  getEffectiveRentalCost,
  getRentalDailyRate,
  getRentalDaysForHistory,
  isCarFullyRevenued,
  isCustomRentalRate,
} from '../../utils/calculations'
import { formatRentalPeriod } from '../../utils/dates'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import StatusBadge from '../ui/StatusBadge'
import { getCarColorHex } from '../../constants/carColors'

const statusRowStyles: Record<RentalStatus, string> = {
  Active: 'border-s-indigo-500',
  Completed: 'border-s-zinc-300',
  Overdue: 'border-s-red-500',
}

interface Props {
  car: CarType | null
  rentals: Rental[]
  clients: Client[]
  isOpen: boolean
  onClose: () => void
}

export default function CarHistoryModal({ car, rentals, clients, isOpen, onClose }: Props) {
  const { t, locale } = useLocale()

  if (!car) return null

  const carRentals = getCarRentals(car.id, rentals)
  const stats = getCarHistoryStats(car.id, rentals)
  const getClient = (id: string) => clients.find((c) => c.id === id)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('carHistory.title', { make: car.make, model: car.model })}
      size="lg"
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-indigo-50">
              <Car className="h-5 w-5 text-indigo-600" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-zinc-900">
                {car.make} {car.model} · {car.year}
              </p>
              {car.licensePlate && (
                <p className="text-sm text-zinc-500">
                  {t('cars.licensePlate')}: {car.licensePlate}
                </p>
              )}
              {car.color && (
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                  <span
                    className="inline-block h-3 w-3 rounded-full border border-zinc-200"
                    style={{ backgroundColor: getCarColorHex(car.color) }}
                  />
                  {t(`carColors.${car.color}`)}
                </p>
              )}
              {car.price > 0 && (
                <p className="mt-0.5 text-xs text-zinc-500">
                  {t('cars.price')}: ${formatNumber(car.price, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>
          <StatusBadge status={car.status} />
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <p className="text-xs font-medium text-zinc-500">{t('carHistory.totalRentals')}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{formatNumber(stats.totalRentals, locale)}</p>
            {stats.activeRentals > 0 && (
              <p className="mt-0.5 text-xs text-indigo-600">
                {t('carHistory.activeNow', { count: formatNumber(stats.activeRentals, locale) })}
              </p>
            )}
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <p className="text-xs font-medium text-zinc-500">{t('carHistory.daysRented')}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{formatNumber(stats.daysRented, locale)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <p className="text-xs font-medium text-zinc-500">{t('carHistory.completed')}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">{formatNumber(stats.completedRentals, locale)}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3">
            <p className="text-xs font-medium text-zinc-500">{t('carHistory.revenue')}</p>
            <p className="mt-1 text-xl font-bold text-emerald-700">
              ${formatNumber(stats.totalRevenue, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-white p-3 col-span-2 sm:col-span-4">
            <p className="text-xs font-medium text-zinc-500">{t('carHistory.revenueOfPrice')}</p>
            <p className="mt-1 text-xl font-bold text-zinc-900">
              ${formatNumber(stats.totalRevenue, locale, { maximumFractionDigits: 0 })}
              <span className="text-sm font-medium text-zinc-400"> / ${formatNumber(car.price, locale, { maximumFractionDigits: 0 })}</span>
            </p>
            {isCarFullyRevenued(stats.totalRevenue, car) && (
              <span className="mt-1.5 inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                {t('carHistory.fullyRevenued')}
              </span>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-sm font-semibold text-zinc-900">{t('carHistory.timeline')}</h3>
          {carRentals.length === 0 ? (
            <EmptyState
              icon={FileText}
              title={t('carHistory.noRentals')}
              description={t('carHistory.noRentalsHint')}
            />
          ) : (
            <div className="space-y-3">
              {carRentals.map((rental) => {
                const client = getClient(rental.clientId)
                const days = getRentalDaysForHistory(rental)
                const dayLabel = days === 1 ? t('rentals.day') : t('rentals.days')
                return (
                  <div
                    key={rental.id}
                    className={`rounded-xl border border-zinc-200 border-s-4 bg-white p-4 ${statusRowStyles[rental.status]}`}
                  >
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <StatusBadge status={rental.status} />
                          <span className="text-xs text-zinc-400">
                            {formatNumber(days, locale)} {dayLabel}
                          </span>
                        </div>
                        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-900">
                          <User className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          {client?.fullName ?? t('common.unknown')}
                        </p>
                        {client?.phone && (
                          <p className="text-xs text-zinc-500">{client.phone}</p>
                        )}
                        <p className="flex items-center gap-1.5 text-sm text-zinc-600">
                          <Calendar className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          {formatRentalPeriod(rental.startDate, rental.endDate, locale, t('rentals.openEnded'))}
                        </p>
                        <p className="text-sm text-zinc-500">
                          ${formatNumber(getRentalDailyRate(rental, car), locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/{t('rentals.day')}
                          {isCustomRentalRate(rental, car) && (
                            <span className="ms-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600">
                              {t('rentals.customRate')}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-baseline gap-2 sm:flex-col sm:items-end sm:gap-0">
                        <DollarSign className="h-4 w-4 text-zinc-400 sm:hidden" />
                        <div className="text-end">
                          <p className="text-lg font-bold text-zinc-900">
                            ${formatNumber(getEffectiveRentalCost(rental, car), locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-zinc-400">{t('rentals.totalCost')}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
