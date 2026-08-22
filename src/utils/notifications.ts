import type { Rental, RentalNotification } from '../types'
import { todayISO } from './dates'

export function isNotificationDue(dueDate: string, today = todayISO()): boolean {
  return dueDate <= today
}

export function isNotificationVisible(
  notification: RentalNotification,
  rental: Rental | undefined,
): boolean {
  if (!rental) return false
  if (notification.kind === 'overdue') {
    return rental.status !== 'Completed' && Boolean(rental.endDate)
  }
  return true
}

export function visibleNotifications(
  notifications: RentalNotification[],
  rentals: Rental[],
): RentalNotification[] {
  const rentalsById = new Map(rentals.map((rental) => [rental.id, rental]))
  return notifications.filter((notification) =>
    isNotificationVisible(notification, rentalsById.get(notification.rentalId)),
  )
}

export function dueNotifications(
  notifications: RentalNotification[],
  rentals: Rental[],
  today = todayISO(),
): RentalNotification[] {
  return visibleNotifications(notifications, rentals).filter((notification) =>
    isNotificationDue(notification.dueDate, today),
  )
}

export function replaceOverdueNotification(
  notifications: RentalNotification[],
  rentalId: string,
  overdue: RentalNotification | null,
): RentalNotification[] {
  const rest = notifications.filter(
    (notification) => !(notification.rentalId === rentalId && notification.isSystem),
  )
  return overdue ? [...rest, overdue] : rest
}

export function sortNotificationsByDueDate(
  notifications: RentalNotification[],
): RentalNotification[] {
  return [...notifications].sort((a, b) => {
    const dueDiff = a.dueDate.localeCompare(b.dueDate)
    if (dueDiff !== 0) return dueDiff
    return a.kind.localeCompare(b.kind)
  })
}
