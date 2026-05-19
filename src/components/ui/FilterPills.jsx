export default function FilterPills({ label, options, value, onChange }) {
  return (
    <div>
      {label && <p className="mb-2 text-xs font-medium text-muted">{label}</p>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              value === opt.value
                ? 'bg-primary text-white'
                : 'bg-surface text-muted ring-1 ring-border hover:text-foreground'
            }`}
          >
            {opt.label}
            {opt.count != null && (
              <span className={`ml-1 ${value === opt.value ? 'text-white/80' : 'text-muted'}`}>
                ({opt.count})
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  )
}
