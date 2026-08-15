import type { Rental } from '../types'

export function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isOverdue(endDate: string | null | undefined): boolean {
  if (!endDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return end < today
}

export function formatRentalPeriod(
  startDate: string,
  endDate: string | null | undefined,
  locale: string,
  openLabel: string,
): string {
  const start = formatDate(startDate, locale)
  if (!endDate) return `${start} → ${openLabel}`
  return `${start} → ${formatDate(endDate, locale)}`
}

export function formatDate(dateStr: string, locale = 'en'): string {
  const tag = locale === 'ar' ? 'ar-SA' : 'en-US'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(tag, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function dateToISO(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

export function todayISO(): string {
  return dateToISO(new Date())
}

export function addDaysISO(iso: string, days: number): string {
  const date = new Date(iso + 'T00:00:00')
  date.setDate(date.getDate() + days)
  return dateToISO(date)
}

/** Inclusive end date used to place a rental on the dashboard calendar. */
export function getRentalCalendarEndDate(
  rental: Pick<Rental, 'startDate' | 'endDate' | 'status'>,
): string {
  if (rental.status === 'Completed') {
    return rental.endDate || rental.startDate
  }
  const today = todayISO()
  if (!rental.endDate) return today
  if (rental.status === 'Overdue' && rental.endDate < today) return today
  return rental.endDate
}

export function getEffectiveEndDate(rental: Pick<Rental, 'endDate'>): string {
  return rental.endDate || todayISO()
}

export function rentalOverlapsDateRange(
  rental: Pick<Rental, 'startDate' | 'endDate'>,
  rangeStart: string | null,
  rangeEnd: string | null,
): boolean {
  const rentalStart = rental.startDate
  const rentalEnd = getEffectiveEndDate(rental)
  if (rangeStart && rentalEnd < rangeStart) return false
  if (rangeEnd && rentalStart > rangeEnd) return false
  return true
}
