import type { LucideIcon } from 'lucide-react'

type Accent = 'indigo' | 'emerald' | 'amber' | 'violet'

interface Props {
  icon: LucideIcon
  label: string
  value: string
  subtext?: string
  accent?: Accent
}

const accents: Record<Accent, string> = {
  indigo: 'bg-indigo-50 text-indigo-600',
  emerald: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
}

export default function KpiCard({ icon: Icon, label, value, subtext, accent = 'indigo' }: Props) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs font-medium text-zinc-500 sm:text-sm">{label}</p>
          <p className="mt-1 text-lg font-bold tracking-tight text-zinc-900 sm:text-2xl">{value}</p>
          {subtext && <p className="mt-0.5 text-[10px] text-zinc-400 sm:mt-1 sm:text-xs">{subtext}</p>}
        </div>
        <div className={`shrink-0 rounded-lg p-2 sm:p-2.5 ${accents[accent]}`}>
          <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
        </div>
      </div>
    </div>
  )
}
