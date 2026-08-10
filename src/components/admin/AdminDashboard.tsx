import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Building2, LogOut, Plus, Shield } from 'lucide-react'
import type { Company } from '../../types'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import { createCompanyAccount, listCompanies } from '../../services/supabaseDb'
import LanguageSwitcher from '../ui/LanguageSwitcher'
import LoadingScreen from '../ui/LoadingScreen'

export default function AdminDashboard() {
  const { t, locale } = useLocale()
  const { signOut, user } = useAuth()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const [companyName, setCompanyName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const loadCompanies = useCallback(async () => {
    setError(null)
    try {
      const rows = await listCompanies()
      setCompanies(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.loadFailed'))
    } finally {
      setLoading(false)
    }
  }, [t])

  useEffect(() => {
    void loadCompanies()
  }, [loadCompanies])

  const onCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      await createCompanyAccount({
        companyName: companyName.trim(),
        email: email.trim(),
        password,
      })
      setCompanyName('')
      setEmail('')
      setPassword('')
      setSuccess(t('admin.createSuccess'))
      await loadCompanies()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('admin.createFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <LoadingScreen />

  const dateLocale = locale === 'ar' ? 'ar' : 'en'

  return (
    <div className="min-h-dvh bg-zinc-100">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900">
              <Shield className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-zinc-900">{t('admin.title')}</h1>
              <p className="text-xs text-zinc-500">{t('admin.subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={() => void signOut()}
              className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              <LogOut className="h-4 w-4" />
              {t('auth.signOut')}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6">
        <p className="text-sm text-zinc-600">
          {t('admin.signedInAs')}{' '}
          <span className="font-medium text-zinc-900">{user?.email}</span>
        </p>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Plus className="h-5 w-5 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900">{t('admin.createTitle')}</h2>
          </div>
          <p className="mb-6 text-sm text-zinc-500">{t('admin.createHint')}</p>

          <form onSubmit={onCreate} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="companyName" className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t('admin.companyName')}
              </label>
              <input
                id="companyName"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-zinc-800 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="ownerEmail" className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t('admin.ownerEmail')}
              </label>
              <input
                id="ownerEmail"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-zinc-800 focus:ring-2"
              />
            </div>
            <div>
              <label htmlFor="ownerPassword" className="mb-1.5 block text-sm font-medium text-zinc-700">
                {t('admin.ownerPassword')}
              </label>
              <input
                id="ownerPassword"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2.5 text-sm outline-none ring-zinc-800 focus:ring-2"
              />
            </div>
            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
              >
                {submitting ? t('admin.creating') : t('admin.createSubmit')}
              </button>
            </div>
          </form>

          {error && (
            <p role="alert" className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          {success && (
            <p role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
              {success}
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-zinc-700" />
            <h2 className="text-base font-semibold text-zinc-900">{t('admin.companiesTitle')}</h2>
          </div>

          {companies.length === 0 ? (
            <p className="text-sm text-zinc-500">{t('admin.noCompanies')}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-start text-sm">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500">
                    <th className="px-2 py-2 font-medium">{t('admin.companyName')}</th>
                    <th className="px-2 py-2 font-medium">{t('admin.ownerEmail')}</th>
                    <th className="px-2 py-2 font-medium">{t('admin.createdAt')}</th>
                  </tr>
                </thead>
                <tbody>
                  {companies.map((c) => (
                    <tr key={c.id} className="border-b border-zinc-100 text-zinc-800">
                      <td className="px-2 py-3 font-medium">{c.name}</td>
                      <td className="px-2 py-3">{c.ownerEmail || t('common.emDash')}</td>
                      <td className="px-2 py-3">
                        {new Date(c.createdAt).toLocaleDateString(dateLocale)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
