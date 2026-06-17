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

export function todayISO(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
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
