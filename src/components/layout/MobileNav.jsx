import { navItems } from '../../config/navigation'
import { useLocale } from '../../context/LocaleContext'

export default function MobileNav({ activeView, onNavigate }) {
  const { t } = useLocale()

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] lg:hidden"
      aria-label={t('nav.main')}
    >
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-1">
        {navItems.map(({ id, icon: Icon }) => {
          const isActive = activeView === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className={`flex min-h-[56px] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-[10px] font-medium transition touch-manipulation sm:text-xs ${isActive ? 'text-indigo-600' : 'text-zinc-500 active:text-zinc-700'
                }`}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`h-5 w-5 sm:h-6 sm:w-6 ${isActive ? 'text-indigo-600' : 'text-zinc-400'}`} />
              <span className="truncate">{t(`nav.${id}Short`)}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
