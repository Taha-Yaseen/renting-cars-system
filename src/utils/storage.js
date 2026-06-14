import { initialState } from '../data/mockData'

const STORAGE_KEY = 'driverent-app-state'

/** @returns {import('../types').AppState} */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw)
    if (parsed?.cars && parsed?.clients && parsed?.rentals) {
      return parsed
    }
    return initialState
  } catch {
    return initialState
  }
}

/** @param {import('../types').AppState} state */
export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
