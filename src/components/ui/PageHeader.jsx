export default function PageHeader({ title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-zinc-900 sm:text-2xl">{title}</h2>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {action && <div className="shrink-0 [&_button]:w-full sm:[&_button]:w-auto">{action}</div>}
    </div>
  )
}
