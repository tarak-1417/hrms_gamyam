import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { buildAiContext, getAiReply } from '../../utils/hrAiAgent'
import { CHAT_STARTERS } from '../../utils/aiNavigation'
import AiAddEmployeeModal from './AiAddEmployeeModal'
import AiLeaveFormCard from './AiLeaveFormCard'

export function RobotAvatar({ small = false, pulsing = false, bare = false, animated = true }) {
  const size = small ? 'h-9 w-9' : 'h-12 w-12'
  const wiggle = pulsing || animated
  return (
    <div
      className={`relative flex shrink-0 items-center justify-center ${size} ${
        bare ? '' : 'rounded-2xl bg-white/20'
      } ${wiggle ? 'ai-robot-idle' : ''}`}
    >
      <svg viewBox="0 0 64 64" className={small ? 'h-7 w-7' : 'h-10 w-10'} aria-hidden>
        <rect x="14" y="22" width="36" height="28" rx="6" fill="#fff" />
        <rect x="20" y="8" width="24" height="18" rx="5" fill="#fff" />
        <circle className="ai-robot-eye" cx="26" cy="16" r="3" fill="#f58220" />
        <circle className="ai-robot-eye ai-robot-eye-right" cx="38" cy="16" r="3" fill="#f58220" />
        <rect x="28" y="20" width="8" height="2" rx="1" fill="#d96d12" />
        <rect x="8" y="28" width="6" height="14" rx="2" fill="#fff" />
        <rect x="50" y="28" width="6" height="14" rx="2" fill="#fff" />
        <rect x="22" y="52" width="8" height="6" rx="2" fill="#fff" />
        <rect x="34" y="52" width="8" height="6" rx="2" fill="#fff" />
        <line x1="32" y1="4" x2="32" y2="8" stroke="#fff" strokeWidth="2" />
        <circle className="ai-antenna-dot" cx="32" cy="3" r="2" fill="#f58220" />
      </svg>
    </div>
  )
}

function ThinkingBubble() {
  return (
    <div className="ai-msg flex justify-start">
      <div className="flex items-center gap-2 rounded-2xl bg-surface px-4 py-3 ring-1 ring-border">
        <RobotAvatar small animated={false} />
        <span className="flex items-center gap-0.5 pt-1" aria-label="Thinking">
          <span className="ai-thinking-dot" />
          <span className="ai-thinking-dot" />
          <span className="ai-thinking-dot" />
        </span>
      </div>
    </div>
  )
}

const GREETING = {
  admin: 'any employee, leave, payroll, attendance, jobs, or documents—and I can open pages for you',
  manager: 'your team, approvals, attendance, or say "who is late today"',
  superadmin: 'companies, subscriptions, platform stats, or navigation',
  employee: 'your leave, salary, tasks, attendance, or company policies',
}

export default function AiChatPanel({ onClose, compact = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const hrms = useHrms()
  const portalRole = user?.role || 'employee'
  const isStaff = ['admin', 'manager', 'superadmin'].includes(portalRole)

  const starters = CHAT_STARTERS[portalRole] || CHAT_STARTERS.employee

  const [messages, setMessages] = useState(() => [
    {
      role: 'assistant',
      text: `Hi ${user?.name?.split(' ')[0] || 'there'}! I'm Gamyam AI with full access to app data. Ask about ${GREETING[portalRole] || GREETING.employee}.`,
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [executed, setExecuted] = useState(() => new Set())
  const [empModal, setEmpModal] = useState(null)
  const [formStatus, setFormStatus] = useState({})
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const buildContext = useMemo(
    () => () =>
      buildAiContext({
        hrms,
        user,
        portalRole,
        adminStats: hrms.adminStats,
        managerKpis: hrms.managerKpis,
      }),
    [hrms, user, portalRole],
  )

  const goTo = (path) => {
    navigate(path)
    onClose?.()
  }

  const runExec = (action) => {
    if (executed.has(action.id)) return
    let resultText = 'Done.'
    try {
      if (action.exec === 'approveLeaves' || action.exec === 'rejectLeaves') {
        const status = action.exec === 'approveLeaves' ? 'approved' : 'rejected'
        action.leaveIds.forEach((id) => hrms.updateLeaveStatus(id, status, user?.name))
        const count = action.leaveIds.length
        const who = action.employeeName ? `${action.employeeName}'s ${action.leaveType || 'leave'}` : `${count} request(s)`
        resultText =
          status === 'approved'
            ? `✅ Approved ${who}. The requester is notified and it's recorded in the activity log.`
            : `❌ Rejected ${who}. The requester has been notified.`
      }
    } catch {
      resultText = 'Sorry, I ran into a problem completing that action. Please try from the page instead.'
    }
    setExecuted((prev) => new Set(prev).add(action.id))
    setMessages((m) => [...m, { role: 'assistant', text: resultText }])
  }

  // Open the app's existing form right here in the chat, prefilled.
  const openExistingForm = (action) => {
    if (action.openForm === 'employee') {
      setEmpModal({ prefill: action.prefill || {} })
    }
  }

  const handleEmployeeAdded = (payload) => {
    setEmpModal(null)
    setMessages((m) => [
      ...m,
      {
        role: 'assistant',
        text: `✅ Added ${payload.name} — ${payload.role || 'Team Member'} in ${payload.department}. They're in the Employees directory now.`,
      },
    ])
  }

  const handleLeaveApplied = (key, payload) => {
    setFormStatus((s) => ({ ...s, [key]: 'submitted' }))
    const range =
      payload.from && payload.to && payload.to !== payload.from
        ? `${payload.from} → ${payload.to}`
        : payload.from
    const leavePath = portalRole === 'manager' ? '/manager/my-leave' : '/employee/leave'
    setMessages((m) => [
      ...m,
      {
        role: 'assistant',
        text: `✅ Submitted your ${payload.type} request${range ? ` for ${range}` : ''} (${payload.days} day${payload.days === 1 ? '' : 's'}). It's pending HR review — you can track it under Leave.`,
        actions: [{ label: 'Open Leave', path: leavePath }],
      },
    ])
  }

  const handleLeaveCancelled = (key) => {
    setFormStatus((s) => ({ ...s, [key]: 'cancelled' }))
  }

  const send = async (text) => {
    const msg = text?.trim()
    if (!msg || loading) return

    setMessages((m) => [...m, { role: 'user', text: msg }])
    setInput('')
    setLoading(true)

    const result = await getAiReply(msg, buildContext())
    setMessages((m) => [
      ...m,
      {
        role: 'assistant',
        text: result.text,
        actions: result.actions,
      },
    ])
    setLoading(false)
  }

  return (
    <>
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-primary/10 ${
        compact ? 'h-[min(70vh,520px)] w-[min(calc(100vw-2rem),380px)]' : 'h-full'
      }`}
    >
      <div className="relative flex items-center justify-between gap-2 overflow-hidden border-b border-white/10 bg-gradient-to-r from-indigo-500/25 via-violet-500/20 to-cyan-500/15 px-4 py-3 text-white backdrop-blur-xl">
        <span className="pointer-events-none absolute -left-6 -top-10 h-24 w-24 rounded-full bg-indigo-500/40 blur-2xl" aria-hidden />
        <span className="pointer-events-none absolute right-12 -top-12 h-24 w-24 rounded-full bg-violet-500/40 blur-2xl" aria-hidden />
        <div className="relative flex items-center gap-2.5">
          <RobotAvatar small animated />
          <div>
            <p className="text-sm font-semibold text-white">Gamyam AI</p>
            <p className="flex items-center gap-1.5 text-[10px] text-white/70">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_1px_rgba(16,185,129,0.7)]" />
              {isStaff ? `${portalRole} assistant` : 'HR assistant'} · online
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="relative rounded-lg border border-white/10 bg-white/5 p-1.5 transition hover:scale-110 hover:bg-white/15 active:scale-95"
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.text.slice(0, 12)}`}
            className={`ai-msg flex flex-col gap-2 ${m.role === 'user' ? 'items-end' : 'items-start'}`}
            style={{ animationDelay: `${Math.min(i * 0.06, 0.3)}s` }}
          >
            <div
              className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs ${
                m.role === 'user'
                  ? 'bg-primary text-white shadow-md shadow-primary/20'
                  : 'bg-surface text-foreground ring-1 ring-border'
              }`}
            >
              {m.text}
            </div>
            {m.role === 'assistant' && m.actions?.length > 0 && (
              <div className="flex w-full max-w-[92%] flex-col gap-2">
                {m.actions.some((a) => a.openForm === 'leave') &&
                  (formStatus[i] === 'submitted' ? (
                    <p className="rounded-xl border border-border bg-surface px-3 py-2 text-[11px] font-medium text-muted">
                      Leave request submitted ✓
                    </p>
                  ) : formStatus[i] === 'cancelled' ? (
                    <p className="rounded-xl border border-border bg-surface px-3 py-2 text-[11px] text-muted">
                      No problem — leave request cancelled.
                    </p>
                  ) : (
                    <AiLeaveFormCard
                      prefill={m.actions.find((a) => a.openForm === 'leave').prefill || {}}
                      onSubmitted={(payload) => handleLeaveApplied(i, payload)}
                      onCancel={() => handleLeaveCancelled(i)}
                    />
                  ))}

                {m.actions.filter((a) => a.openForm !== 'leave').length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {m.actions
                      .filter((a) => a.openForm !== 'leave')
                      .map((action) =>
                        action.exec ? (
                          <button
                            key={action.id}
                            type="button"
                            disabled={executed.has(action.id)}
                            onClick={() => runExec(action)}
                            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold text-white transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                              action.tone === 'danger'
                                ? 'bg-rose-500 hover:bg-rose-600'
                                : action.tone === 'success'
                                  ? 'bg-emerald-500 hover:bg-emerald-600'
                                  : 'bg-primary hover:bg-primary-dark'
                            }`}
                          >
                            {executed.has(action.id) ? 'Done ✓' : action.label}
                          </button>
                        ) : action.openForm ? (
                          <button
                            key={action.id}
                            type="button"
                            onClick={() => openExistingForm(action)}
                            className="inline-flex items-center gap-1 rounded-full bg-primary px-2.5 py-1 text-[10px] font-semibold text-white transition-colors hover:bg-primary-dark"
                          >
                            {action.label}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ) : (
                          <button
                            key={action.path}
                            type="button"
                            onClick={() => goTo(action.path)}
                            className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-light/50 px-2.5 py-1 text-[10px] font-medium text-primary-dark transition-colors hover:bg-primary hover:text-white"
                          >
                            {action.label}
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        ),
                      )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {loading && <ThinkingBubble />}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-border bg-surface/50 p-2.5">
        <div className="mb-2 flex flex-wrap gap-1.5">
          {starters.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => send(s)}
              className="ai-chip rounded-full border border-border bg-white px-2.5 py-1 text-[10px] text-muted hover:border-primary hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(input)
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isStaff ? 'Ask or say “open payroll”…' : 'Ask HR anything…'}
            className="flex-1 rounded-xl border border-border px-3 py-2 text-xs transition-shadow focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="ai-send-btn rounded-xl bg-primary px-3 py-2 text-white transition-transform hover:scale-105 active:scale-95 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
          </button>
        </form>
      </div>
    </div>

    {empModal && (
      <AiAddEmployeeModal
        prefill={empModal.prefill}
        onClose={() => setEmpModal(null)}
        onAdded={handleEmployeeAdded}
      />
    )}
    </>
  )
}
