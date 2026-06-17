import { useState } from 'react'
import { AppProvider } from './context/AppContext'
import { LocaleProvider } from './context/LocaleContext'
import Layout from './components/layout/Layout'
import Dashboard from './components/dashboard/Dashboard'
import CarContent from './components/cars/CarContent'
import ClientContent from './components/clients/ClientContent'
import RentalContent from './components/rentals/RentalContent'

function AppShell() {
  const [activeView, setActiveView] = useState('dashboard')
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

export default function App() {
  return (
    <LocaleProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </LocaleProvider>
  )
}
