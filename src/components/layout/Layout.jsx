import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import MobileHeader from './MobileHeader'

export default function Layout({ activeView, onNavigate, children }) {
  return (
    <div className="flex h-dvh overflow-hidden lg:h-auto lg:min-h-screen lg:overflow-visible">
      <Sidebar activeView={activeView} onNavigate={onNavigate} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <MobileHeader activeView={activeView} />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:overflow-visible lg:flex-none lg:pb-0">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </div>
        </main>
        <MobileNav activeView={activeView} onNavigate={onNavigate} />
      </div>
    </div>
  )
}
