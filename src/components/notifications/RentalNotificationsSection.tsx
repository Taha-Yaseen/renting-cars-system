import { Bell, Trash2 } from 'lucide-react'
import type { Rental, RentalNotification } from '../../types'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import { formatDate } from '../../utils/dates'
import { isNotificationDue, sortNotificationsByDueDate } from '../../utils/notifications'
import NotificationForm from './NotificationForm'

interface Props {
  rental: Rental
  endDate: string
}

export default function RentalNotificationsSection({ rental, endDate }: Props) {
  const { notifications, addNotification, deleteNotification } = useApp()
  const { t, locale } = useLocale()

  const rentalNotifications = sortNotificationsByDueDate(
    notifications.filter((n) => n.rentalId === rental.id),
  )
  const overdueNotification = rentalNotifications.find((n) => n.isSystem)
  const customNotifications = rentalNotifications.filter((n) => !n.isSystem)
  const overdueDueDate = endDate || overdueNotification?.dueDate || ''

  const handleAdd = async (data: {
    rentalId: string
    kind: RentalNotification['kind']
    dueDate: string
    note?: string
  }) => {
    const saved = await addNotification({
      rentalId: data.rentalId,
      kind: data.kind,
      dueDate: data.dueDate,
      note: data.note,
    })
    return Boolean(saved)
  }

  return (
    <div className="space-y-3 rounded-lg border border-zinc-200 bg-zinc-50/60 p-3">
      <div>
        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-800">
          <Bell className="h-4 w-4 text-indigo-600" />
          {t('notifications.sectionTitle')}
        </p>
        <p className="mt-1 text-xs text-zinc-500">{t('notifications.sectionHint')}</p>
      </div>

      <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2.5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-medium text-zinc-800">
              {t('notifications.kinds.overdue')}
              <span className="ms-1.5 rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                {t('notifications.automatic')}
              </span>
            </p>
            {rental.status === 'Completed' ? (
              <p className="mt-0.5 text-xs text-zinc-500">{t('notifications.overdueCompleted')}</p>
            ) : overdueDueDate ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                {t('notifications.overdueDue', { date: formatDate(overdueDueDate, locale) })}
                {endDate !== (overdueNotification?.dueDate ?? '') && endDate && (
                  <span className="ms-1 text-indigo-600">{t('notifications.overdueFollowsEnd')}</span>
                )}
              </p>
            ) : (
              <p className="mt-0.5 text-xs text-zinc-500">{t('notifications.overdueOpenEnded')}</p>
            )}
          </div>
        </div>
      </div>

      {customNotifications.length > 0 && (
        <ul className="space-y-2">
          {customNotifications.map((notification) => {
            const due = isNotificationDue(notification.dueDate)
            return (
              <li
                key={notification.id}
                className="flex items-start justify-between gap-2 rounded-lg border border-zinc-200 bg-white px-3 py-2.5"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-800">
                    {t(`notifications.kinds.${notification.kind}`)}
                  </p>
                  <p className={`mt-0.5 text-xs ${due ? 'font-medium text-red-600' : 'text-zinc-500'}`}>
                    {formatDate(notification.dueDate, locale)}
                    {notification.note ? ` · ${notification.note}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void deleteNotification(notification.id)}
                  className="rounded-lg p-1.5 text-zinc-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={t('common.delete')}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            )
          })}
        </ul>
      )}

      <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-3">
        <p className="mb-2 text-xs font-medium text-zinc-600">{t('notifications.add')}</p>
        <NotificationForm embedded rentalId={rental.id} onSubmit={handleAdd} />
      </div>
    </div>
  )
}
