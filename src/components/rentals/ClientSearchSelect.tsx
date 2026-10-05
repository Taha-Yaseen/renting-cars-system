import { useEffect, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent } from 'react'
import { ChevronDown, UserPlus } from 'lucide-react'
import type { Client } from '../../types'
import { useLocale } from '../../context/LocaleContext'

interface Props {
  clients: Client[]
  value: string
  onChange: (clientId: string) => void
  onAddNew: () => void
  error?: boolean
}

export default function ClientSearchSelect({ clients, value, onChange, onAddNew, error }: Props) {
  const { t, locale } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [highlighted, setHighlighted] = useState(0)

  const selected = clients.find((client) => client.id === value)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? clients.filter(
          (client) =>
            client.fullName.toLowerCase().includes(q) || client.phone.toLowerCase().includes(q),
        )
      : clients
    return [...list].sort((a, b) => a.fullName.localeCompare(b.fullName, locale))
  }, [clients, query, locale])

  useEffect(() => {
    setHighlighted(0)
  }, [query])

  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false)
        setQuery('')
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector('[data-highlighted="true"]')
    el?.scrollIntoView({ block: 'nearest' })
  }, [highlighted, open, filtered])

  const selectClient = (clientId: string) => {
    onChange(clientId)
    setQuery('')
    setOpen(false)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        setOpen(true)
        return
      }
      setHighlighted((index) => Math.min(index + 1, Math.max(filtered.length - 1, 0)))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => Math.max(index - 1, 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && filtered[highlighted]) selectClient(filtered[highlighted].id)
    } else if (event.key === 'Escape') {
      setOpen(false)
      setQuery('')
    }
  }

  const displayValue = open ? query : selected?.fullName ?? ''

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
        aria-controls="rental-client-list"
        value={displayValue}
        placeholder={t('rentals.searchClientPlaceholder')}
        autoComplete="off"
        onFocus={() => {
          setOpen(true)
          setQuery('')
        }}
        onChange={(e) => {
          setQuery(e.target.value)
          setOpen(true)
          if (value) onChange('')
        }}
        onKeyDown={handleKeyDown}
        className={`w-full rounded-lg border px-3 py-2 pe-9 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          error ? 'border-red-300' : 'border-zinc-200'
        }`}
      />
      <ChevronDown
        className={`pointer-events-none absolute end-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400 transition ${
          open ? 'rotate-180' : ''
        }`}
      />

      {open && (
        <div
          id="rental-client-list"
          role="listbox"
          ref={listRef}
          onWheel={(e) => e.stopPropagation()}
          className="absolute z-30 mt-1 max-h-60 w-full overflow-y-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
        >
          {filtered.length === 0 ? (
            <p className="px-3 py-2 text-sm text-zinc-500">{t('rentals.noClientsMatch')}</p>
          ) : (
            filtered.map((client, index) => {
              const isSelected = client.id === value
              const isHighlighted = index === highlighted
              return (
                <button
                  key={client.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  data-highlighted={isHighlighted}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => selectClient(client.id)}
                  className={`flex w-full flex-col items-start px-3 py-2 text-start text-sm ${
                    isHighlighted || isSelected ? 'bg-indigo-50 text-indigo-800' : 'text-zinc-800'
                  }`}
                >
                  <span className="font-medium">{client.fullName}</span>
                  <span className="text-xs text-zinc-500">{client.phone}</span>
                </button>
              )
            })
          )}
          <button
            type="button"
            onClick={() => {
              setOpen(false)
              setQuery('')
              onAddNew()
            }}
            className="flex w-full items-center gap-1.5 border-t border-zinc-100 px-3 py-2 text-start text-sm font-medium text-indigo-700 hover:bg-indigo-50"
          >
            <UserPlus className="h-3.5 w-3.5" />
            {t('rentals.addNewClient')}
          </button>
        </div>
      )}
    </div>
  )
}
