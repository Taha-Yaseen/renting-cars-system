import { useEffect, useRef, useState } from 'react'
import { AppProvider } from './context/AppContext'
import { useApp } from './context/AppContext'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LocaleProvider, useLocale } from './context/LocaleContext'
import { isSupabaseConfigured } from './lib/supabase'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import CarContent from './components/cars/CarContent'
import ClientContent from './components/clients/ClientContent'
import RentalContent from './components/rentals/RentalContent'
import LoginPage from './components/auth/LoginPage'
import AdminDashboard from './components/admin/AdminDashboard'
import LoadingScreen from './components/ui/LoadingScreen'
import LanguageSwitcher from './components/ui/LanguageSwitcher'
import { displayUsername } from './lib/usernameAuth'

function AppShell() {
  const { refetch } = useApp()
  const [activeView, setActiveView] = useState('dashboard')
  const mounted = useRef(false)

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    refetch()
  }, [activeView, refetch])
  const [openCarModal, setOpenCarModal] = useState(false)
  const [openRentalModal, setOpenRentalModal] = useState(false)

  const renderView = () => {
    switch (activeView) {
      case 'dashboard':
        return (
          <Dashboard
            onNavigate={setActiveView}
            onNewRental={() => {
              setOpenRentalModal(true)
              setActiveView('rentals')
            }}
            onAddCar={() => {
              setOpenCarModal(true)
              setActiveView('cars')
            }}
          />
        )
      case 'cars':
        return (
          <CarContent
            openAddOnMount={openCarModal}
            key={openCarModal ? 'car-open' : 'car'}
          />
        )
      case 'clients':
        return <ClientContent />
      case 'rentals':
        return (
          <RentalContent
            openAddOnMount={openRentalModal}
            key={openRentalModal ? 'rental-open' : 'rental'}
          />
        )
      default:
        return <Dashboard onNavigate={setActiveView} />
    }
  }

  const handleNavigate = (view: string) => {
    if (view !== 'cars') setOpenCarModal(false)
    if (view !== 'rentals') setOpenRentalModal(false)
    setActiveView(view)
  }

  return (
    <Layout activeView={activeView} onNavigate={handleNavigate}>
      {renderView()}
    </Layout>
  )
}

function NoCompanyAccess() {
  const { t } = useLocale()
  const { signOut, user } = useAuth()
  const username = displayUsername(user)

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-lg font-bold text-zinc-900">{t('auth.noCompanyTitle')}</h1>
        <p className="mt-2 text-sm text-zinc-600">{t('auth.noCompanyMessage')}</p>
        {username && (
          <p className="mt-3 text-xs text-zinc-500">{username}</p>
        )}
        <button
          type="button"
          onClick={() => void signOut()}
          className="mt-6 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          {t('auth.signOut')}
        </button>
      </div>
    </div>
  )
}

function ConfigMissing() {
  const { t } = useLocale()

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-zinc-50 px-4">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <h1 className="text-lg font-bold text-amber-950">{t('auth.configMissingTitle')}</h1>
        <p className="mt-2 text-sm text-amber-900">{t('auth.configMissingMessage')}</p>
      </div>
    </div>
  )
}

function Root() {
  const { loading, membershipReady, session, isPlatformAdmin, companyId } = useAuth()

  if (!isSupabaseConfigured()) {
    return <ConfigMissing />
  }

  if (loading || (session && !membershipReady)) {
    return <LoadingScreen />
  }

  if (!session) {
    return <LoginPage />
  }

  if (isPlatformAdmin) {
    return <AdminDashboard />
  }

  if (!companyId) {
    return <NoCompanyAccess />
  }

  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  )
}

export default function App() {
  return (
    <LocaleProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </LocaleProvider>
  )
}
