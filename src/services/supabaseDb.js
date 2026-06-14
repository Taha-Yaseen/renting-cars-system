import { getSupabase } from '../lib/supabase'

/** @param {Record<string, unknown>} row */
function carFromRow(row) {
  return {
    id: String(row.id),
    make: String(row.make),
    model: String(row.model),
    year: Number(row.year),
    licensePlate: row.license_plate != null ? String(row.license_plate) : undefined,
    dailyRate: Number(row.daily_rate),
    status: /** @type {import('../types').Car['status']} */ (row.status),
    purchaseMonth: row.purchase_month != null ? Number(row.purchase_month) : undefined,
    purchaseYear: row.purchase_year != null ? Number(row.purchase_year) : undefined,
    color: row.color != null ? String(row.color) : undefined,
    mechanicFeeDueDate: row.mechanic_fee_due_date != null ? String(row.mechanic_fee_due_date).slice(0, 10) : undefined,
    oilChangeDueKm: row.oil_change_due_km != null ? Number(row.oil_change_due_km) : undefined,
  }
}

/** @param {import('../types').Car} car */
function carToRow(car) {
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
  }
}

/** @param {Record<string, unknown>} row */
function clientFromRow(row) {
  return {
    id: String(row.id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    status: /** @type {import('../types').Client['status']} */ (row.status),
  }
}

/** @param {import('../types').Client} client */
function clientToRow(client) {
  return {
    full_name: client.fullName,
    phone: client.phone,
    status: client.status,
  }
}

/** @param {Record<string, unknown>} row */
function rentalFromRow(row) {
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
    status: /** @type {import('../types').Rental['status']} */ (row.status),
  }
}

/** @param {import('../types').Rental} rental */
function rentalToRow(rental) {
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

function throwOnError(error, fallbackMessage) {
  if (error) throw new Error(error.message || fallbackMessage)
}

/** @returns {Promise<import('../types').AppState>} */
export async function fetchAppState() {
  const supabase = getSupabase()
  const [carsRes, clientsRes, rentalsRes] = await Promise.all([
    supabase.from('cars').select('*').order('created_at', { ascending: true }),
    supabase.from('clients').select('*').order('created_at', { ascending: true }),
    supabase.from('rentals').select('*').order('created_at', { ascending: true }),
  ])

  throwOnError(carsRes.error, 'Failed to load cars')
  throwOnError(clientsRes.error, 'Failed to load clients')
  throwOnError(rentalsRes.error, 'Failed to load rentals')

  return {
    cars: (carsRes.data ?? []).map(carFromRow),
    clients: (clientsRes.data ?? []).map(clientFromRow),
    rentals: (rentalsRes.data ?? []).map(rentalFromRow),
  }
}

/** @param {Omit<import('../types').Car, 'id'>} car */
export async function insertCar(car) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('cars').insert(carToRow(car)).select().single()
  throwOnError(error, 'Failed to add car')
  return carFromRow(data)
}

/** @param {string} id @param {Partial<import('../types').Car>} updates */
export async function updateCar(id, updates) {
  const supabase = getSupabase()
  const row = {}
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

  const { data, error } = await supabase.from('cars').update(row).eq('id', id).select().single()
  throwOnError(error, 'Failed to update car')
  return carFromRow(data)
}

/** @param {Omit<import('../types').Client, 'id'>} client */
export async function insertClient(client) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('clients').insert(clientToRow(client)).select().single()
  throwOnError(error, 'Failed to add client')
  return clientFromRow(data)
}

/** @param {string} id @param {Partial<import('../types').Client>} updates */
export async function updateClient(id, updates) {
  const supabase = getSupabase()
  const row = {}
  if (updates.fullName != null) row.full_name = updates.fullName
  if (updates.phone != null) row.phone = updates.phone
  if (updates.status != null) row.status = updates.status

  const { data, error } = await supabase.from('clients').update(row).eq('id', id).select().single()
  throwOnError(error, 'Failed to update client')
  return clientFromRow(data)
}

/** @param {Omit<import('../types').Rental, 'id'>} rental */
export async function insertRental(rental) {
  const supabase = getSupabase()
  const { data, error } = await supabase.from('rentals').insert(rentalToRow(rental)).select().single()
  throwOnError(error, 'Failed to add rental')
  return rentalFromRow(data)
}

/** @param {string} id @param {Partial<import('../types').Rental>} updates */
export async function updateRental(id, updates) {
  const supabase = getSupabase()
  const row = {}
  if (updates.carId != null) row.car_id = updates.carId
  if (updates.clientId != null) row.client_id = updates.clientId
  if (updates.startDate != null) row.start_date = updates.startDate
  if (updates.endDate !== undefined) row.end_date = updates.endDate
  if (updates.totalCost != null) row.total_cost = updates.totalCost
  if (updates.dailyRate != null) row.daily_rate = updates.dailyRate
  if (updates.status != null) row.status = updates.status

  const { data, error } = await supabase.from('rentals').update(row).eq('id', id).select().single()
  throwOnError(error, 'Failed to update rental')
  return rentalFromRow(data)
}

/** @param {import('../types').Rental} rental @param {import('../types').Car} carUpdate */
export async function persistNewRental(rental, carUpdate) {
  const savedRental = await insertRental(rental)
  await updateCar(carUpdate.id, { status: carUpdate.status })
  return savedRental
}

/** @param {import('../types').Rental} rental @param {import('../types').Car} carUpdate */
export async function persistReturnCar(rental, carUpdate) {
  const savedRental = await updateRental(rental.id, {
    status: rental.status,
    endDate: rental.endDate,
    totalCost: rental.totalCost,
  })
  await updateCar(carUpdate.id, { status: carUpdate.status })
  return savedRental
}

/** @param {import('../types').Rental} rental */
export async function persistExtendRental(rental) {
  return updateRental(rental.id, {
    endDate: rental.endDate,
    totalCost: rental.totalCost,
    status: rental.status,
  })
}
