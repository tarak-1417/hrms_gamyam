import {
  LayoutDashboard,
  Users,
  CalendarOff,
  Wallet,
  Settings,
  FileStack,
  GitBranch,
} from 'lucide-react'
import HrLayout from './HrLayout'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/admin/leave', icon: CalendarOff, label: 'Leave' },
  { to: '/admin/payroll', icon: Wallet, label: 'Payroll' },
  { to: '/admin/documents', icon: FileStack, label: 'Documents' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
]

export default function AdminHrLayout() {
  return <HrLayout navItems={navItems} portalLabel="HR / Admin Panel" />
}
