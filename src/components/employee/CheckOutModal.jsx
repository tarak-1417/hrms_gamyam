import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'
import Modal from '../ui/Modal'
import LiveWorkClock from './LiveWorkClock'

export default function CheckOutModal({
  open,
  onClose,
  checkIn,
  tasks,
  onConfirm,
}) {
  const [summary, setSummary] = useState('')
  const doneTasks = tasks.filter((t) => t.done)
  const pendingTasks = tasks.filter((t) => !t.done)

  const handleSubmit = (e) => {
    e.preventDefault()
    onConfirm({
      daySummary: summary.trim(),
      tasksCompleted: doneTasks.map((t) => t.title),
    })
    setSummary('')
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="End your work day" wide>
      <form onSubmit={handleSubmit} className="space-y-5">
        <LiveWorkClock checkIn={checkIn} active size="lg" />

        <div>
          <p className="text-sm font-medium text-foreground">Tasks completed today</p>
          {doneTasks.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No tasks marked complete yet.</p>
          ) : (
            <ul className="mt-2 space-y-2">
              {doneTasks.map((t) => (
                <li key={t.id} className="flex items-center gap-2 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                  {t.title}
                </li>
              ))}
            </ul>
          )}
          {pendingTasks.length > 0 && (
            <div className="mt-3 rounded-lg border border-dashed border-border bg-surface p-3">
              <p className="text-xs font-medium text-muted">Still pending</p>
              <ul className="mt-1 space-y-1">
                {pendingTasks.map((t) => (
                  <li key={t.id} className="flex items-center gap-2 text-xs text-muted">
                    <Circle className="h-3 w-3" />
                    {t.title}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="day-summary" className="block text-sm font-medium text-foreground">
            What did you accomplish today?
          </label>
          <textarea
            id="day-summary"
            required
            rows={4}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="Summarize your work, meetings, deliverables…"
            className="mt-2 w-full rounded-xl border border-border px-3 py-2.5 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-xl border border-border py-2.5 text-sm font-medium text-muted hover:bg-surface"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Check out now
          </button>
        </div>
      </form>
    </Modal>
  )
}
