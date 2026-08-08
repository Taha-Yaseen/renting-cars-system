import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import { useLocale } from '../../context/LocaleContext'
import Modal from './Modal'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  variant = 'default',
  onConfirm,
  onCancel,
}: Props) {
  const { t } = useLocale()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isOpen) setLoading(false)
  }, [isOpen])

  const handleCancel = () => {
    if (loading) return
    onCancel()
  }

  const handleConfirm = async () => {
    if (loading) return
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel} title={title} size="sm" preventClose={loading}>
      <p className="text-sm text-zinc-600">{message}</p>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={handleCancel}
          disabled={loading}
          className="min-h-[44px] rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {cancelLabel ?? t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          aria-busy={loading}
          className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-80 ${
            variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
          }`}
        >
          {loading && <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden />}
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}
