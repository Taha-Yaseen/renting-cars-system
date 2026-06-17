import { useMemo, useState } from 'react'
import { ArrowLeftRight, CalendarPlus, Download, FileText, Plus, Search } from 'lucide-react'
import type { Rental, RentalStatus } from '../../types'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import {
  formatRentalPeriod,
  getEffectiveEndDate,
  rentalOverlapsDateRange,
  todayISO,
} from '../../utils/dates'
import { getEffectiveRentalCost, getRentalDailyRate, isCustomRentalRate } from '../../utils/calculations'
import { formatNumber } from '../../utils/format'
import { downloadRentalReceipt } from '../../utils/receiptPdf'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import PageHeader from '../ui/PageHeader'
import StatusBadge from '../ui/StatusBadge'
import RentalForm from './RentalForm'
import ExtendRentalForm from './ExtendRentalForm'

const statusRowStyles: Record<RentalStatus, string> = {
  Active: 'border-s-indigo-500',
  Completed: 'border-s-zinc-300',
  Overdue: 'border-s-red-500',
}

const RENTAL_FILTERS = ['all', 'Active', 'Overdue', 'Completed'] as const
type RentalFilter = typeof RENTAL_FILTERS[number]

interface Props {
  openAddOnMount?: boolean
}

export default function RentalContent({ openAddOnMount = false }: Props) {
  const { rentals, cars, clients, addRental, returnCar, extendRental } = useApp()
  const { locale, t } = useLocale()
  const [filter, setFilter] = useState<RentalFilter>('all')
  const [search, setSearch] = useState('')
  const [carFilter, setCarFilter] = useState('')
  const [clientFilter, setClientFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [modalOpen, setModalOpen] = useState(openAddOnMount)
  const [extendRentalId, setExtendRentalId] = useState<string | null>(null)

  const getCar = (id: string) => cars.find((c) => c.id === id)
  const getClient = (id: string) => clients.find((c) => c.id === id)

  const hasExtraFilters = search || carFilter || clientFilter || dateFrom || dateTo

  const clearExtraFilters = () => {
    setSearch('')
    setCarFilter('')
    setClientFilter('')
    setDateFrom('')
    setDateTo('')
  }

  const sortedCars = useMemo(
    () => [...cars].sort((a, b) => `${a.make} ${a.model}`.localeCompare(`${b.make} ${b.model}`)),
    [cars],
  )

  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.fullName.localeCompare(b.fullName)),
    [clients],
  )

  const filtered = rentals.filter((r) => {
    if (filter !== 'all' && r.status !== filter) return false
    if (carFilter && r.carId !== carFilter) return false
    if (clientFilter && r.clientId !== clientFilter) return false
    if (!rentalOverlapsDateRange(r, dateFrom || null, dateTo || null)) return false

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      const car = getCar(r.carId)
      const client = getClient(r.clientId)
      const carText = car ? `${car.make} ${car.model} ${car.licensePlate ?? ''}`.toLowerCase() : ''
      const clientText = client ? `${client.fullName} ${client.phone ?? ''}`.toLowerCase() : ''
      if (!carText.includes(q) && !clientText.includes(q)) return false
    }

    return true
  })

  const statusOrder: Record<RentalStatus, number> = { Active: 0, Overdue: 1, Completed: 2 }

  const sorted = [...filtered].sort((a, b) => {
    const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3)
    if (statusDiff !== 0) return statusDiff
    return getEffectiveEndDate(b).localeCompare(getEffectiveEndDate(a))
  })

  const handleCreate = async (form: {
    carId: string
    clientId: string
    startDate: string
    endDate: string
    dailyRate: number
  }) => {
    const result = await addRental(form)
    if (result.success) {
      setModalOpen(false)
    }
    return result
  }

  const extendingRental = extendRentalId ? rentals.find((r) => r.id === extendRentalId) : null

  const handleExtend = async (newEndDate: string) => {
    const result = await extendRental(extendRentalId!, newEndDate)
    if (result.success) {
      setExtendRentalId(null)
    }
    return result
  }

  const receiptLabels = {
    title: t('rentals.receipt.title'),
    receiptNo: t('rentals.receipt.receiptNo'),
    returnDate: t('rentals.receipt.returnDate'),
    vehicle: t('rentals.receipt.vehicle'),
    makeModel: t('rentals.receipt.makeModel'),
    year: t('rentals.receipt.year'),
    licensePlate: t('rentals.receipt.licensePlate'),
    client: t('rentals.receipt.client'),
    phone: t('rentals.receipt.phone'),
    rentalDetails: t('rentals.receipt.rentalDetails'),
    rentalPeriod: t('rentals.receipt.rentalPeriod'),
    dailyRate: t('rentals.receipt.dailyRate'),
    duration: t('rentals.receipt.duration'),
    formatDays: (count: number) => t('rentals.receipt.days', { count: formatNumber(count, locale) }),
    totalPaid: t('rentals.receipt.totalPaid'),
    status: t('rentals.receipt.status'),
    statusActive: t('status.Active'),
    statusOverdue: t('status.Overdue'),
    statusCompleted: t('status.Completed'),
    openEnded: t('rentals.openEnded'),
    pendingReturn: t('rentals.receipt.pendingReturn'),
    unknownCar: t('rentals.receipt.unknownCar'),
    unknownClient: t('rentals.receipt.unknownClient'),
    thankYou: t('rentals.receipt.thankYou'),
  }

  const handleReturnCar = async (rental: Rental) => {
    const returnDate = !rental.endDate ? todayISO() : undefined
    await returnCar(rental.id, returnDate)
  }

  const handleDownloadReceipt = (rental: Rental) => {
    downloadRentalReceipt({
      rental,
      car: getCar(rental.carId),
      client: getClient(rental.clientId),
      locale,
      labels: receiptLabels,
    })
  }

  const filterLabel = (status: RentalFilter) =>
    status === 'all' ? t('common.all') : t(`status.${status}`)

  return (
    <div>
      <PageHeader
        title={t('rentals.title')}
        description={
          hasExtraFilters || filter !== 'all'
            ? t('rentals.countFiltered', {
                shown: formatNumber(sorted.length, locale),
                total: formatNumber(rentals.length, locale),
              })
            : t('rentals.count', { count: formatNumber(rentals.length, locale) })
        }
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            {t('rentals.newRental')}
          </button>
        }
      />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {RENTAL_FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition touch-manipulation ${filter === status
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
              }`}
          >
            {filterLabel(status)}
            {status !== 'all' && (
              <span className="ms-1.5 text-xs opacity-75">
                ({formatNumber(rentals.filter((r) => r.status === status).length, locale)})
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="mb-6 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder={t('rentals.searchPlaceholder')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 bg-white py-2.5 ps-10 pe-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
          <select
            value={carFilter}
            onChange={(e) => setCarFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 sm:w-auto sm:min-w-[10rem]"
          >
            <option value="">{t('rentals.allCars')}</option>
            {sortedCars.map((car) => (
              <option key={car.id} value={car.id}>
                {car.make} {car.model} ({car.licensePlate})
              </option>
            ))}
          </select>
          <select
            value={clientFilter}
            onChange={(e) => setClientFilter(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-indigo-500 sm:w-auto sm:min-w-[10rem]"
          >
            <option value="">{t('rentals.allClients')}</option>
            {sortedClients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.fullName}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                {t('rentals.dateFrom')}
              </label>
              <input
                type="date"
                value={dateFrom}
                max={dateTo || undefined}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-500">
                {t('rentals.dateTo')}
              </label>
              <input
                type="date"
                value={dateTo}
                min={dateFrom || undefined}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>
          {hasExtraFilters && (
            <button
              type="button"
              onClick={clearExtraFilters}
              className="shrink-0 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              {t('rentals.clearFilters')}
            </button>
          )}
        </div>
      </div>

      {sorted.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={rentals.length === 0 ? t('rentals.noRentals') : t('rentals.noRentalsMatch')}
          description={
            rentals.length === 0 ? t('rentals.noRentalsHint') : t('rentals.noRentalsMatchHint')
          }
          action={
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('rentals.newRental')}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((rental) => {
            const car = getCar(rental.carId)
            const client = getClient(rental.clientId)
            return (
              <div
                key={rental.id}
                className={`rounded-xl border border-zinc-200 border-s-4 bg-white p-4 shadow-sm sm:p-5 ${statusRowStyles[rental.status]}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 gap-y-1">
                      <h3 className="font-semibold text-zinc-900">
                        {car ? `${car.make} ${car.model}` : t('rentals.unknownCar')}
                      </h3>
                      <StatusBadge status={rental.status} />
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      <span className="font-medium text-zinc-700">
                        {client?.fullName ?? t('common.unknown')}
                      </span>
                      {car?.licensePlate && (
                        <span className="block sm:inline">
                          <span className="hidden sm:inline"> · </span>
                          {car.licensePlate}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      {formatRentalPeriod(rental.startDate, rental.endDate, locale, t('rentals.openEnded'))}
                    </p>
                    <p className="mt-1 text-sm text-zinc-500">
                      ${formatNumber(getRentalDailyRate(rental, car), locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/day
                      {isCustomRentalRate(rental, car) && (
                        <span className="ms-1.5 rounded bg-indigo-50 px-1.5 py-0.5 text-xs font-medium text-indigo-600">
                          {t('rentals.customRate')}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex items-baseline justify-between gap-2 sm:block sm:text-end">
                    <span className="text-xs text-zinc-400 sm:hidden">{t('rentals.total')}</span>
                    <div>
                      <p className="text-xl font-bold text-zinc-900">
                        ${formatNumber(getEffectiveRentalCost(rental, car), locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="hidden text-xs text-zinc-400 sm:block">{t('rentals.totalCost')}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex flex-col gap-2 border-t border-zinc-100 pt-4">
                  {(rental.status === 'Active' || rental.status === 'Overdue') && (
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={() => setExtendRentalId(rental.id)}
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-2.5 text-sm font-medium text-indigo-700 transition hover:bg-indigo-100 active:bg-indigo-200"
                      >
                        <CalendarPlus className="h-4 w-4" />
                        {rental.endDate ? t('rentals.extend') : t('rentals.setEndDate')}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReturnCar(rental)}
                        className="flex min-h-[44px] flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-700 active:bg-emerald-800"
                      >
                        <ArrowLeftRight className="h-4 w-4" />
                        {t('rentals.returnCar')}
                      </button>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDownloadReceipt(rental)}
                    className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100"
                  >
                    <Download className="h-4 w-4" />
                    {t('rentals.downloadReceipt')}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={t('rentals.newRental')} size="lg">
        <RentalForm onSubmit={handleCreate} onCancel={() => setModalOpen(false)} />
      </Modal>

      <Modal
        isOpen={!!extendingRental}
        onClose={() => setExtendRentalId(null)}
        title={extendingRental?.endDate ? t('rentals.extendTitle') : t('rentals.setEndDate')}
        size="md"
      >
        {extendingRental && (
          <ExtendRentalForm
            rental={extendingRental}
            car={getCar(extendingRental.carId)}
            client={getClient(extendingRental.clientId)}
            onSubmit={handleExtend}
            onCancel={() => setExtendRentalId(null)}
          />
        )}
      </Modal>
    </div>
  )
}
