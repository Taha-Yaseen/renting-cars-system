import { useEffect, useMemo, useRef, useState, type Ref } from 'react'
import { Car, ChevronLeft, ChevronRight } from 'lucide-react'
import type { Car as CarType, Client, Rental } from '../../types'
import { getCarColorHex, isLightCarColor } from '../../constants/carColors'
import { useLocale } from '../../context/LocaleContext'
import { getEffectiveRentalCost } from '../../utils/calculations'
import {
  addDaysISO,
  dateToISO,
  formatRentalPeriod,
  getRentalCalendarEndDate,
} from '../../utils/dates'
import { formatNumber } from '../../utils/format'
import StatusBadge from '../ui/StatusBadge'

const WEEKDAY_KEYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'] as const
const MAX_VISIBLE_ICONS = 3

interface CalendarDay {
  iso: string
  inMonth: boolean
  day: number
}

interface Props {
  rentals: Rental[]
  cars: CarType[]
  clients: Client[]
}

type Translate = (key: string, vars?: Record<string, string | number>) => string
type TooltipAlign = 'start' | 'end' | 'center'

function rentalKey(rentalId: string, dayIso: string): string {
  return `rental:${rentalId}:${dayIso}`
}

function moreKey(dayIso: string): string {
  return `more:${dayIso}`
}

function getMonthGrid(year: number, month: number, weekStartsOn: number): CalendarDay[] {
  const first = new Date(year, month, 1)
  const startOffset = (first.getDay() - weekStartsOn + 7) % 7
  const lastDate = new Date(year, month + 1, 0).getDate()
  const totalCells = startOffset + lastDate
  const remainder = totalCells % 7
  const cellCount = remainder === 0 ? totalCells : totalCells + (7 - remainder)
  const gridStart = new Date(year, month, 1 - startOffset)

  return Array.from({ length: cellCount }, (_, i) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + i)
    return {
      iso: dateToISO(date),
      inMonth: date.getMonth() === month,
      day: date.getDate(),
    }
  })
}

function buildRentalsByDate(
  rentals: Rental[],
  gridStart: string,
  gridEnd: string,
): Map<string, Rental[]> {
  const map = new Map<string, Rental[]>()

  for (const rental of rentals) {
    const spanEnd = getRentalCalendarEndDate(rental)
    if (rental.startDate > gridEnd || spanEnd < gridStart) continue

    let current = rental.startDate < gridStart ? gridStart : rental.startDate
    const last = spanEnd > gridEnd ? gridEnd : spanEnd
    while (current <= last) {
      const list = map.get(current)
      if (list) list.push(rental)
      else map.set(current, [rental])
      current = addDaysISO(current, 1)
    }
  }

  for (const list of map.values()) {
    list.sort((a, b) => a.startDate.localeCompare(b.startDate) || a.id.localeCompare(b.id))
  }

  return map
}

function tooltipPositionClass(above: boolean, align: TooltipAlign): string {
  const vertical = above ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
  if (align === 'start') return `${vertical} start-0`
  if (align === 'end') return `${vertical} end-0`
  return `${vertical} left-1/2 -translate-x-1/2`
}

function ColoredCarIcon({ color, className }: { color: string; className?: string }) {
  const hex = getCarColorHex(color)
  const light = isLightCarColor(color)
  return (
    <Car
      className={className ?? 'h-3.5 w-3.5'}
      fill={hex}
      color={light ? '#3f3f46' : hex}
      strokeWidth={light ? 1.75 : 2}
    />
  )
}

export default function RentalCalendar({ rentals, cars, clients }: Props) {
  const { t, locale, isRtl } = useLocale()
  const popoverRef = useRef<HTMLDivElement>(null)
  const today = dateToISO(new Date())
  const [cursor, setCursor] = useState(() => new Date())
  const [selectedKey, setSelectedKey] = useState<string | null>(null)

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const weekStartsOn = locale === 'ar' ? 6 : 0

  const days = useMemo(
    () => getMonthGrid(year, month, weekStartsOn),
    [year, month, weekStartsOn],
  )

  const rentalsByDate = useMemo(() => {
    if (days.length === 0) return new Map<string, Rental[]>()
    return buildRentalsByDate(rentals, days[0].iso, days[days.length - 1].iso)
  }, [rentals, days])

  const weekdayKeys = useMemo(
    () => [...WEEKDAY_KEYS.slice(weekStartsOn), ...WEEKDAY_KEYS.slice(0, weekStartsOn)],
    [weekStartsOn],
  )

  const carsById = useMemo(() => new Map(cars.map((car) => [car.id, car])), [cars])
  const clientsById = useMemo(
    () => new Map(clients.map((client) => [client.id, client])),
    [clients],
  )

  useEffect(() => {
    if (!selectedKey) return

    function onPointerDown(event: PointerEvent) {
      const target = event.target
      if (!(target instanceof Node)) return
      if (popoverRef.current?.contains(target)) return

      const element = target instanceof Element ? target : target.parentElement
      if (element?.closest('[data-tooltip-trigger]')) return

      setSelectedKey(null)
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setSelectedKey(null)
    }

    document.addEventListener('pointerdown', onPointerDown, true)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('pointerdown', onPointerDown, true)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [selectedKey])

  const PrevIcon = isRtl ? ChevronRight : ChevronLeft
  const NextIcon = isRtl ? ChevronLeft : ChevronRight
  const isCurrentMonth = year === new Date().getFullYear() && month === new Date().getMonth()

  function goToMonth(delta: number) {
    setCursor(new Date(year, month + delta, 1))
    setSelectedKey(null)
  }

  function toggleSelected(key: string) {
    setSelectedKey((current) => (current === key ? null : key))
  }

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 bg-white shadow-sm sm:mb-8">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-zinc-100 px-4 py-4 sm:px-6">
        <div className="min-w-0">
          <h3 className="font-semibold text-zinc-900">{t('dashboard.calendarTitle')}</h3>
          <p className="mt-0.5 text-sm text-zinc-500">{t('dashboard.calendarHint')}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => goToMonth(-1)}
            aria-label={t('dashboard.prevMonth')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 active:bg-zinc-100"
          >
            <PrevIcon className="h-4 w-4" />
          </button>
          <p className="min-w-38 text-center text-sm font-semibold text-zinc-900">
            {t(`months.${month + 1}`)} {formatNumber(year, locale)}
          </p>
          <button
            type="button"
            onClick={() => goToMonth(1)}
            aria-label={t('dashboard.nextMonth')}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 text-zinc-600 transition hover:bg-zinc-50 active:bg-zinc-100"
          >
            <NextIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setCursor(new Date())
              setSelectedKey(null)
            }}
            disabled={isCurrentMonth}
            className="ms-1 min-h-9 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 active:bg-zinc-100 disabled:cursor-default disabled:opacity-40"
          >
            {t('dashboard.today')}
          </button>
        </div>
      </div>

      <div className="p-3 sm:p-4">
        <div className="grid grid-cols-7">
          {weekdayKeys.map((key) => (
            <div
              key={key}
              className="px-1 pb-2 text-center text-[11px] font-medium uppercase tracking-wide text-zinc-400 sm:text-xs"
            >
              {t(`weekdays.${key}`)}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 overflow-visible rounded-lg border border-zinc-100">
          {days.map((day, index) => {
            const dayRentals = rentalsByDate.get(day.iso) ?? []
            const visible = dayRentals.slice(0, MAX_VISIBLE_ICONS)
            const hidden = dayRentals.slice(MAX_VISIBLE_ICONS)
            const isToday = day.iso === today
            const col = index % 7
            const row = Math.floor(index / 7)
            const rowCount = Math.ceil(days.length / 7)
            const tooltipAbove = row >= rowCount - 2
            const tooltipAlign: TooltipAlign = col === 0 ? 'start' : col === 6 ? 'end' : 'center'
            const dayMoreKey = moreKey(day.iso)
            const selectedRental = dayRentals.find(
              (rental) => selectedKey === rentalKey(rental.id, day.iso),
            )
            const moreOpen = selectedKey === dayMoreKey
            const hasOpenTooltip = Boolean(selectedRental) || moreOpen

            return (
              <div
                key={day.iso}
                className={`relative min-h-19 border-zinc-100 p-1 sm:min-h-24 sm:p-1.5 ${
                  index % 7 !== 6 ? 'border-e' : ''
                } ${index < days.length - 7 ? 'border-b' : ''} ${
                  day.inMonth ? 'bg-white' : 'bg-zinc-50/70'
                } ${hasOpenTooltip ? 'z-20' : ''}`}
              >
                <span
                  className={`mb-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1 text-xs font-medium ${
                    isToday
                      ? 'bg-indigo-600 text-white'
                      : day.inMonth
                        ? 'text-zinc-700'
                        : 'text-zinc-400'
                  }`}
                >
                  {formatNumber(day.day, locale)}
                </span>

                {dayRentals.length > 0 && (
                  <div className="flex flex-wrap gap-0.5">
                    {visible.map((rental) => {
                      const car = carsById.get(rental.carId)
                      const client = clientsById.get(rental.clientId)
                      const key = rentalKey(rental.id, day.iso)
                      const open = selectedKey === key
                      const label = car
                        ? `${car.make} ${car.model}${client ? ` — ${client.fullName}` : ''}`
                        : t('rentals.unknownCar')

                      return (
                        <button
                          key={rental.id}
                          type="button"
                          data-tooltip-trigger
                          onClick={() => toggleSelected(key)}
                          aria-expanded={open}
                          aria-label={label}
                          className={`flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-100 ${
                            open ? 'ring-2 ring-indigo-500 ring-offset-1' : ''
                          }`}
                        >
                          <ColoredCarIcon color={car?.color ?? ''} />
                        </button>
                      )
                    })}
                    {hidden.length > 0 && (
                      <button
                        type="button"
                        data-tooltip-trigger
                        onClick={() => toggleSelected(dayMoreKey)}
                        aria-expanded={moreOpen}
                        aria-label={t('dashboard.moreRentals', { count: hidden.length })}
                        className={`flex h-6 min-w-6 items-center justify-center rounded-md px-1 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-100 ${
                          moreOpen
                            ? 'bg-zinc-100 ring-2 ring-indigo-500 ring-offset-1'
                            : 'bg-zinc-50'
                        }`}
                      >
                        {t('dashboard.moreCount', { count: hidden.length })}
                      </button>
                    )}
                  </div>
                )}

                {selectedRental && (
                  <RentalTooltip
                    ref={popoverRef}
                    rental={selectedRental}
                    car={carsById.get(selectedRental.carId)}
                    client={clientsById.get(selectedRental.clientId)}
                    locale={locale}
                    t={t}
                    className={tooltipPositionClass(tooltipAbove, tooltipAlign)}
                  />
                )}

                {moreOpen && (
                  <div
                    ref={popoverRef}
                    role="tooltip"
                    className={`absolute z-30 w-56 rounded-lg border border-zinc-200 bg-white p-1.5 shadow-lg ${tooltipPositionClass(tooltipAbove, tooltipAlign)}`}
                  >
                    {hidden.map((rental) => {
                      const car = carsById.get(rental.carId)
                      const client = clientsById.get(rental.clientId)
                      return (
                        <button
                          key={rental.id}
                          type="button"
                          onClick={() => setSelectedKey(rentalKey(rental.id, day.iso))}
                          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-start hover:bg-zinc-50"
                        >
                          <ColoredCarIcon color={car?.color ?? ''} className="h-3.5 w-3.5 shrink-0" />
                          <span className="min-w-0">
                            <span className="block truncate text-xs font-medium text-zinc-900">
                              {car ? `${car.make} ${car.model}` : t('rentals.unknownCar')}
                            </span>
                            <span className="block truncate text-[11px] text-zinc-500">
                              {client?.fullName ?? t('common.emDash')}
                            </span>
                          </span>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function RentalTooltip({
  rental,
  car,
  client,
  locale,
  t,
  className,
  ref,
}: {
  rental: Rental
  car: CarType | undefined
  client: Client | undefined
  locale: string
  t: Translate
  className: string
  ref?: Ref<HTMLDivElement>
}) {
  const cost = getEffectiveRentalCost(rental, car)

  return (
    <div
      ref={ref}
      role="tooltip"
      className={`absolute z-30 w-60 rounded-lg border border-zinc-200 bg-white p-3 text-start shadow-lg ${className}`}
    >
      <div className="flex items-start gap-2">
        <ColoredCarIcon color={car?.color ?? ''} className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0">
          <p className="font-semibold text-zinc-900">
            {car ? `${car.make} ${car.model}` : t('rentals.unknownCar')}
          </p>
          {car?.licensePlate && (
            <p className="mt-0.5 text-xs text-zinc-500">{car.licensePlate}</p>
          )}
        </div>
      </div>
      <dl className="mt-2 space-y-1.5 text-xs">
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">{t('dashboard.client')}</dt>
          <dd className="font-medium text-zinc-800">{client?.fullName ?? t('common.emDash')}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">{t('dashboard.period')}</dt>
          <dd className="text-end font-medium text-zinc-800">
            {formatRentalPeriod(rental.startDate, rental.endDate, locale, t('rentals.openEnded'))}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-zinc-500">{t('dashboard.cost')}</dt>
          <dd className="font-semibold text-zinc-900">
            $
            {formatNumber(cost, locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </dd>
        </div>
        <div className="flex items-center justify-between gap-3 pt-0.5">
          <dt className="text-zinc-500">{t('common.status')}</dt>
          <dd>
            <StatusBadge status={rental.status} />
          </dd>
        </div>
      </dl>
    </div>
  )
}
