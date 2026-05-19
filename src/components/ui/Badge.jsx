const variants = {
  active: 'border-primary/25 bg-primary-light text-primary-dark',
  present: 'border-primary/25 bg-primary-light text-primary-dark',
  approved: 'border-primary/25 bg-primary-light text-primary-dark',
  pending: 'border-amber-200 bg-amber-50 text-amber-800',
  late: 'border-orange-300 bg-orange-100 text-orange-900',
  'on-leave': 'border-neutral-300 bg-neutral-100 text-neutral-700',
  rejected: 'border-red-200 bg-red-50 text-red-700',
  inactive: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  availed: 'border-primary/25 bg-primary-light text-primary-dark',
}

export default function Badge({ status, children }) {
  const label = children ?? status
  const style = variants[status] ?? 'border-neutral-200 bg-neutral-50 text-neutral-700'

  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold capitalize leading-none ${style}`}
    >
      {label}
    </span>
  )
}
