/**
 * Gamyam AI — autonomous action detection.
 *
 * Parses an executable intent (approve/reject leave, add an employee) from a
 * natural-language message, resolves it against the live knowledge snapshot,
 * and returns a preview reply plus one or more *executable* actions. Executable
 * actions carry an `exec` kind (no `path`); the chat panel renders them as a
 * confirm button and runs the matching HRMS mutation on click.
 */

import { todayDate } from './timeUtils'

const APPROVE_ROLES = new Set(['admin', 'manager'])
const ADD_ROLES = new Set(['admin'])
const APPLY_LEAVE_ROLES = new Set(['employee', 'manager'])

function lc(s) {
  return (s || '').trim().toLowerCase()
}

function capitalizeWords(s) {
  return s
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function emailFromName(name) {
  const clean = lc(name).replace(/[^a-z\s]/g, '').trim().replace(/\s+/g, '.')
  return `${clean || 'new.hire'}@company.com`
}

/** Resolve a person referenced anywhere in `text` against the employee list. */
function resolvePerson(employees, text) {
  const q = lc(text)
  return (
    employees.find((e) => q.includes(lc(e.name))) ||
    employees.find((e) => q.includes(lc(e.id))) ||
    employees.find((e) =>
      lc(e.name)
        .split(' ')
        .some((part) => part.length > 2 && q.includes(part)),
    ) ||
    null
  )
}

function departmentNames(k) {
  const fromRecords = (k.departments || []).map((d) => d.name || d).filter(Boolean)
  const fromEmployees = (k.employees || []).map((e) => e.department).filter(Boolean)
  return [...new Set([...fromRecords, ...fromEmployees])]
}

/* ----------------------------- leave approvals ---------------------------- */

function detectLeaveDecision(message, k, role) {
  const q = lc(message)
  const isApprove = /\b(approve|accept|grant|ok|okay)\b/.test(q)
  const isReject = /\b(reject|decline|deny|refuse)\b/.test(q)
  if (!isApprove && !isReject) return null
  if (!/leave|request|time off/.test(q) && !resolvePerson(k.employees, message)) return null

  if (!APPROVE_ROLES.has(role)) {
    return { text: 'Only HR admins and managers can approve or reject leave requests.' }
  }

  const decision = isReject ? 'reject' : 'approve'
  const pending = k.pendingLeaves || []

  if (pending.length === 0) {
    return { text: 'There are no pending leave requests to act on right now.' }
  }

  // "approve all pending leaves"
  if (/\ball\b|\bevery\b|\beverything\b/.test(q)) {
    return {
      text: `I can ${decision} all ${pending.length} pending leave request(s):\n${pending
        .map((l) => `• ${l.employeeName} — ${l.type} (${l.days} day(s))`)
        .join('\n')}\n\nConfirm to apply.`,
      actions: [
        {
          exec: decision === 'approve' ? 'approveLeaves' : 'rejectLeaves',
          id: `leave-${decision}-all`,
          label: `Confirm & ${decision} all (${pending.length})`,
          tone: decision === 'approve' ? 'success' : 'danger',
          leaveIds: pending.map((l) => l.id),
          summary: `${pending.length} request(s)`,
        },
      ],
    }
  }

  const person = resolvePerson(k.employees, message)
  if (!person) {
    return {
      text: `Who should I ${decision}? Pending request(s):\n${pending
        .map((l) => `• ${l.employeeName} — ${l.type} (${l.days} day(s))`)
        .join('\n')}\n\nTry "${decision} <name>'s leave".`,
    }
  }

  const leave = pending.find((l) => l.employeeId === person.id)
  if (!leave) {
    return { text: `${person.name} has no pending leave request to ${decision}.` }
  }

  return {
    text: `I'll ${decision} ${person.name}'s ${leave.type} (${leave.from} → ${leave.to}, ${leave.days} day(s)). Confirm to apply — the requester is notified and it's recorded in the activity log.`,
    actions: [
      {
        exec: decision === 'approve' ? 'approveLeaves' : 'rejectLeaves',
        id: `leave-${decision}-${leave.id}`,
        label: `Confirm & ${decision}`,
        tone: decision === 'approve' ? 'success' : 'danger',
        leaveIds: [leave.id],
        employeeName: person.name,
        leaveType: leave.type,
        days: leave.days,
      },
    ],
  }
}

/* ------------------------------ apply leave ------------------------------- */

function addDaysIso(iso, days) {
  const d = new Date(`${iso}T12:00:00`)
  d.setDate(d.getDate() + days)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${dd}`
}

function parseApplyLeave(message) {
  const q = lc(message)

  // leave type
  let type = 'Casual Leave'
  if (/\bsick\b/.test(q)) type = 'Sick Leave'
  else if (/\bearned\b|\bprivilege\b|\bannual leave\b|\bel\b/.test(q)) type = 'Earned Leave'
  else if (/\boptional\b/.test(q)) type = 'Optional Holiday'
  else if (/\bcasual\b|\bcl\b/.test(q)) type = 'Casual Leave'

  // duration
  let durationType = 'full'
  let halfDayPeriod = 'first_half'
  if (/\bhalf[\s-]?day\b/.test(q)) {
    durationType = 'half'
    if (/second half|afternoon|2nd half/.test(q)) halfDayPeriod = 'second_half'
  }

  // dates — explicit ISO dates first, else today/tomorrow keywords
  const isos = [...message.matchAll(/\b(\d{4}-\d{2}-\d{2})\b/g)].map((m) => m[1])
  let from = isos[0] || null
  let to = isos[1] || null
  if (!from) {
    if (/\btomorrow\b/.test(q)) from = addDaysIso(todayDate(), 1)
    else if (/\btoday\b/.test(q)) from = todayDate()
  }
  if (from && !to) to = from

  // reason
  let reason = ''
  const rm = message.match(/\b(?:because|due to|reason(?:\s+is)?\s*[:-]?)\s+(.+)$/i)
  if (rm) reason = rm[1].trim().replace(/[.\s]+$/, '')

  return { type, durationType, halfDayPeriod, from: from || '', to: to || '', reason }
}

function detectApplyLeave(message, _k, role) {
  const q = lc(message)
  const applyVerb = /\b(apply|applying|take|taking|book|booking|submit|submitting|put in)\b/
  const leaveNoun = /\bleave\b|\bday ?off\b|\btime ?off\b|\bvacation\b|\bpto\b/
  const triggered = (applyVerb.test(q) && leaveNoun.test(q)) || /\bapply (?:for )?(?:a )?leave\b/.test(q)
  if (!triggered) return null

  // approvals are handled separately and own the approve/reject verbs
  if (/\b(approve|accept|grant|reject|decline|deny|refuse)\b/.test(q)) return null

  if (!APPLY_LEAVE_ROLES.has(role)) return null

  const prefill = parseApplyLeave(message)
  const haveDetails = prefill.type || prefill.from || prefill.durationType === 'half'
  const bits = [prefill.type]
  if (prefill.from) bits.push(prefill.from === prefill.to ? prefill.from : `${prefill.from} → ${prefill.to}`)
  if (prefill.durationType === 'half') bits.push('half day')

  return {
    text: haveDetails
      ? `Here's your leave form, prefilled with ${bits.filter(Boolean).join(', ')}. Review the dates and reason below, then submit.`
      : "Sure — fill in your leave details below and submit.",
    actions: [
      {
        openForm: 'leave',
        id: 'open-leave-form',
        label: 'Apply for leave',
        prefill,
      },
    ],
  }
}

/* ------------------------------ add employee ------------------------------ */

function parseAddEmployee(message, k) {
  let s = message
    .replace(/^\s*(please\s+|can you\s+|could you\s+)?/i, '')
    .replace(/\b(add|create|onboard|hire|register)\b\s+(a\s+new\s+|an?\s+new\s+|a\s+|an?\s+|new\s+)?(employee|person|hire|team\s*member)?\s*/i, '')
    .trim()

  // manager — "reporting to X" / "reports to X" / "under X"
  let managerName = null
  const mgr = s.match(/\b(?:reporting to|reports to|reporting|under|manager is|managed by|reports? into)\s+([a-z][a-z .'-]+?)(?:[,.]|$)/i)
  if (mgr) {
    managerName = mgr[1].trim()
    s = s.replace(mgr[0], ' ').trim()
  }

  // department — "in X" / "in the X department" / bare department name
  let department = null
  const depts = departmentNames(k)
  const inMatch = s.match(/\bin\s+(?:the\s+)?([a-z][a-z &]+?)(?:\s+department)?(?:[,.]|$)/i)
  if (inMatch) {
    const cand = inMatch[1].trim()
    department =
      depts.find((d) => lc(d) === lc(cand)) ||
      depts.find((d) => lc(cand).includes(lc(d)) || lc(d).includes(lc(cand))) ||
      capitalizeWords(cand)
    s = s.replace(inMatch[0], ' ').trim()
  } else {
    const bare = depts.find((d) => new RegExp(`\\b${d}\\b`, 'i').test(s))
    if (bare) {
      department = bare
      s = s.replace(new RegExp(`\\b${bare}\\b`, 'i'), ' ').trim()
    }
  }

  // role — "as <role>" or the part after the first comma
  let role = null
  const asMatch = s.match(/\bas\s+(?:an?\s+)?([a-z][a-z /-]+?)(?:[,.]|$)/i)
  if (asMatch) {
    role = capitalizeWords(asMatch[1].trim())
    s = s.replace(asMatch[0], ' ').trim()
  }

  // remaining text should start with the name; a comma may separate name, role
  s = s.replace(/\s{2,}/g, ' ').replace(/[,;]\s*$/, '').trim()
  let name = s
  if (s.includes(',')) {
    const parts = s.split(',').map((p) => p.trim()).filter(Boolean)
    name = parts[0]
    if (!role && parts[1]) role = capitalizeWords(parts[1])
  }
  // keep only plausible name tokens (letters, up to 3 words)
  name = (name.match(/[a-z][a-z .'-]*/i)?.[0] || '').trim().split(/\s+/).slice(0, 3).join(' ')

  let managerId = null
  let resolvedManager = null
  if (managerName) {
    resolvedManager = resolvePerson(k.employees, managerName)
    managerId = resolvedManager?.id || null
  }
  if (!department && resolvedManager) department = resolvedManager.department

  return { name: name ? capitalizeWords(name) : '', role, department, managerId, managerName: resolvedManager?.name || managerName }
}

function detectAddEmployee(message, k, role) {
  const q = lc(message)
  const triggered =
    /\b(add|create|onboard|hire|register)\b.*\b(employee|hire|developer|designer|manager|analyst|engineer|executive|lead|accountant|intern|person|team\s*member|staff)\b/.test(
      q,
    ) || /\bonboard\b/.test(q)
  if (!triggered) return null

  if (!ADD_ROLES.has(role)) {
    return { text: 'Only HR admins can add new employees.' }
  }

  const parsed = parseAddEmployee(message, k)

  // Open the app's real "Add employee" form, prefilled with whatever we parsed,
  // so the user gets the full form (payroll, validation, etc.) to review & save.
  const prefill = {
    name: parsed.name || '',
    email: parsed.name ? emailFromName(parsed.name) : '',
    role: parsed.role || '',
    department: parsed.department || '',
    managerId: parsed.managerId || '',
    status: 'active',
  }

  const haveDetails = parsed.name || parsed.role || parsed.department
  const text = haveDetails
    ? `Opening the new-employee form, prefilled with what I caught${parsed.name ? ` (${parsed.name}${parsed.role ? `, ${parsed.role}` : ''})` : ''}. Review and save.`
    : "Sure — I'll open the new-employee form for you to fill in."

  return {
    text,
    actions: [
      {
        openForm: 'employee',
        id: 'open-employee-form',
        label: haveDetails ? 'Open prefilled form' : 'Open employee form',
        prefill,
      },
    ],
  }
}

/* -------------------------------- entry ----------------------------------- */

/** Returns an action reply `{ text, actions }` or null if no actionable intent. */
export function detectAiAction(message, k, role) {
  if (!message || !k) return null
  return (
    detectApplyLeave(message, k, role) ||
    detectLeaveDecision(message, k, role) ||
    detectAddEmployee(message, k, role) ||
    null
  )
}
