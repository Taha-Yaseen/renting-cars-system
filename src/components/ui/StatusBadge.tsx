import type { CarStatus, ClientStatus, RentalStatus } from '../../types'
import { useLocale } from '../../context/LocaleContext'

type AnyStatus = CarStatus | ClientStatus | RentalStatus

const styles: Record<AnyStatus, string> = {
  Available: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Rented: 'bg-indigo-50 text-indigo-700 ring-indigo-600/20',
  Maintenance: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Sold: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20',
  Active: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
  Suspended: 'bg-red-50 text-red-700 ring-red-600/20',
  Completed: 'bg-zinc-100 text-zinc-600 ring-zinc-500/20',
  Overdue: 'bg-red-50 text-red-700 ring-red-600/20',
}

interface Props {
  status: AnyStatus
}

export default function StatusBadge({ status }: Props) {
  const { t } = useLocale()

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${styles[status] ?? 'bg-zinc-100 text-zinc-600'}`}
    >
      {t(`status.${status}`) || status}
    </span>
  )
}
