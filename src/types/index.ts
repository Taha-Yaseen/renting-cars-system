export type CarStatus = 'Available' | 'Rented' | 'Maintenance' | 'Sold'
export type ClientStatus = 'Active' | 'Suspended'
export type RentalStatus = 'Active' | 'Completed' | 'Overdue'

export interface Car {
  id: string
  make: string
  model: string
  year: number
  licensePlate?: string
  dailyRate: number
  status: CarStatus
  purchaseMonth: number
  purchaseYear: number
  color: string
  mechanicFeeDueDate?: string
  oilChangeDueKm?: number
}

export interface Client {
  id: string
  fullName: string
  phone: string
  status: ClientStatus
}

export interface Rental {
  id: string
  carId: string
  clientId: string
  startDate: string
  endDate?: string | null
  totalCost: number
  dailyRate: number
  status: RentalStatus
}

export interface AppState {
  cars: Car[]
  clients: Client[]
  rentals: Rental[]
}
