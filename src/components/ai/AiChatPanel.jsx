import { useState, useRef, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Send, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { buildAiContext, getAiReply } from '../../utils/hrAiAgent'
import { CHAT_STARTERS } from '../../utils/aiNavigation'

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
    <div
      className={`flex flex-col overflow-hidden rounded-2xl border border-border bg-white shadow-2xl shadow-primary/10 ${
        compact ? 'h-[min(70vh,520px)] w-[min(calc(100vw-2rem),380px)]' : 'h-full'
      }`}
    >
      <div className="ai-header-shimmer flex items-center justify-between px-4 py-3 text-white">
        <div className="flex items-center gap-2">
          <RobotAvatar small animated />
          <div>
            <p className="text-sm font-semibold">Gamyam AI</p>
            <p className="text-[10px] text-white/85">
              {isStaff ? `${portalRole} assistant` : 'HR assistant'} · online
            </p>
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 transition-transform hover:scale-110 hover:bg-white/20 active:scale-95"
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
              <div className="flex max-w-[92%] flex-wrap gap-1.5">
                {m.actions.map((action) => (
                  <button
                    key={action.path}
                    type="button"
                    onClick={() => goTo(action.path)}
                    className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary-light/50 px-2.5 py-1 text-[10px] font-medium text-primary-dark transition-colors hover:bg-primary hover:text-white"
                  >
                    {action.label}
                    <ArrowRight className="h-3 w-3" />
                  </button>
                ))}
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
  )
}
