export type CarStatus = 'Available' | 'Rented' | 'Maintenance' | 'Sold'
export type ClientStatus = 'Active' | 'Suspended'
export type RentalStatus = 'Active' | 'Completed' | 'Overdue'
export type CompanyMemberRole = 'owner'
export type RentalNotificationKind =
  | 'overdue'
  | 'payment_due'
  | 'oil_change_due'
  | 'mechanic_fee_due'
  | 'other'

export interface Company {
  id: string
  name: string
  ownerUsername?: string
  createdAt: string
}

export interface Car {
  id: string
  make: string
  model: string
  year: number
  licensePlate?: string
  dailyRate: number
  price: number
  status: CarStatus
  purchaseMonth: number
  purchaseYear: number
  color: string
  mechanicFeeDueDate?: string
  oilChangeDueKm?: number
  oilChangeDistanceUnit?: 'km' | 'mile'
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

export interface Payment {
  id: string
  rentalId: string
  clientId: string
  amount: number
  date: string
  note?: string
}

export interface OilChangeRecord {
  id: string
  carId: string
  date: string
  distance: number
  distanceUnit: 'km' | 'mile'
  note?: string
}

export interface RentalNotification {
  id: string
  rentalId: string
  kind: RentalNotificationKind
  dueDate: string
  note?: string
  isSystem: boolean
}

export interface AppState {
  cars: Car[]
  clients: Client[]
  rentals: Rental[]
  payments: Payment[]
  oilChangeRecords: OilChangeRecord[]
  notifications: RentalNotification[]
}
