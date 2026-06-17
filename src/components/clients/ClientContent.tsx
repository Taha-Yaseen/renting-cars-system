import { useState } from 'react'
import { Phone, Plus, Search, User, Users } from 'lucide-react'
import type { Client } from '../../types'
import { useApp } from '../../context/AppContext'
import { useLocale } from '../../context/LocaleContext'
import { formatNumber } from '../../utils/format'
import { getClientRentalCount, getClientTotalOwed } from '../../utils/calculations'
import Modal from '../ui/Modal'
import EmptyState from '../ui/EmptyState'
import PageHeader from '../ui/PageHeader'
import StatusBadge from '../ui/StatusBadge'
import ClientForm from './ClientForm'

export default function ClientContent() {
  const { clients, rentals, cars, payments, addClient, updateClient } = useApp()
  const { t, locale } = useLocale()
  const [search, setSearch] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filtered = clients.filter((client) => {
    const q = search.toLowerCase()
    return client.fullName.toLowerCase().includes(q) || client.phone.includes(q)
  })

  const rentalLabel = (count: number) =>
    count === 1 ? t('clients.rental') : t('clients.rentalsPlural')

  const handleSubmit = (data: Partial<Omit<Client, 'id'>>) => {
    if (editingClient) {
      updateClient(editingClient.id, data)
    } else {
      addClient(data as Omit<Client, 'id'>)
    }
    setModalOpen(false)
    setEditingClient(null)
  }

  return (
    <div>
      <PageHeader
        title={t('clients.title')}
        description={t('clients.count', { count: formatNumber(clients.length, locale) })}
        action={
          <button
            type="button"
            onClick={() => {
              setEditingClient(null)
              setModalOpen(true)
            }}
            className="flex min-h-[44px] items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 active:bg-indigo-800"
          >
            <Plus className="h-4 w-4" />
            {t('clients.addNew')}
          </button>
        }
      />

      <div className="relative mb-6">
        <Search className="absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          type="text"
          placeholder={t('clients.searchPlaceholder')}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-zinc-200 py-2.5 ps-10 pe-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={t('clients.noClients')}
          description={t('clients.noClientsHint')}
          action={
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              {t('clients.addNew')}
            </button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {filtered.map((client) => {
              const rentalCount = getClientRentalCount(client.id, rentals)
              return (
                <div key={client.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-50">
                        <User className="h-4 w-4 text-indigo-600" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-zinc-900">{client.fullName}</p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-sm text-zinc-500">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                          {client.phone}
                        </p>
                      </div>
                    </div>
                    <StatusBadge status={client.status} />
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-100 pt-3">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs text-zinc-500">
                        {formatNumber(rentalCount, locale)} {rentalLabel(rentalCount)}
                      </span>
                      {(() => {
                        const owed = getClientTotalOwed(client.id, rentals, cars, payments)
                        return owed > 0 ? (
                          <span className="text-xs font-medium text-red-600">
                            {t('payments.totalOwed')}: ${formatNumber(owed, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        ) : (
                          <span className="text-xs text-emerald-600">{t('payments.nothingOwed')}</span>
                        )
                      })()}
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClient(client)
                        setModalOpen(true)
                      }}
                      className="min-h-[40px] rounded-lg px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50"
                    >
                      {t('common.edit')}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-zinc-100 bg-zinc-50/80">
                    <th className="px-6 py-3 text-left font-medium text-zinc-500">{t('clients.clientCol')}</th>
                    <th className="px-6 py-3 text-left font-medium text-zinc-500">{t('clients.phone')}</th>
                    <th className="px-6 py-3 text-left font-medium text-zinc-500">{t('clients.rentals')}</th>
                    <th className="px-6 py-3 text-left font-medium text-zinc-500">{t('payments.balance')}</th>
                    <th className="px-6 py-3 text-left font-medium text-zinc-500">{t('common.status')}</th>
                    <th className="px-6 py-3 text-left font-medium text-zinc-500"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {filtered.map((client) => (
                    <tr key={client.id} className="transition hover:bg-zinc-50/50">
                      <td className="px-6 py-4 text-left">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-50">
                            <User className="h-4 w-4 text-indigo-600" />
                          </div>
                          <span className="font-medium text-zinc-900">{client.fullName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-left text-zinc-600">{client.phone}</td>
                      <td className="px-6 py-4 text-left">
                        <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700">
                          {formatNumber(getClientRentalCount(client.id, rentals), locale)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-left">
                        {(() => {
                          const owed = getClientTotalOwed(client.id, rentals, cars, payments)
                          return owed > 0 ? (
                            <span className="font-medium text-red-600">
                              ${formatNumber(owed, locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          ) : (
                            <span className="text-emerald-600">—</span>
                          )
                        })()}
                      </td>
                      <td className="px-6 py-4 text-left">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="px-6 py-4 text-left">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingClient(client)
                            setModalOpen(true)
                          }}
                          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
                        >
                          {t('common.edit')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setEditingClient(null)
        }}
        title={editingClient ? t('clients.editClient') : t('clients.addNew')}
      >
        <ClientForm
          client={editingClient}
          onSubmit={handleSubmit}
          onCancel={() => {
            setModalOpen(false)
            setEditingClient(null)
          }}
        />
      </Modal>
    </div>
  )
}
