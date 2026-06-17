import type { CarStatus } from '../types'

export const CAR_STATUSES: CarStatus[] = ['Available', 'Rented', 'Maintenance', 'Sold']

export function canRentCar(car: { status: string }): boolean {
  return car.status === 'Available'
}
