import { useLocale } from '../../context/LocaleContext'
import Modal from './Modal'

interface Props {
  isOpen: boolean
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'danger' | 'default'
  onConfirm: () => void
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

  return (
    <Modal isOpen={isOpen} onClose={onCancel} title={title} size="sm">
      <p className="text-sm text-zinc-600">{message}</p>
      <div className="mt-5 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="min-h-[44px] rounded-lg border border-zinc-200 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          {cancelLabel ?? t('common.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`min-h-[44px] rounded-lg px-4 py-2 text-sm font-medium text-white ${
            variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700 active:bg-red-800'
              : 'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800'
          }`}
        >
          {confirmLabel ?? t('common.confirm')}
        </button>
      </div>
    </Modal>
  )
}
