import { useState } from 'react'
import { useLocale } from '../../context/LocaleContext'

const emptyForm = {
  fullName: '',
  phone: '',
  status: 'Active',
}

const CLIENT_STATUSES = ['Active', 'Suspended']

export default function ClientForm({ client, onSubmit, onCancel }) {
  const { t } = useLocale()
  const [form, setForm] = useState(
    client
      ? { fullName: client.fullName, phone: client.phone, status: client.status }
      : { ...emptyForm },
  )
  const [errors, setErrors] = useState({})

  const validate = () => {
    const e = {}
    if (!form.fullName.trim()) e.fullName = t('clients.errors.nameRequired')
    if (!form.phone.trim()) e.phone = t('clients.errors.phoneRequired')
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!validate()) return
    const payload = {
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
    }
    if (client) payload.status = form.status
    onSubmit(payload)
  }

  const field = (name, label, type = 'text') => (
    <div>
      <label className="mb-1 block text-sm font-medium text-zinc-700">
        {label}
        <span className="text-red-500"> *</span>
      </label>
      <input
        type={type}
        required
        value={form[name]}
        onChange={(e) => setForm({ ...form, [name]: e.target.value })}
        className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition focus:ring-2 focus:ring-indigo-500/20 ${errors[name] ? 'border-red-300' : 'border-zinc-200 focus:border-indigo-500'
          }`}
      />
      {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {field('fullName', t('clients.fullName'))}
      {field('phone', t('clients.phone'), 'tel')}
      {client && (
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">{t('common.status')}</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
          >
            {CLIENT_STATUSES.map((s) => (
              <option key={s} value={s}>
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
          className="min-h-[44px] rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          {t('common.cancel')}
        </button>
        <button
          type="submit"
          className="min-h-[44px] rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          {client ? t('common.saveChanges') : t('clients.addClient')}
        </button>
      </div>
    </form>
  )
}
