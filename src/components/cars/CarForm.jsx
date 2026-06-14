import { useState } from 'react'
import { CAR_COLORS } from '../../constants/carColors'
import { CAR_STATUSES } from '../../constants/carStatuses'
import { useLocale } from '../../context/LocaleContext'

const emptyForm = {
  make: '',
  model: '',
  year: new Date().getFullYear(),
  licensePlate: '',
  dailyRate: '',
  status: 'Available',
  purchaseMonth: new Date().getMonth() + 1,
  purchaseYear: new Date().getFullYear(),
  color: 'white',
  mechanicFeeDueDate: '',
  oilChangeDueKm: '',
}

export default function CarForm({ car, onSubmit, onCancel }) {
  const { t } = useLocale()
  const [form, setForm] = useState(() => {
    if (!car) return { ...emptyForm }
    return {
      ...emptyForm,
      ...car,
      licensePlate: car.licensePlate ?? '',
      mechanicFeeDueDate: car.mechanicFeeDueDate ?? '',
      oilChangeDueKm: car.oilChangeDueKm ?? '',
    }
  })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.make.trim()) e.make = t('cars.errors.makeRequired')
    if (!form.model.trim()) e.model = t('cars.errors.modelRequired')
    if (!form.year || form.year < 1990 || form.year > 2030) e.year = t('cars.errors.yearRequired')
    if (!form.dailyRate || form.dailyRate <= 0) e.dailyRate = t('cars.errors.rateRequired')
    if (!form.purchaseMonth || form.purchaseMonth < 1 || form.purchaseMonth > 12) {
      e.purchaseMonth = t('cars.errors.purchaseMonthRequired')
    }
    const currentYear = new Date().getFullYear()
    if (!form.purchaseYear || form.purchaseYear < 1990 || form.purchaseYear > currentYear) {
      e.purchaseYear = t('cars.errors.purchaseYearRequired')
    }
    if (!form.color) e.color = t('cars.errors.colorRequired')
    if (form.oilChangeDueKm && Number(form.oilChangeDueKm) <= 0) {
      e.oilChangeDueKm = t('cars.errors.oilChangeDueKmRequired')
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    onSubmit({
      ...form,
      year: Number(form.year),
      dailyRate: Number(form.dailyRate),
      purchaseMonth: Number(form.purchaseMonth),
      purchaseYear: Number(form.purchaseYear),
      licensePlate: form.licensePlate.trim() || null,
      mechanicFeeDueDate: form.mechanicFeeDueDate || null,
      oilChangeDueKm: form.oilChangeDueKm ? Number(form.oilChangeDueKm) : null,
    })
  }

  const requiredMark = <span className="text-red-500"> *</span>

  const field = (name, label, type = 'text', { required = false, ...props } = {}) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        {required && requiredMark}
      </label>
      <input
        type={type}
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${errors[name] ? 'border-red-300' : 'border-zinc-200 focus:border-indigo-500'
          }`}
        {...props}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('make', t('cars.make'), 'text', { required: true })}
        {field('model', t('cars.model'), 'text', { required: true })}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('year', t('cars.year'), 'number', { required: true, min: 1990, max: 2030 })}
        {field('licensePlate', t('cars.licensePlate'))}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-zinc-700">
          {t('cars.color')}
          {requiredMark}
        </label>
        <select
          value={form.color}
          onChange={(e) => setForm({ ...form, color: e.target.value })}
          className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${errors.color ? 'border-red-300' : 'border-zinc-200 focus:border-indigo-500'
            }`}
        >
          {CAR_COLORS.map(({ value }) => (
            <option key={value} value={value}>
              {t(`carColors.${value}`)}
            </option>
          ))}
        </select>
        <div className="mt-2 flex items-center gap-2">
          <span
            className="h-5 w-5 rounded-full border border-zinc-200"
            style={{ backgroundColor: CAR_COLORS.find((c) => c.value === form.color)?.hex }}
          />
          <span className="text-xs text-zinc-500">{t(`carColors.${form.color}`)}</span>
        </div>
        {errors.color && <p className="mt-1 text-xs text-red-500">{errors.color}</p>}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">
            {t('cars.purchaseMonth')}
            {requiredMark}
          </label>
          <select
            value={form.purchaseMonth}
            onChange={(e) => setForm({ ...form, purchaseMonth: e.target.value })}
            className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${errors.purchaseMonth ? 'border-red-300' : 'border-zinc-200 focus:border-indigo-500'
              }`}
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {t(`months.${m}`)}
              </option>
            ))}
          </select>
          {errors.purchaseMonth && <p className="mt-1 text-xs text-red-500">{errors.purchaseMonth}</p>}
        </div>
        {field('purchaseYear', t('cars.purchaseYear'), 'number', {
          required: true,
          min: 1990,
          max: new Date().getFullYear(),
        })}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {field('dailyRate', t('cars.dailyRate'), 'number', { required: true, min: 1, step: 0.01 })}
        {field('mechanicFeeDueDate', t('cars.mechanicFeeDueDate'), 'date')}
      </div>
      {field('oilChangeDueKm', t('cars.oilChangeDueKm'), 'number', { min: 1, step: 1 })}
      {car && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">{t('common.status')}</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            {CAR_STATUSES.map((s) => (
              <option key={s} value={s} disabled={form.status === 'Rented' && s !== 'Rented'}>
                {t(`status.${s}`)}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700"
        >
          {car ? t('common.saveChanges') : t('cars.addCar')}
        </button>
      </div>
    </form>
  )
}
