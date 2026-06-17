import { Fuel } from 'lucide-react'
import { navItems } from '../../config/navigation'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import LanguageSwitcher from '../ui/LanguageSwitcher'

interface Props {
  activeView: string
  onNavigate: (view: string) => void
}

export default function Sidebar({ activeView, onNavigate }: Props) {
  const { t } = useLocale()
  const { useSupabase } = useApp()

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-e border-zinc-200 bg-white lg:sticky lg:top-0 lg:flex lg:h-screen lg:self-start">
      <div className="flex items-center gap-3 border-b border-zinc-100 px-6 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600">
          <Fuel className="h-5 w-5 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-zinc-900">{t('app.name')}</h1>
          <p className="text-xs text-zinc-500">{t('app.tagline')}</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4" aria-label={t('nav.main')}>
        {navItems.map(({ id, icon: Icon }) => {
          const isActive = activeView === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${isActive
                ? 'bg-indigo-50 text-indigo-700'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-5 w-5 ${isActive ? 'text-indigo-600' : 'text-zinc-400'}`} />
              {t(`nav.${id}`)}
            </button>
          )
        })}
        <div className="pt-2">
          <LanguageSwitcher />
        </div>
      </nav>

      <div className="border-t border-zinc-100 px-6 py-4">
        <p className="text-xs text-zinc-400">
          {t(useSupabase ? 'app.demoNote' : 'app.demoNoteLocal')}
        </p>
      </div>
    </aside>
  )
}
