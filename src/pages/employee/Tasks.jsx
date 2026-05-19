import { CheckCircle2, Circle } from 'lucide-react'
import { useHrms } from '../../hooks/useHrms'

export default function EmployeeTasks() {
  const { employeeTasks, toggleEmployeeTask } = useHrms()

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-foreground">My Tasks</h1>
      <p className="-mt-4 text-sm text-muted">Click to mark complete</p>
      <ul className="space-y-3">
        {employeeTasks.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => toggleEmployeeTask(t.id)}
              className="flex w-full items-center gap-4 rounded-xl border border-border bg-surface-elevated p-4 text-left shadow-sm hover:border-primary/30"
            >
              {t.done ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-neutral-300" />}
              <div className="flex-1">
                <p className={`font-medium ${t.done ? 'line-through text-muted' : 'text-foreground'}`}>{t.title}</p>
                <p className="text-xs text-muted">Due {t.due} · {t.priority}</p>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
