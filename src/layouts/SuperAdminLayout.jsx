import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Activity,
  BarChart3,
  Shield,
  FileStack,
  Network,
  Users,
  UserCog,
  Settings,
  CalendarCheck,
  CalendarOff,
  Wallet,
  UserPlus,
  ScrollText,
  ArchiveRestore,
} from 'lucide-react'
import HrLayout from './HrLayout'

const platformNav = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/superadmin/organization', icon: Network, label: 'Org setup (tenant)' },
  { to: '/superadmin/companies', icon: Building2, label: 'Organizations' },
  { to: '/superadmin/users', icon: UserCog, label: 'Users & access' },
  { to: '/superadmin/permissions', icon: Shield, label: 'Permissions' },
  { to: '/superadmin/settings', icon: Settings, label: 'Global settings' },
  { to: '/superadmin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/superadmin/monitoring', icon: Activity, label: 'Monitoring' },
  { to: '/superadmin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/superadmin/billing', icon: Shield, label: 'Billing & security' },
  { to: '/superadmin/audit-logs', icon: ScrollText, label: 'Audit logs' },
  { to: '/superadmin/trash', icon: ArchiveRestore, label: 'Recycle bin' },
  { to: '/superadmin/documents', icon: FileStack, label: 'Documents' },
]

const hrModuleNav = [
  { to: '/superadmin/hr', icon: LayoutDashboard, label: 'HR dashboard' },
  { to: '/superadmin/hr/employees', icon: Users, label: 'Employees' },
  { to: '/superadmin/hr/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/superadmin/hr/leave', icon: CalendarOff, label: 'Leave' },
  { to: '/superadmin/hr/payroll', icon: Wallet, label: 'Payroll' },
  { to: '/superadmin/hr/recruitment', icon: UserPlus, label: 'Recruitment' },
  { to: '/superadmin/hr/reports', icon: BarChart3, label: 'Reports' },
  { to: '/superadmin/hr/settings', icon: Settings, label: 'HR settings' },
  { to: '/superadmin/hr/audit-logs', icon: ScrollText, label: 'Audit logs' },
]

const navSections = [
  { label: 'Platform', items: platformNav },
  { label: 'HRMS modules', items: hrModuleNav },
]

export default function SuperAdminLayout() {
  return <HrLayout navSections={navSections} portalLabel="Super Admin" />
}
