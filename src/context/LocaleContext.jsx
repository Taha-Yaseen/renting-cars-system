import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import en from '../i18n/translations/en'
import ar from '../i18n/translations/ar'

const STORAGE_KEY = 'driverent-locale'

const translations = { en, ar }

const LocaleContext = createContext(null)

function getNested(obj, path) {
  return path.split('.').reduce((acc, key) => acc?.[key], obj)
}

function interpolate(str, vars = {}) {
  if (!str) return ''
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(vars[key] ?? ''))
}

export function LocaleProvider({ children }) {
  const [locale, setLocale] = useState(() => {
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

  const t = useCallback(
    (key, vars) => {
      const value = getNested(translations[locale], key) ?? getNested(translations.en, key) ?? key
      return typeof value === 'string' ? interpolate(value, vars) : key
    },
    [locale]
  )

  const value = useMemo(
    () => ({
      locale,
      dir,
      isRtl: dir === 'rtl',
      setLocale,
      t,
    }),
    [locale, dir, t]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider')
  return ctx
}
