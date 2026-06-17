import { useLocale } from '../../context/LocaleContext'

function LoadingCar() {
  return (
    <svg viewBox="0 0 120 48" className="h-12 w-[7.5rem] drop-shadow-md" aria-hidden="true">
      <rect x="8" y="22" width="88" height="14" rx="6" fill="#4f46e5" />
      <path d="M24 22 L34 10 L78 10 L92 22 Z" fill="#6366f1" />
      <rect x="38" y="12" width="22" height="10" rx="2" fill="#c7d2fe" opacity="0.9" />
      <rect x="64" y="12" width="18" height="10" rx="2" fill="#c7d2fe" opacity="0.7" />
      <circle cx="30" cy="38" r="7" fill="#27272a" />
      <circle cx="30" cy="38" r="3.5" fill="#71717a" />
      <circle cx="88" cy="38" r="7" fill="#27272a" />
      <circle cx="88" cy="38" r="3.5" fill="#71717a" />
      <rect x="94" y="24" width="6" height="4" rx="1" fill="#fbbf24" />
      <rect x="6" y="24" width="4" height="6" rx="1" fill="#fca5a5" />
    </svg>
  )
}

export default function LoadingScreen() {
  const { t, isRtl } = useLocale()
  const label = `${t('loading.title')} ${t('loading.message')}`

  return (
    <div
      className="flex h-dvh flex-col items-center justify-center bg-gradient-to-b from-sky-100 via-zinc-50 to-indigo-50/40 px-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      <div className="w-full max-w-sm">
        <div
          className={`relative overflow-hidden rounded-2xl border border-zinc-200/80 bg-white/80 px-6 pb-6 pt-8 shadow-sm backdrop-blur-sm ${isRtl ? '[direction:ltr]' : ''}`}
        >
          <div className="pointer-events-none absolute -right-6 -top-4 h-16 w-24 rounded-full bg-white/70 blur-sm" aria-hidden="true" />
          <div className="pointer-events-none absolute -left-4 top-6 h-10 w-20 rounded-full bg-white/60 blur-sm" aria-hidden="true" />

          <div className={`relative mx-auto h-28 w-full max-w-[17rem] ${isRtl ? 'scale-x-[-1]' : ''}`}>
            <div className="absolute inset-x-0 bottom-0 h-16 overflow-hidden rounded-xl bg-zinc-600 shadow-inner">
              <div className="absolute inset-x-0 top-0 h-3 bg-zinc-500/80" />
              <div className="absolute inset-x-3 top-1/2 h-1 -translate-y-1/2 overflow-hidden">
                <div className="loading-road-lanes flex w-max gap-5">
                  {Array.from({ length: 24 }, (_, i) => (
                    <span
                      key={i}
                      className="inline-block h-1 w-8 shrink-0 rounded-full bg-amber-200/90"
                    />
                  ))}
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 h-1 bg-zinc-700" />
            </div>

            <div className="absolute bottom-7 left-1/2 z-10 -translate-x-1/2">
              <div className="loading-car">
                <LoadingCar />
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-base font-semibold text-zinc-800">{t('loading.title')}</p>
          <p className="mt-1 text-sm text-zinc-500">{t('loading.message')}</p>
          <div className="mt-4 flex justify-center gap-1.5" aria-hidden="true">
            <span className="loading-dot h-2 w-2 rounded-full bg-indigo-500" />
            <span className="loading-dot h-2 w-2 rounded-full bg-indigo-500 [animation-delay:150ms]" />
            <span className="loading-dot h-2 w-2 rounded-full bg-indigo-500 [animation-delay:300ms]" />
          </div>
        </div>
      </div>
    </div>
  )
}
