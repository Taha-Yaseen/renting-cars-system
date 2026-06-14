export function daysBetween(startDate, endDate) {
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diff = end.getTime() - start.getTime()
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function isOverdue(endDate) {
  if (!endDate) return false
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const end = new Date(endDate)
  end.setHours(0, 0, 0, 0)
  return end < today
}

export function formatRentalPeriod(startDate, endDate, locale, openLabel) {
  const start = formatDate(startDate, locale)
  if (!endDate) return `${start} → ${openLabel}`
  return `${start} → ${formatDate(endDate, locale)}`
}

export function formatDate(dateStr, locale = 'en') {
  const tag = locale === 'ar' ? 'ar-SA' : 'en-US'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString(tag, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function todayISO() {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

/** End date for sorting/filtering; open-ended rentals use today. */
export function getEffectiveEndDate(rental) {
  return rental.endDate || todayISO()
}

/** True if rental period overlaps [rangeStart, rangeEnd] (inclusive). Empty bound = no limit. */
export function rentalOverlapsDateRange(rental, rangeStart, rangeEnd) {
  const rentalStart = rental.startDate
  const rentalEnd = getEffectiveEndDate(rental)
  if (rangeStart && rentalEnd < rangeStart) return false
  if (rangeEnd && rentalStart > rangeEnd) return false
  return true
}
