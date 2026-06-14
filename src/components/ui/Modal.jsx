import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'

export default function Modal({ isOpen, onClose, title, children, size = 'md' }) {
  const { t } = useLocale()

  useEffect(() => {
    if (!isOpen) return
    const handleEsc = (e) => e.key === 'Escape' && onClose()
    document.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
  }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <div
        className="absolute inset-0 bg-zinc-900/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={`relative flex max-h-[min(92dvh,100%)] w-full flex-col rounded-t-2xl bg-white shadow-2xl ring-1 ring-zinc-200 sm:max-h-[90vh] sm:rounded-xl ${sizeClass}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-zinc-100 px-4 py-4 sm:px-6">
          <h2 id="modal-title" className="pe-4 text-lg font-semibold text-zinc-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="-me-1 rounded-lg p-2 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600 touch-manipulation"
            aria-label={t('common.close')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5">
          {children}
        </div>
      </div>
    </div>
  )
}
