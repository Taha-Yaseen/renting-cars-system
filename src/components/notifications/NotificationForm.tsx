import { useState } from 'react'
import type { FormEvent } from 'react'
import type { Rental, RentalNotificationKind } from '../../types'
import { CUSTOM_NOTIFICATION_KINDS } from '../../constants/notifications'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import { todayISO } from '../../utils/dates'

interface SubmitPayload {
  rentalId: string
  kind: Exclude<RentalNotificationKind, 'overdue'>
  dueDate: string
  note?: string
}

interface Props {
  rentalId?: string
  embedded?: boolean
  onSubmit: (data: SubmitPayload) => Promise<boolean>
  onCancel?: () => void
}

export default function NotificationForm({ rentalId, embedded = false, onSubmit, onCancel }: Props) {
  const { rentals, cars, clients } = useApp()
  const { t } = useLocale()
  const [form, setForm] = useState({
    rentalId: rentalId ?? '',
    kind: '' as '' | Exclude<RentalNotificationKind, 'overdue'>,
    dueDate: todayISO(),
    note: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const rentalOptions = [...rentals].sort((a, b) => b.startDate.localeCompare(a.startDate))

  const rentalLabel = (rental: Rental) => {
    const car = cars.find((c) => c.id === rental.carId)
    const client = clients.find((c) => c.id === rental.clientId)
    const carText = car ? `${car.make} ${car.model}` : t('rentals.unknownCar')
    const clientText = client?.fullName ?? t('common.unknown')
    return `${carText} · ${clientText}`
  }

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.rentalId) next.rentalId = t('notifications.errors.rentalRequired')
    if (!form.kind) next.kind = t('notifications.errors.kindRequired')
    if (!form.dueDate) next.dueDate = t('notifications.errors.dueRequired')
    if (form.kind === 'other' && !form.note.trim()) {
      next.note = t('notifications.errors.noteRequired')
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault()
    if (!validate() || !form.kind) return
    setSubmitting(true)
    const ok = await onSubmit({
      rentalId: form.rentalId,
      kind: form.kind,
      dueDate: form.dueDate,
      note: form.note.trim() || undefined,
    })
    setSubmitting(false)
    if (ok) {
      setForm({
        rentalId: rentalId ?? '',
        kind: '',
        dueDate: todayISO(),
        note: '',
      })
      setErrors({})
    }
  }

  const fields = (
    <>
      {!rentalId && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {t('notifications.rental')}
          </label>
          <select
            value={form.rentalId}
            onChange={(e) => setForm({ ...form, rentalId: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.rentalId ? 'border-red-300' : 'border-zinc-200'}`}
          >
            <option value="">{t('notifications.selectRental')}</option>
            {rentalOptions.map((rental) => (
              <option key={rental.id} value={rental.id}>
                {rentalLabel(rental)}
              </option>
            ))}
          </select>
          {errors.rentalId && <p className="mt-1 text-xs text-red-500">{errors.rentalId}</p>}
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {t('notifications.kind')}
          </label>
          <select
            value={form.kind}
            onChange={(e) =>
              setForm({
                ...form,
                kind: e.target.value as '' | Exclude<RentalNotificationKind, 'overdue'>,
              })
            }
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.kind ? 'border-red-300' : 'border-zinc-200'}`}
          >
            <option value="">{t('notifications.selectKind')}</option>
            {CUSTOM_NOTIFICATION_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {t(`notifications.kinds.${kind}`)}
              </option>
            ))}
          </select>
          {errors.kind && <p className="mt-1 text-xs text-red-500">{errors.kind}</p>}
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {t('notifications.dueDate')}
          </label>
          <input
            type="date"
            value={form.dueDate}
            onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.dueDate ? 'border-red-300' : 'border-zinc-200'}`}
          />
          {errors.dueDate && <p className="mt-1 text-xs text-red-500">{errors.dueDate}</p>}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {t('notifications.note')}
          {form.kind !== 'other' && (
            <span className="ms-1 font-normal text-zinc-400">({t('common.optional')})</span>
          )}
        </label>
        <input
          type="text"
          value={form.note}
          onChange={(e) => setForm({ ...form, note: e.target.value })}
          placeholder={
            form.kind === 'other'
              ? t('notifications.otherNotePlaceholder')
              : t('notifications.notePlaceholder')
          }
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none ${errors.note ? 'border-red-300' : 'border-zinc-200'}`}
        />
        {errors.note && <p className="mt-1 text-xs text-red-500">{errors.note}</p>}
      </div>
    </>
  )

  const actions = (
    <div className={`flex gap-3 ${embedded ? 'pt-1' : 'pt-1'}`}>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {t('common.cancel')}
        </button>
      )}
      <button
        type={embedded ? 'button' : 'submit'}
        onClick={embedded ? () => void handleSubmit() : undefined}
        disabled={submitting}
        className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
      >
        {submitting ? '…' : t('notifications.add')}
      </button>
    </div>
  )

  if (embedded) {
    return (
      <div className="space-y-3">
        {fields}
        {actions}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {fields}
      {actions}
    </form>
  )
}
