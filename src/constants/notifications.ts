import type { RentalNotificationKind } from '../types'

export const CUSTOM_NOTIFICATION_KINDS = [
  'payment_due',
  'oil_change_due',
  'mechanic_fee_due',
  'other',
] as const satisfies readonly Exclude<RentalNotificationKind, 'overdue'>[]

export const NOTIFICATION_KINDS = [
  'overdue',
  ...CUSTOM_NOTIFICATION_KINDS,
] as const satisfies readonly RentalNotificationKind[]
