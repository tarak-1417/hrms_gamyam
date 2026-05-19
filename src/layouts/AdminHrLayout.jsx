import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  Wallet,
  UserPlus,
  Building2,
  BarChart3,
  Shield,
  Settings,
  FileStack,
  ScrollText,
} from 'lucide-react'
import HrLayout from './HrLayout'

const navItems = [
  { to: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/employees', icon: Users, label: 'Employees' },
  { to: '/admin/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/admin/leave', icon: CalendarOff, label: 'Leave' },
  { to: '/admin/payroll', icon: Wallet, label: 'Payroll' },
  { to: '/admin/recruitment', icon: UserPlus, label: 'Recruitment' },
  { to: '/admin/documents', icon: FileStack, label: 'Documents' },
  { to: '/admin/departments', icon: Building2, label: 'Departments' },
  { to: '/admin/reports', icon: BarChart3, label: 'Reports' },
  { to: '/admin/roles', icon: Shield, label: 'Roles' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
  { to: '/admin/audit-logs', icon: ScrollText, label: 'Audit logs' },
]

export default function AdminHrLayout() {
  return <HrLayout navItems={navItems} portalLabel="HR / Admin Panel" />
}
