import { Fuel, LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAuth } from '../../context/AuthContext'
import { useLocale } from '../../context/LocaleContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'

interface Props {
  activeView: string
}

export default function MobileHeader({ activeView }: Props) {
  const { t } = useLocale()
  const { companyName } = useApp()
  const { signOut } = useAuth()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
        <Fuel className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-zinc-900">{companyName || t('app.name')}</p>
        <p className="truncate text-xs text-zinc-500">
          {t(`nav.${activeView}`) ?? t('nav.app')}
        </p>
      </div>
      <LanguageSwitcher compact />
      <button
        type="button"
        onClick={() => void signOut()}
        className="rounded-lg border border-zinc-200 p-2 text-zinc-600 hover:bg-zinc-50"
        aria-label={t('auth.signOut')}
      >
        <LogOut className="h-4 w-4" />
      </button>
    </header>
  )
}
