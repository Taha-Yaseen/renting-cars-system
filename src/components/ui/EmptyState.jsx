export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-16 text-center">
      {Icon && (
        <div className="mb-4 rounded-full bg-zinc-100 p-4">
          <Icon className="h-8 w-8 text-zinc-400" />
        </div>
      )}
      <h3 className="text-base font-semibold text-zinc-700">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-zinc-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
