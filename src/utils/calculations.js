import { daysBetween, isOverdue, todayISO } from './dates'

export function calculateRentalCost(dailyRate, startDate, endDate) {
  if (!endDate) return 0
  const days = daysBetween(startDate, endDate)
  return days * dailyRate
}

export function getCarsUtilization(cars) {
  const fleet = cars.filter((c) => c.status !== 'Sold')
  if (fleet.length === 0) return 0
  const rented = fleet.filter((c) => c.status === 'Rented').length
  return Math.round((rented / fleet.length) * 100)
}

export function getTotalRevenue(rentals) {
  return rentals
    .filter((r) => r.status === 'Completed')
    .reduce((sum, r) => sum + r.totalCost, 0)
}

export function isOpenEndedRental(rental) {
  return !rental.endDate
}

export function deriveRentalStatus(rental) {
  if (rental.status === 'Completed') return 'Completed'
  if (isOpenEndedRental(rental)) return 'Active'
  return isOverdue(rental.endDate) ? 'Overdue' : 'Active'
}

export function getEffectiveRentalCost(rental, car) {
  if (rental.status === 'Completed') return rental.totalCost
  if (rental.endDate) return rental.totalCost
  const rate = getRentalDailyRate(rental, car)
  return calculateRentalCost(rate, rental.startDate, todayISO())
}

export function syncRentalStatuses(rentals) {
  return rentals.map((rental) => ({
    ...rental,
    status: deriveRentalStatus(rental),
  }))
}

export function extensionExtraDays(currentEndDate, newEndDate) {
  const current = new Date(currentEndDate + 'T00:00:00')
  const next = new Date(newEndDate + 'T00:00:00')
  const diff = next.getTime() - current.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getClientRentalCount(clientId, rentals) {
  return rentals.filter((r) => r.clientId === clientId).length
}

export function getCarRentals(carId, rentals) {
  return rentals
    .filter((r) => r.carId === carId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export function getRentalDaysForHistory(rental) {
  const end =
    rental.status === 'Completed' ? rental.endDate : todayISO()
  if (!end) return daysBetween(rental.startDate, todayISO())
  return daysBetween(rental.startDate, end)
}

export function getCarHistoryStats(carId, rentals) {
  const carRentals = getCarRentals(carId, rentals)
  const completed = carRentals.filter((r) => r.status === 'Completed')
  return {
    totalRentals: carRentals.length,
    completedRentals: completed.length,
    activeRentals: carRentals.filter(
      (r) => r.status === 'Active' || r.status === 'Overdue'
    ).length,
    totalRevenue: completed.reduce((sum, r) => sum + r.totalCost, 0),
    daysRented: carRentals.reduce((sum, r) => sum + getRentalDaysForHistory(r), 0),
  }
}

export function getRentalDailyRate(rental, car) {
  return rental.dailyRate ?? car?.dailyRate ?? 0
}

export function isCustomRentalRate(rental, car) {
  if (rental.dailyRate == null || !car) return false
  return rental.dailyRate !== car.dailyRate
}
