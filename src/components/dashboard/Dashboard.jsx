import {
  AlertTriangle,
  Car,
  DollarSign,
  FileText,
  Gauge,
  Plus,
  TrendingUp,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import {
  getCarsUtilization,
  getEffectiveRentalCost,
  getTotalRevenue,
} from '../../utils/calculations'
import { formatDate, formatRentalPeriod } from '../../utils/dates'
import { formatNumber } from '../../utils/format'
import KpiCard from '../ui/KpiCard'
import PageHeader from '../ui/PageHeader'
import StatusBadge from '../ui/StatusBadge'

function ActivityRows({ rentals, getCar, getClient, locale, t }) {
  return rentals.map((rental) => {
    const car = getCar(rental.carId)
    const client = getClient(rental.clientId)
    return (
      <div key={rental.id} className="p-4 sm:px-6 sm:py-3">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-medium text-zinc-900">
              {car ? `${car.make} ${car.model}` : t('common.emDash')}
            </p>
            <p className="text-sm text-zinc-500">{client?.fullName ?? t('common.emDash')}</p>
          </div>
          <StatusBadge status={rental.status} />
        </div>
        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-zinc-500">
            {formatRentalPeriod(rental.startDate, rental.endDate, locale, t('rentals.openEnded'))}
          </span>
          <span className="font-semibold text-zinc-900">
            ${formatNumber(getEffectiveRentalCost(rental, car), locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>
    )
  })
}

export default function Dashboard({ onNavigate, onNewRental, onAddCar }) {
  const { cars, rentals, clients } = useApp()
  const { locale, t } = useLocale()

  const totalRevenue = getTotalRevenue(rentals)
  const activeRentals = rentals.filter((r) => r.status === 'Active').length
  const availableCars = cars.filter((c) => c.status === 'Available').length
  const utilization = getCarsUtilization(cars)

  const overdueRentals = rentals.filter((r) => r.status === 'Overdue')
  const recentRentals = [...rentals]
    .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
    .slice(0, 5)

  const activityList = overdueRentals.length > 0 ? overdueRentals : recentRentals

  const getCar = (id) => cars.find((c) => c.id === id)
  const getClient = (id) => clients.find((c) => c.id === id)

  return (
    <div>
      <PageHeader
        title={t('dashboard.title')}
        description={t('dashboard.description')}
      />

      <div className="mb-6 grid grid-cols-2 gap-3 sm:mb-8 sm:gap-4 lg:grid-cols-4">
        <KpiCard
          icon={DollarSign}
          label={t('dashboard.totalRevenue')}
          value={`$${formatNumber(totalRevenue, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          subtext={t('dashboard.fromCompleted')}
          accent="emerald"
        />
        <KpiCard
          icon={FileText}
          label={t('dashboard.activeRentals')}
          value={formatNumber(activeRentals, locale)}
          subtext={t('dashboard.overdueCount', { count: formatNumber(overdueRentals.length, locale) })}
          accent="indigo"
        />
        <KpiCard
          icon={Car}
          label={t('dashboard.availableCars')}
          value={formatNumber(availableCars, locale)}
          subtext={t('dashboard.ofTotal', { total: formatNumber(cars.length, locale) })}
          accent="amber"
        />
        <KpiCard
          icon={Gauge}
          label={t('dashboard.carsUtilization')}
          value={`${formatNumber(utilization, locale)}%`}
          subtext={t('dashboard.carsRented')}
          accent="violet"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-6 lg:col-span-1">
          <h3 className="font-semibold text-zinc-900">{t('dashboard.quickActions')}</h3>
          <p className="mt-1 text-sm text-zinc-500">{t('dashboard.quickActionsHint')}</p>
          <div className="mt-4 space-y-3">
            <button
              type="button"
              onClick={onNewRental}
              className="flex w-full min-h-[44px] items-center justify-center gap-3 rounded-lg bg-indigo-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800"
            >
              <Plus className="h-4 w-4" />
              {t('dashboard.newRental')}
            </button>
            <button
              type="button"
              onClick={onAddCar}
              className="flex w-full min-h-[44px] items-center justify-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100"
            >
              <Car className="h-4 w-4 text-indigo-600" />
              {t('dashboard.addCar')}
            </button>
            <button
              type="button"
              onClick={() => onNavigate('rentals')}
              className="flex w-full min-h-[44px] items-center justify-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100"
            >
              <TrendingUp className="h-4 w-4 text-indigo-600" />
              {t('dashboard.viewAllRentals')}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-2">
              {overdueRentals.length > 0 ? (
                <AlertTriangle className="h-5 w-5 shrink-0 text-red-500" />
              ) : (
                <FileText className="h-5 w-5 shrink-0 text-indigo-600" />
              )}
              <h3 className="font-semibold text-zinc-900">
                {overdueRentals.length > 0
                  ? t('dashboard.overdueRentals')
                  : t('dashboard.recentActivity')}
              </h3>
            </div>
            {overdueRentals.length > 0 && (
              <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
                {t('dashboard.overdueBadge', { count: formatNumber(overdueRentals.length, locale) })}
              </span>
            )}
          </div>

          {activityList.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-zinc-500 sm:px-6">
              {t('dashboard.noActivity')}
            </p>
          ) : (
            <>
              <div className="divide-y divide-zinc-100 md:hidden">
                <ActivityRows
                  rentals={activityList}
                  getCar={getCar}
                  getClient={getClient}
                  locale={locale}
                  t={t}
                />
              </div>
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[520px] text-start text-sm">
                  <thead>
                    <tr className="border-b border-zinc-100 bg-zinc-50/50">
                      <th className="px-6 py-3 font-medium text-zinc-500">{t('dashboard.vehicle')}</th>
                      <th className="px-6 py-3 font-medium text-zinc-500">{t('dashboard.client')}</th>
                      <th className="px-6 py-3 font-medium text-zinc-500">{t('dashboard.period')}</th>
                      <th className="px-6 py-3 font-medium text-zinc-500">{t('dashboard.cost')}</th>
                      <th className="px-6 py-3 font-medium text-zinc-500">{t('common.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {activityList.map((rental) => {
                      const car = getCar(rental.carId)
                      const client = getClient(rental.clientId)
                      return (
                        <tr key={rental.id} className="hover:bg-zinc-50/50">
                          <td className="px-6 py-3 font-medium text-zinc-900">
                            {car ? `${car.make} ${car.model}` : t('common.emDash')}
                          </td>
                          <td className="px-6 py-3 text-zinc-600">{client?.fullName ?? t('common.emDash')}</td>
                          <td className="px-6 py-3 text-zinc-500">
                            {formatRentalPeriod(rental.startDate, rental.endDate, locale, t('rentals.openEnded'))}
                          </td>
                          <td className="px-6 py-3 font-medium text-zinc-900">
                            ${formatNumber(getEffectiveRentalCost(rental, car), locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="px-6 py-3">
                            <StatusBadge status={rental.status} />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
