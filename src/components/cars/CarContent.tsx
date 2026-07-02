import { useState } from 'react'
import { Car, Plus, Search } from 'lucide-react'
import type { Car as CarType, CarStatus } from '../../types'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import { formatNumber } from '../../utils/format'
import { getCarRentals } from '../../utils/calculations'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import PageHeader from '../ui/PageHeader'
import CarForm from './CarForm'
import CarHistoryModal from './CarHistoryModal'
import { CAR_STATUSES } from '../../constants/carStatuses'
import CarCard from './CarCard'

interface Props {
  openAddOnMount?: boolean
}

export default function CarContent({ openAddOnMount = false }: Props) {
  const {
    cars,
    clients,
    rentals,
    oilChangeRecords,
    addCar,
    updateCar,
    toggleCarStatus,
    addOilChangeRecord,
    deleteOilChangeRecord,
  } = useApp()
  const { t, locale } = useLocale()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [modalOpen, setModalOpen] = useState(openAddOnMount)
  const [editingCar, setEditingCar] = useState<CarType | null>(null)
  const [historyCar, setHistoryCar] = useState<CarType | null>(null)

  const filtered = cars.filter((car) => {
    const q = search.toLowerCase()
    const matchesSearch =
      car.make.toLowerCase().includes(q) ||
      car.model.toLowerCase().includes(q) ||
      (car.licensePlate ?? '').toLowerCase().includes(q)
    const matchesStatus = statusFilter === 'all' || car.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const openAdd = () => {
    setEditingCar(null)
    setModalOpen(true)
  }

  const openEdit = (car: CarType) => {
    setEditingCar(car)
    setModalOpen(true)
  }

  const handleSubmit = (data: Omit<CarType, 'id'>) => {
    if (editingCar) {
      updateCar(editingCar.id, data)
    } else {
      addCar(data)
    }
    setModalOpen(false)
    setEditingCar(null)
  }

  return (
    <div>
      <PageHeader
        title={t('cars.title')}
        description={t('cars.carsCount', { count: formatNumber(cars.length, locale) })}
        action={
          <button
            type="button"
            onClick={openAdd}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-700 active:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            {t('cars.addNew')}
          </button>
        }
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder={t('cars.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-zinc-200 py-2.5 ps-10 pe-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 sm:w-auto"
        >
          <option value="all">{t('cars.allStatuses')}</option>
          {CAR_STATUSES.map((s) => (
            <option key={s} value={s}>
              {t(`status.${s}`)}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title={t('cars.noCars')}
          description={t('cars.noCarsHint')}
          action={
            <button
              type="button"
              onClick={openAdd}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('cars.addNew')}
            </button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((car) => (
            <CarCard
              key={car.id}
              car={car}
              onEdit={openEdit}
              onStatusChange={(id, status) => toggleCarStatus(id, status as CarStatus)}
              onViewHistory={setHistoryCar}
              rentalCount={getCarRentals(car.id, rentals).length}
            />
          ))}
        </div>
      )}

      <CarHistoryModal
        car={historyCar}
        rentals={rentals}
        clients={clients}
        oilChangeRecords={oilChangeRecords}
        isOpen={!!historyCar}
        onClose={() => setHistoryCar(null)}
        onAddOilChange={async (record) => {
          await addOilChangeRecord(record)
        }}
        onDeleteOilChange={deleteOilChangeRecord}
      />

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingCar(null)
        }}
        title={editingCar ? t('cars.editCar') : t('cars.addNew')}
      >
        <CarForm
          car={editingCar}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditingCar(null)
          }}
        />
      </Modal>
    </div>
  )
}
