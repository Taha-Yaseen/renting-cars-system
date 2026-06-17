import type { AppState, Car, Client, Payment, Rental } from '../types'
import { getSupabase } from '../lib/supabase'

function carFromRow(row: Record<string, unknown>): Car {
  return {
    id: String(row.id),
    make: String(row.make),
    model: String(row.model),
    year: Number(row.year),
    licensePlate: row.license_plate != null ? String(row.license_plate) : undefined,
    dailyRate: Number(row.daily_rate),
    status: row.status as Car['status'],
    purchaseMonth: row.purchase_month != null ? Number(row.purchase_month) : 1,
    purchaseYear: row.purchase_year != null ? Number(row.purchase_year) : new Date().getFullYear(),
    color: row.color != null ? String(row.color) : 'white',
    mechanicFeeDueDate:
      row.mechanic_fee_due_date != null
        ? String(row.mechanic_fee_due_date).slice(0, 10)
        : undefined,
    oilChangeDueKm: row.oil_change_due_km != null ? Number(row.oil_change_due_km) : undefined,
    oilChangeDistanceUnit:
      row.oil_change_distance_unit === 'mile' ? 'mile' : 'km',
  }
}

function carToRow(car: Omit<Car, 'id'>): Record<string, unknown> {
  return {
    make: car.make,
    model: car.model,
    year: car.year,
    license_plate: car.licensePlate?.trim() || null,
    daily_rate: car.dailyRate,
    status: car.status,
    purchase_month: car.purchaseMonth,
    purchase_year: car.purchaseYear,
    color: car.color,
    mechanic_fee_due_date: car.mechanicFeeDueDate || null,
    oil_change_due_km: car.oilChangeDueKm ?? null,
    oil_change_distance_unit: car.oilChangeDistanceUnit ?? 'km',
  }
}

function clientFromRow(row: Record<string, unknown>): Client {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    status: row.status as Client['status'],
  }
}

function clientToRow(client: Omit<Client, 'id'>): Record<string, unknown> {
  return {
    full_name: client.fullName,
    phone: client.phone,
    status: client.status,
  }
}

function rentalFromRow(row: Record<string, unknown>): Rental {
  return {
    id: String(row.id),
    carId: String(row.car_id),
    clientId: String(row.client_id),
    startDate: String(row.start_date).slice(0, 10),
    endDate:
      row.end_date != null && String(row.end_date).trim() !== ''
        ? String(row.end_date).slice(0, 10)
        : null,
    totalCost: Number(row.total_cost),
    dailyRate: Number(row.daily_rate),
    status: row.status as Rental['status'],
  }
}

function rentalToRow(rental: Omit<Rental, 'id'>): Record<string, unknown> {
  return {
    car_id: rental.carId,
    client_id: rental.clientId,
    start_date: rental.startDate,
    end_date: rental.endDate || null,
    total_cost: rental.totalCost,
    daily_rate: rental.dailyRate,
    status: rental.status,
  }
}

function paymentFromRow(row: Record<string, unknown>): Payment {
  return {
    id: String(row.id),
    rentalId: String(row.rental_id),
    clientId: String(row.client_id),
    amount: Number(row.amount),
    date: String(row.date).slice(0, 10),
    note: row.note != null ? String(row.note) : undefined,
  }
}

function paymentToRow(payment: Omit<Payment, 'id'>): Record<string, unknown> {
  return {
    rental_id: payment.rentalId,
    client_id: payment.clientId,
    amount: payment.amount,
    date: payment.date,
    note: payment.note ?? null,
  }
}

function throwOnError(error: { message?: string } | null, fallbackMessage: string): void {
  if (error) throw new Error(error.message || fallbackMessage)
}

export async function fetchAppState(): Promise<AppState> {
  const supabase = getSupabase()
  const [carsRes, clientsRes, rentalsRes, paymentsRes] = await Promise.all([
    supabase.from('cars').select('*').order('created_at', { ascending: true }),
    supabase.from('clients').select('*').order('created_at', { ascending: true }),
    supabase.from('rentals').select('*').order('created_at', { ascending: true }),
    supabase.from('payments').select('*').order('created_at', { ascending: true }),
  ])

  throwOnError(carsRes.error, 'Failed to load cars')
  throwOnError(clientsRes.error, 'Failed to load clients')
  throwOnError(rentalsRes.error, 'Failed to load rentals')

  return {
    cars: (carsRes.data ?? []).map((r) => carFromRow(r as Record<string, unknown>)),
    clients: (clientsRes.data ?? []).map((r) => clientFromRow(r as Record<string, unknown>)),
    rentals: (rentalsRes.data ?? []).map((r) => rentalFromRow(r as Record<string, unknown>)),
    payments: paymentsRes.error
      ? []
      : (paymentsRes.data ?? []).map((r) => paymentFromRow(r as Record<string, unknown>)),
  }
}

export async function insertCar(car: Omit<Car, 'id'>): Promise<Car> {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('cars').insert(carToRow(car)).select().single()
  throwOnError(error, 'Failed to add car')
  return carFromRow(data as Record<string, unknown>)
}

export async function updateCar(id: string, updates: Partial<Car>): Promise<Car> {
  const supabase = getSupabase()
  const row: Record<string, unknown> = {}
  if (updates.make != null) row.make = updates.make
  if (updates.model != null) row.model = updates.model
  if (updates.year != null) row.year = updates.year
  if ('licensePlate' in updates) row.license_plate = updates.licensePlate?.trim() || null
  if (updates.dailyRate != null) row.daily_rate = updates.dailyRate
  if (updates.status != null) row.status = updates.status
  if (updates.purchaseMonth != null) row.purchase_month = updates.purchaseMonth
  if (updates.purchaseYear != null) row.purchase_year = updates.purchaseYear
  if (updates.color != null) row.color = updates.color
  if ('mechanicFeeDueDate' in updates) row.mechanic_fee_due_date = updates.mechanicFeeDueDate || null
  if ('oilChangeDueKm' in updates) row.oil_change_due_km = updates.oilChangeDueKm ?? null
  if ('oilChangeDistanceUnit' in updates) row.oil_change_distance_unit = updates.oilChangeDistanceUnit ?? 'km'

  const { data, error } = await supabase.from('cars').update(row).eq('id', id).select().single()
  throwOnError(error, 'Failed to update car')
  return carFromRow(data as Record<string, unknown>)
}

export async function insertClient(client: Omit<Client, 'id'>): Promise<Client> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('clients')
    .insert(clientToRow(client))
    .select()
    .single()
  throwOnError(error, 'Failed to add client')
  return clientFromRow(data as Record<string, unknown>)
}

export async function updateClient(id: string, updates: Partial<Client>): Promise<Client> {
  const supabase = getSupabase()
  const row: Record<string, unknown> = {}
  if (updates.fullName != null) row.full_name = updates.fullName
  if (updates.phone != null) row.phone = updates.phone
  if (updates.status != null) row.status = updates.status

  const { data, error } = await supabase
    .from('clients')
    .update(row)
    .eq('id', id)
    .select()
    .single()
  throwOnError(error, 'Failed to update client')
  return clientFromRow(data as Record<string, unknown>)
}

export async function insertRental(rental: Omit<Rental, 'id'>): Promise<Rental> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('rentals')
    .insert(rentalToRow(rental))
    .select()
    .single()
  throwOnError(error, 'Failed to add rental')
  return rentalFromRow(data as Record<string, unknown>)
}

export async function updateRental(id: string, updates: Partial<Rental>): Promise<Rental> {
  const supabase = getSupabase()
  const row: Record<string, unknown> = {}
  if (updates.carId != null) row.car_id = updates.carId
  if (updates.clientId != null) row.client_id = updates.clientId
  if (updates.startDate != null) row.start_date = updates.startDate
  if (updates.endDate !== undefined) row.end_date = updates.endDate
  if (updates.totalCost != null) row.total_cost = updates.totalCost
  if (updates.dailyRate != null) row.daily_rate = updates.dailyRate
  if (updates.status != null) row.status = updates.status

  const { data, error } = await supabase
    .from('rentals')
    .update(row)
    .eq('id', id)
    .select()
    .single()
  throwOnError(error, 'Failed to update rental')
  return rentalFromRow(data as Record<string, unknown>)
}

export async function persistNewRental(
  rental: Omit<Rental, 'id'>,
  carUpdate: Car,
): Promise<Rental> {
  const savedRental = await insertRental(rental)
  await updateCar(carUpdate.id, { status: carUpdate.status })
  return savedRental
}

export async function persistReturnCar(rental: Rental, carUpdate: Car): Promise<Rental> {
  const savedRental = await updateRental(rental.id, {
    status: rental.status,
    endDate: rental.endDate,
    totalCost: rental.totalCost,
  })
  await updateCar(carUpdate.id, { status: carUpdate.status })
  return savedRental
}

export async function persistExtendRental(rental: Rental): Promise<Rental> {
  return updateRental(rental.id, {
    endDate: rental.endDate,
    totalCost: rental.totalCost,
    status: rental.status,
  })
}

export async function insertPayment(payment: Omit<Payment, 'id'>): Promise<Payment> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('payments')
    .insert(paymentToRow(payment))
    .select()
    .single()
  throwOnError(error, 'Failed to add payment')
  return paymentFromRow(data as Record<string, unknown>)
}

export async function deletePayment(id: string): Promise<void> {
  const supabase = getSupabase()
  const { error } = await supabase.from('payments').delete().eq('id', id)
  throwOnError(error, 'Failed to delete payment')
}
