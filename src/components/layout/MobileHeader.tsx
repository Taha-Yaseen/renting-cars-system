import { Fuel } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'

interface Props {
  activeView: string
}

export default function MobileHeader({ activeView }: Props) {
  const { t } = useLocale()

  return (
    <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur-md lg:hidden">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-indigo-600">
        <Fuel className="h-4 w-4 text-white" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold text-zinc-900">{t('app.name')}</p>
        <p className="truncate text-xs text-zinc-500">
          {t(`nav.${activeView}`) ?? t('nav.app')}
        </p>
      </div>
      <LanguageSwitcher compact />
    </header>
  )
}
