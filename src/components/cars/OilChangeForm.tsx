import { useState } from 'react'
import type { Car, OilChangeRecord } from '../../types'
import { useLocale } from '../../context/LocaleContext'
import { todayISO } from '../../utils/dates'

interface Props {
  car: Car
  onSubmit: (record: Omit<OilChangeRecord, 'id'>) => Promise<void>
  onCancel: () => void
}

export default function OilChangeForm({ car, onSubmit, onCancel }: Props) {
  const { t } = useLocale()

  const [date, setDate] = useState(todayISO())
  const [distance, setDistance] = useState('')
  const [distanceUnit, setDistanceUnit] = useState<'km' | 'mile'>(car.oilChangeDistanceUnit ?? 'km')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    const parsed = parseFloat(distance)
    if (!distance || isNaN(parsed) || parsed <= 0) {
      setError(t('oilChangeRecords.errors.distanceRequired'))
      return
    }
    if (!date) {
      setError(t('oilChangeRecords.errors.dateRequired'))
      return
    }

    setSubmitting(true)
    await onSubmit({
      carId: car.id,
      date,
      distance: parsed,
      distanceUnit,
      note: note.trim() || undefined,
    })
    setSubmitting(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {t('oilChangeRecords.date')}
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
          {t('oilChangeRecords.distance')}
        </label>
        <div className="flex gap-2">
          <input
            type="number"
            min="1"
            step="1"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            placeholder="0"
            className="flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
          <select
            value={distanceUnit}
            onChange={(e) => setDistanceUnit(e.target.value as 'km' | 'mile')}
            className="w-20 rounded-lg border border-zinc-200 px-2 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="km">{t('cars.unitKm')}</option>
            <option value="mile">{t('cars.unitMile')}</option>
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {t('oilChangeRecords.note')}{' '}
          <span className="font-normal text-zinc-400">({t('common.optional')})</span>
        </label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t('oilChangeRecords.notePlaceholder')}
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
          {submitting ? '…' : t('oilChangeRecords.recordOilChange')}
        </button>
      </div>
    </form>
  )
}
