import {
  LayoutDashboard,
  Users,
  FileStack,
  GitBranch,
  ClipboardList,
  Receipt,
} from 'lucide-react'
import HrLayout from './HrLayout'

const workNav = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/admin/leave', icon: ClipboardList, label: 'Leave approvals' },
  { to: '/admin/reimbursements', icon: Receipt, label: 'Reimbursements' },
  { to: '/admin/documents', icon: FileStack, label: 'HR documents' },
]

const navSections = [{ label: 'Work', items: workNav }]

export default function AdminHrLayout() {
  return (
    <HrLayout
      navSections={navSections}
      portalLabel="HR / Admin Panel"
      showSettings={false}
    />
  )
}
