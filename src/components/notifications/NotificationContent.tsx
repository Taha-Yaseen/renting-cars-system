import { useState } from 'react'
import { Bell, Plus, Trash2 } from 'lucide-react'
import type { RentalNotification } from '../../types'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import { formatDate, formatRentalPeriod, todayISO } from '../../utils/dates'
import { formatNumber } from '../../utils/format'
import {
  dueNotifications,
  isNotificationDue,
  sortNotificationsByDueDate,
  visibleNotifications,
} from '../../utils/notifications'
import EmptyState from '../ui/EmptyState'
import Modal from '../ui/Modal'
import PageHeader from '../ui/PageHeader'
import NotificationForm from './NotificationForm'

const FILTERS = ['due', 'upcoming', 'all'] as const
type NotificationFilter = (typeof FILTERS)[number]

function daysFromToday(iso: string, today: string): number {
  const start = new Date(`${today}T00:00:00`)
  const end = new Date(`${iso}T00:00:00`)
  return Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
}

export default function NotificationContent() {
  const { notifications, rentals, cars, clients, addNotification, deleteNotification } = useApp()
  const { t, locale } = useLocale()
  const [filter, setFilter] = useState<NotificationFilter>('due')
  const [modalOpen, setModalOpen] = useState(false)
  const today = todayISO()

  const visible = visibleNotifications(notifications, rentals)
  const due = dueNotifications(notifications, rentals, today)
  const upcoming = visible.filter((n) => n.dueDate > today)

  const filtered = sortNotificationsByDueDate(
    filter === 'due' ? due : filter === 'upcoming' ? upcoming : visible,
  )

  const getCar = (id: string) => cars.find((c) => c.id === id)
  const getClient = (id: string) => clients.find((c) => c.id === id)
  const getRental = (id: string) => rentals.find((r) => r.id === id)

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
    if (saved) setModalOpen(false)
    return Boolean(saved)
  }

  const relativeLabel = (dueDate: string) => {
    const diff = daysFromToday(dueDate, today)
    if (diff === 0) return t('notifications.dueToday')
    if (diff > 0) return t('notifications.daysUntil', { count: formatNumber(diff, locale) })
    return t('notifications.daysAgo', { count: formatNumber(Math.abs(diff), locale) })
  }

  const filterCount = (status: NotificationFilter) => {
    if (status === 'due') return due.length
    if (status === 'upcoming') return upcoming.length
    return visible.length
  }

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        description={
          filter !== 'all'
            ? t('notifications.countFiltered', {
                shown: formatNumber(filtered.length, locale),
                total: formatNumber(visible.length, locale),
              })
            : t('notifications.count', { count: formatNumber(visible.length, locale) })
        }
        action={
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            {t('notifications.add')}
          </button>
        }
      />

      <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
        {FILTERS.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => setFilter(status)}
            className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium transition touch-manipulation ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-white text-zinc-600 ring-1 ring-zinc-200 hover:bg-zinc-50'
            }`}
          >
            {t(`notifications.${status}`)}
            <span className="ms-1.5 text-xs opacity-75">
              ({formatNumber(filterCount(status), locale)})
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Bell}
          title={
            visible.length === 0
              ? t('notifications.noNotifications')
              : filter === 'due'
                ? t('notifications.noDue')
                : t('notifications.noUpcoming')
          }
          description={
            visible.length === 0
              ? t('notifications.noNotificationsHint')
              : filter === 'due'
                ? t('notifications.noDueHint')
                : undefined
          }
          action={
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('notifications.add')}
            </button>
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((notification) => {
            const rental = getRental(notification.rentalId)
            const car = rental ? getCar(rental.carId) : undefined
            const client = rental ? getClient(rental.clientId) : undefined
            const dueNow = isNotificationDue(notification.dueDate, today)
            return (
              <div
                key={notification.id}
                className={`rounded-xl border border-zinc-200 border-s-4 bg-white p-4 shadow-sm sm:p-5 ${
                  dueNow ? 'border-s-red-500' : 'border-s-indigo-500'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-zinc-900">
                        {t(`notifications.kinds.${notification.kind}`)}
                      </h3>
                      {notification.isSystem && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                          {t('notifications.automatic')}
                        </span>
                      )}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          dueNow ? 'bg-red-50 text-red-700' : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {relativeLabel(notification.dueDate)}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {car ? `${car.make} ${car.model}` : t('rentals.unknownCar')}
                      {' · '}
                      {client?.fullName ?? t('common.unknown')}
                    </p>
                    {rental && (
                      <p className="mt-0.5 text-sm text-zinc-400">
                        {formatRentalPeriod(
                          rental.startDate,
                          rental.endDate,
                          locale,
                          t('rentals.openEnded'),
                        )}
                      </p>
                    )}
                    <p className="mt-1 text-sm text-zinc-600">
                      {t('notifications.dueDate')}: {formatDate(notification.dueDate, locale)}
                    </p>
                    {notification.note && (
                      <p className="mt-1 text-sm text-zinc-500">{notification.note}</p>
                    )}
                  </div>
                  {!notification.isSystem && (
                    <button
                      type="button"
                      onClick={() => void deleteNotification(notification.id)}
                      className="rounded-lg border border-red-200 p-2 text-red-600 hover:bg-red-50"
                      aria-label={t('common.delete')}
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={t('notifications.addTitle')}
        size="md"
      >
        <NotificationForm onSubmit={handleAdd} onCancel={() => setModalOpen(false)} />
      </Modal>
    </div>
  )
}
