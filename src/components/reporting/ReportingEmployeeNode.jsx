import { memo } from 'react'
import { Handle, Position } from '@xyflow/react'
import { motion } from 'framer-motion'
import { HiChevronDown, HiChevronRight, HiUsers } from 'react-icons/hi'
import Badge from '../ui/Badge'

function statusBadge(status) {
  if (status === 'active') return 'active'
  if (status === 'on-leave') return 'on-leave'
  return 'inactive'
}

function ReportingEmployeeNode({ data, selected }) {
  const { employee, teamCount, hasChildren, collapsed, highlighted, onToggleCollapse, onSelect } =
    data

  return (
    <>
      <Handle type="target" position={Position.Top} className="!border-0 !bg-transparent !w-2 !h-2" />
      <motion.div
        layout
        initial={false}
        whileHover={{ scale: 1.02, y: -2 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        onClick={(e) => {
          e.stopPropagation()
          onSelect?.(employee.id)
        }}
        className={`w-[248px] cursor-pointer rounded-2xl border bg-white p-3 shadow-md transition-shadow ${
          selected || data.selected
            ? 'border-primary ring-2 ring-primary/25 shadow-lg shadow-primary/10'
            : highlighted
              ? 'border-primary/50 bg-primary-light/20 shadow-primary/5'
              : 'border-neutral-200 hover:border-primary/30 hover:shadow-lg'
        }`}
      >
        <div className="flex items-start gap-3">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
              highlighted ? 'bg-primary text-white' : 'bg-primary-light text-primary'
            }`}
          >
            {employee.avatar || employee.name?.charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-1">
              <p className="truncate text-sm font-semibold text-foreground">{employee.name}</p>
              {hasChildren && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    onToggleCollapse?.(employee.id)
                  }}
                  className="shrink-0 rounded-md p-0.5 text-muted hover:bg-neutral-100 hover:text-foreground"
                  aria-label={collapsed ? 'Expand' : 'Collapse'}
                >
                  {collapsed ? (
                    <HiChevronRight className="h-4 w-4" />
                  ) : (
                    <HiChevronDown className="h-4 w-4" />
                  )}
                </button>
              )}
            </div>
            <p className="font-mono text-[10px] text-muted">{employee.id}</p>
            <p className="mt-0.5 truncate text-xs text-muted">{employee.role}</p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-neutral-100 pt-2.5">
          <span className="truncate text-[10px] font-medium uppercase tracking-wide text-muted">
            {employee.department}
          </span>
          <div className="flex items-center gap-2">
            <Badge status={statusBadge(employee.status)} />
            {teamCount > 0 && (
              <span className="inline-flex items-center gap-0.5 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] font-medium text-muted">
                <HiUsers className="h-3 w-3" />
                {teamCount}
              </span>
            )}
          </div>
        </div>
      </motion.div>
      <Handle type="source" position={Position.Bottom} className="!border-0 !bg-transparent !w-2 !h-2" />
    </>
  )
}

export default memo(ReportingEmployeeNode)
