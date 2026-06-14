/** @typedef {'Available' | 'Rented' | 'Maintenance' | 'Sold'} CarStatus */
/** @typedef {'Active' | 'Suspended'} ClientStatus */
/** @typedef {'Active' | 'Completed' | 'Overdue'} RentalStatus */

/**
 * @typedef {Object} Car
 * @property {string} id
 * @property {string} make
 * @property {string} model
 * @property {number} year
 * @property {string} [licensePlate]
 * @property {number} dailyRate
 * @property {CarStatus} status
 * @property {number} purchaseMonth
 * @property {number} purchaseYear
 * @property {string} color
 * @property {string} [mechanicFeeDueDate]
 * @property {number} [oilChangeDueKm]
 */

/**
 * @typedef {Object} Client
 * @property {string} id
 * @property {string} fullName
 * @property {string} phone
 * @property {ClientStatus} status
 */

/**
 * @typedef {Object} Rental
 * @property {string} id
 * @property {string} carId
 * @property {string} clientId
 * @property {string} startDate
 * @property {string | null} [endDate]
 * @property {number} totalCost
 * @property {number} dailyRate
 * @property {RentalStatus} status
 */

/**
 * @typedef {Object} AppState
 * @property {Car[]} cars
 * @property {Client[]} clients
 * @property {Rental[]} rentals
 */

export {}
