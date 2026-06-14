export const CAR_STATUSES = ['Available', 'Rented', 'Maintenance', 'Sold']

/** @param {{ status: string }} car */
export function canRentCar(car) {
  return car.status === 'Available'
}
