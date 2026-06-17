import type { AppState } from '../types'
import { initialState } from '../data/mockData'

const STORAGE_KEY = 'driverent-app-state'

export function loadState(): AppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return initialState
    const parsed = JSON.parse(raw) as unknown
    if (
      parsed != null &&
      typeof parsed === 'object' &&
      'cars' in parsed &&
      'clients' in parsed &&
      'rentals' in parsed
    ) {
      return parsed as AppState
    }
    return initialState
  } catch {
    return initialState
  }
}

export function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore quota errors
  }
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
}
