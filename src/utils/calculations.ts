import type { Car, Payment, Rental, RentalStatus } from '../types'
import { daysBetween, isOverdue, todayISO } from './dates'

export function calculateRentalCost(
  dailyRate: number,
  startDate: string,
  endDate: string | null | undefined,
): number {
  if (!endDate) return 0
  const days = daysBetween(startDate, endDate)
  return days * dailyRate
}

export function getCarsUtilization(cars: Car[]): number {
  const fleet = cars.filter((c) => c.status !== 'Sold')
  if (fleet.length === 0) return 0
  const rented = fleet.filter((c) => c.status === 'Rented').length
  return Math.round((rented / fleet.length) * 100)
}

export function getTotalRevenue(rentals: Rental[]): number {
  return rentals
    .filter((r) => r.status === 'Completed')
    .reduce((sum, r) => sum + r.totalCost, 0)
}

export function isOpenEndedRental(rental: Pick<Rental, 'endDate'>): boolean {
  return !rental.endDate
}

export function deriveRentalStatus(rental: Pick<Rental, 'status' | 'endDate'>): RentalStatus {
  if (rental.status === 'Completed') return 'Completed'
  if (isOpenEndedRental(rental)) return 'Active'
  return isOverdue(rental.endDate) ? 'Overdue' : 'Active'
}

export function getEffectiveRentalCost(rental: Rental, car: Car | undefined): number {
  if (rental.status === 'Completed') return rental.totalCost
  if (rental.endDate) return rental.totalCost
  const rate = getRentalDailyRate(rental, car)
  return calculateRentalCost(rate, rental.startDate, todayISO())
}

export function syncRentalStatuses(rentals: Rental[]): Rental[] {
  return rentals.map((rental) => ({
    ...rental,
    status: deriveRentalStatus(rental),
  }))
}

export function extensionExtraDays(currentEndDate: string, newEndDate: string): number {
  const current = new Date(currentEndDate + 'T00:00:00')
  const next = new Date(newEndDate + 'T00:00:00')
  const diff = next.getTime() - current.getTime()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

export function getClientRentalCount(clientId: string, rentals: Rental[]): number {
  return rentals.filter((r) => r.clientId === clientId).length
}

export function getCarRentals(carId: string, rentals: Rental[]): Rental[] {
  return rentals
    .filter((r) => r.carId === carId)
    .sort((a, b) => b.startDate.localeCompare(a.startDate))
}

export function getRentalDaysForHistory(rental: Rental): number {
  const end = rental.status === 'Completed' ? rental.endDate : todayISO()
  if (!end) return daysBetween(rental.startDate, todayISO())
  return daysBetween(rental.startDate, end)
}

export function getCarHistoryStats(carId: string, rentals: Rental[]) {
  const carRentals = getCarRentals(carId, rentals)
  const completed = carRentals.filter((r) => r.status === 'Completed')
  return {
    totalRentals: carRentals.length,
    completedRentals: completed.length,
    activeRentals: carRentals.filter(
      (r) => r.status === 'Active' || r.status === 'Overdue',
    ).length,
    totalRevenue: completed.reduce((sum, r) => sum + r.totalCost, 0),
    daysRented: carRentals.reduce((sum, r) => sum + getRentalDaysForHistory(r), 0),
  }
}

export function isCarFullyRevenued(totalRevenue: number, car: Car | undefined): boolean {
  if (!car?.price) return false
  return totalRevenue >= car.price
}

export function getRentalDailyRate(rental: Pick<Rental, 'dailyRate'>, car: Car | undefined): number {
  return rental.dailyRate ?? car?.dailyRate ?? 0
}

export function isCustomRentalRate(rental: Pick<Rental, 'dailyRate'>, car: Car | undefined): boolean {
  if (rental.dailyRate == null || !car) return false
  return rental.dailyRate !== car.dailyRate
}

export function getRentalPaidAmount(rentalId: string, payments: Payment[]): number {
  return payments
    .filter((p) => p.rentalId === rentalId)
    .reduce((sum, p) => sum + p.amount, 0)
}

export function getRentalBalance(
  rental: Rental,
  car: Car | undefined,
  payments: Payment[],
): number {
  const total = getEffectiveRentalCost(rental, car)
  const paid = getRentalPaidAmount(rental.id, payments)
  return Math.max(0, total - paid)
}

export function getClientTotalOwed(
  clientId: string,
  rentals: Rental[],
  cars: Car[],
  payments: Payment[],
): number {
  return rentals
    .filter((r) => r.clientId === clientId)
    .reduce((sum, r) => {
      const car = cars.find((c) => c.id === r.carId)
      return sum + getRentalBalance(r, car, payments)
    }, 0)
}
