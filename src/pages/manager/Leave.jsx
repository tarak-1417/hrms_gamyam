import { useState } from 'react'
import { ClipboardList, CalendarOff } from 'lucide-react'
import HrLeave from '../shared/HrLeave'
import EmployeeLeave from '../employee/Leave'

const TABS = [
  { id: 'approvals', label: 'Leave approvals', icon: ClipboardList },
  { id: 'apply', label: 'Apply leave', icon: CalendarOff },
]

/**
 * Manager leave workspace — combines team leave approvals and the manager's
 * own leave application into a single page with tabs (no separate routes in
 * the sidebar). `defaultTab` lets links land on a specific tab.
 */
export default function ManagerLeave({ defaultTab = 'approvals' }) {
  const [tab, setTab] = useState(TABS.some((t) => t.id === defaultTab) ? defaultTab : 'approvals')

  return (
    <div className="mx-auto max-w-[1400px] space-y-5 pb-10">
      <div>
        <h1 className="text-3xl font-bold leading-tight text-white sm:text-[2.2rem]">Leave</h1>
        <p className="mt-1.5 text-sm text-white/55">
          Review your team&apos;s requests and apply for your own leave.
        </p>
      </div>

      <div className="flex gap-1 border-b border-white/10">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex shrink-0 items-center gap-2 rounded-t-xl px-4 py-2.5 text-sm font-semibold transition ${
              tab === id
                ? 'border-b-2 border-indigo-400 text-white'
                : 'text-white/55 hover:bg-white/5 hover:text-white'
            }`}
          >
            <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
            {label}
          </button>
        ))}
      </div>

      {tab === 'approvals' ? <HrLeave embedded /> : <EmployeeLeave embedded />}
    </div>
  )
}
