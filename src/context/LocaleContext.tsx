import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import en from '../i18n/translations/en'
import ar from '../i18n/translations/ar'

const STORAGE_KEY = 'driverent-locale'

type Locale = 'en' | 'ar'
type TranslationVars = Record<string, string | number>
type TFunction = (key: string, vars?: TranslationVars) => string

interface LocaleContextValue {
  locale: Locale
  dir: 'ltr' | 'rtl'
  isRtl: boolean
  setLocale: (locale: Locale) => void
  t: TFunction
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

const translations = { en, ar }

function getNested(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc != null && typeof acc === 'object') {
      return (acc as Record<string, unknown>)[key]
    }
    return undefined
  }, obj)
}

function interpolate(str: string, vars: TranslationVars = {}): string {
  if (!str) return ''
  return str.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(vars[key] ?? ''))
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'ar' || saved === 'en' ? saved : 'en'
  })

  const dir = locale === 'ar' ? 'rtl' : 'ltr'

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, locale)
    document.documentElement.lang = locale
    document.documentElement.dir = dir
    document.title = translations[locale].app.title
  }, [locale, dir])

  const t = useCallback<TFunction>(
    (key, vars) => {
      const value =
        getNested(translations[locale] as unknown as Record<string, unknown>, key) ??
        getNested(translations.en as unknown as Record<string, unknown>, key) ??
        key
      return typeof value === 'string' ? interpolate(value, vars) : key
    },
    [locale],
  )

  const value = useMemo<LocaleContextValue>(
    () => ({
      locale,
      dir,
      isRtl: dir === 'rtl',
      setLocale,
      t,
    }),
    [locale, dir, t],
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
