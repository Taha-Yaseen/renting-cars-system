import { Languages } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'

interface Props {
  compact?: boolean
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const { locale, setLocale, t } = useLocale()

  const toggle = () => setLocale(locale === 'en' ? 'ar' : 'en')

  if (compact) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
        aria-label={t('language.switch')}
      >
        {locale === 'en' ? 'عربي' : 'EN'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 hover:text-zinc-900"
      aria-label={t('language.switch')}
    >
      <Languages className="h-5 w-5 text-zinc-400" />
      <span>{locale === 'en' ? t('language.ar') : t('language.en')}</span>
    </button>
  )
}
