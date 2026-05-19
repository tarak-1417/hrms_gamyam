const messages = [
  { from: 'HR Team', subject: 'Holiday calendar 2026', date: 'May 15', unread: true },
  { from: 'Priya Sharma', subject: '1:1 meeting follow-up', date: 'May 14', unread: false },
  { from: 'Company Announcements', subject: 'New health insurance benefits', date: 'May 10', unread: false },
]

export default function Communication() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">Internal Communication</h1>
      <ul className="space-y-2">
        {messages.map((m) => (
          <li
            key={m.subject}
            className={`rounded-xl border px-5 py-4 ${m.unread ? 'border-primary/30 bg-primary-light/50' : 'border-border bg-surface-elevated'}`}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-foreground">{m.subject}</p>
                <p className="text-sm text-muted">From {m.from}</p>
              </div>
              <span className="shrink-0 text-xs text-muted">{m.date}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
