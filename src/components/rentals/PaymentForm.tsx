import { useState } from 'react'
import type { Payment, Rental } from '../../types'
import { useLocale } from '../../context/LocaleContext'
import { formatNumber } from '../../utils/format'
import { todayISO } from '../../utils/dates'

interface Props {
  rental: Rental
  paidAmount: number
  totalCost: number
  onSubmit: (payment: Omit<Payment, 'id'>) => Promise<void>
  onCancel: () => void
}

export default function PaymentForm({ rental, paidAmount, totalCost, onSubmit, onCancel }: Props) {
  const { t, locale } = useLocale()
  const remaining = Math.max(0, totalCost - paidAmount)

  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed = parseFloat(amount)
    if (!amount || isNaN(parsed) || parsed <= 0) {
      setError(t('payments.errors.amountRequired'))
      return
    }
    if (!date) {
      setError(t('payments.errors.dateRequired'))
      return
    }

    setSubmitting(true)
    await onSubmit({
      rentalId: rental.id,
      clientId: rental.clientId,
      amount: parsed,
      date,
      note: note.trim() || undefined,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="rounded-lg bg-zinc-50 px-4 py-3 text-sm">
        <div className="flex justify-between">
          <span className="text-zinc-500">{t('rentals.totalCost')}</span>
          <span className="font-medium text-zinc-900">
            ${formatNumber(totalCost, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-1 flex justify-between">
          <span className="text-zinc-500">{t('payments.paid')}</span>
          <span className="font-medium text-emerald-700">
            ${formatNumber(paidAmount, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="mt-1 flex justify-between border-t border-zinc-200 pt-1">
          <span className="font-medium text-zinc-700">{t('payments.owed')}</span>
          <span className={`font-bold ${remaining > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
            ${formatNumber(remaining, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {t('payments.amount')}
        </label>
        <input
          type="number"
          min="0.01"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {t('payments.date')}
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {t('payments.note')}{' '}
          <span className="font-normal text-zinc-400">({t('common.optional')})</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('payments.notePlaceholder')}
          className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <div className="flex gap-3 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {submitting ? '…' : t('payments.recordPayment')}
        </button>
      </div>
    </form>
  )
}
