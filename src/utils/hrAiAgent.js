/**
 * Gamyam HR AI — answers from live HRMS data + navigation for all roles.
 * Optional: VITE_OPENAI_API_KEY for GPT-enhanced replies.
 */

import {
  buildAppKnowledge,
  queryAppKnowledge,
  buildKnowledgeSummaryForPrompt,
  getFallbackFromKnowledge,
} from './aiKnowledge'
import { findNavActions, getBrowseMenuActions } from './aiNavigation'

function pick(text) {
  return text.trim().toLowerCase()
}

function reply(text, actions) {
  if (actions?.length) return { text, actions }
  return { text }
}

function normalizeReply(result) {
  if (typeof result === 'string') return { text: result }
  return result
}

/** Full context: live knowledge snapshot + legacy fields for compatibility */
export function buildAiContext({ hrms, user, portalRole, adminStats, managerKpis }) {
  const knowledge = buildAppKnowledge({ hrms, user, portalRole, adminStats, managerKpis })
  const role = portalRole || user?.role || 'employee'

  return {
    portalRole: role,
    name: user?.name,
    knowledge,
    // Legacy shortcuts
    ...knowledge,
    leaveBalance: knowledge.employeeStats?.leaveBalance,
    pendingLeaves: knowledge.myLeaves?.filter((l) => l.status === 'pending').length ?? knowledge.pendingLeaves.length,
    todayLog: knowledge.myTodayLog,
    myLeaves: knowledge.myLeaves,
    holidays: knowledge.holidays,
    leavePolicy: knowledge.leavePolicy,
    adminStats,
    managerKpis,
    employeeCount: knowledge.employees.length,
    pendingLeaveCount: knowledge.pendingLeaves.length,
    platformKpis: knowledge.platformKpis,
    activeJobs: knowledge.activeJobs.length,
  }
}

export function buildEmployeeContext(props) {
  return buildAiContext({ ...props, portalRole: 'employee' })
}

export function buildStaffContext(props) {
  return buildAiContext(props)
}

function greetingReply(ctx) {
  const role = ctx.portalRole
  const k = ctx.knowledge
  const nav = findNavActions('help', role, 1)

  const scope =
    role === 'superadmin'
      ? `platform data (${k.platformKpis.totalCompanies} companies, ${k.platformKpis.activeUsers} users)`
      : role === 'manager'
        ? `your Engineering team (${k.employees.length} people)`
        : role === 'admin'
          ? `the full organization (${k.employees.length} employees)`
          : 'your HR profile and leave'

  return reply(
    `Hi ${ctx.name?.split(' ')[0] || 'there'}! I'm Gamyam AI with live access to ${scope}. Ask anything—e.g. "who is on leave", "Arjun Mehta salary", "pending leaves", or "open payroll".`,
    nav.length ? nav : undefined,
  )
}

function helpReply(ctx) {
  return reply(
    'I can answer from real app data (employees, attendance, leave, payroll, jobs, documents) and open pages for you. Pick below or ask in your own words.',
    getBrowseMenuActions(ctx.portalRole, 8),
  )
}

export function getLocalAiReply(message, ctx) {
  const q = pick(message)
  const k = ctx.knowledge

  if (/hello|hi|hey/.test(q)) return greetingReply(ctx)
  if (/^help$|navigate|menu|where can|pages/.test(q)) return helpReply(ctx)

  const dataAnswer = queryAppKnowledge(message, k)
  if (dataAnswer) return dataAnswer

  const nav = findNavActions(message, ctx.portalRole)
  if (nav.length) return reply('Opening the matching section:', nav)

  return getFallbackFromKnowledge(k, message, ctx.portalRole)
}

export function getStaffLocalAiReply(message, ctx) {
  return getLocalAiReply(message, ctx)
}

export async function getAiReply(message, ctx) {
  const k = ctx.knowledge
  const role = ctx.portalRole || 'employee'

  if (k) {
    const dataAnswer = queryAppKnowledge(message, k)
    if (dataAnswer) return normalizeReply(dataAnswer)

    const q = pick(message)
    if (/hello|hi|hey/.test(q)) return normalizeReply(greetingReply(ctx))
    if (/^help$|navigate|menu|where can/.test(q)) return normalizeReply(helpReply(ctx))
  }

  const localFn = ['admin', 'manager', 'superadmin'].includes(role)
    ? getStaffLocalAiReply
    : getLocalAiReply

  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (apiKey && k) {
    try {
      const knowledgeJson = buildKnowledgeSummaryForPrompt(k)
      const system = `You are Gamyam HRMS AI assistant for ${role} user "${ctx.name}".
Answer ONLY using the JSON application data below. Be concise, friendly, and factual.
If the user wants to see a screen or full list, tell them you can open it and mention the page name (Employees, Leave, Payroll, Attendance, etc.).
Never invent employees or numbers not in the data.

APPLICATION DATA:
${knowledgeJson}`

      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: message },
          ],
          max_tokens: 500,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        const text = data.choices?.[0]?.message?.content?.trim()
        const nav = findNavActions(message, role, 2)
        if (text) {
          return normalizeReply(reply(text, nav.length ? nav : undefined))
        }
      }
    } catch {
      /* local knowledge engine */
    }
  }

  return normalizeReply(localFn(message, ctx))
}
