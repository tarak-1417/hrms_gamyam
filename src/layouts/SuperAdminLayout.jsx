import {
  LayoutDashboard,
  Building2,
  FileStack,
  Network,
  GitBranch,
  Users,
  UserCog,
  CalendarOff,
} from 'lucide-react'
import HrLayout from './HrLayout'

const platformNav = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/superadmin/organization', icon: Network, label: 'Org setup (tenant)' },
  { to: '/superadmin/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/superadmin/companies', icon: Building2, label: 'Organizations' },
  { to: '/superadmin/users', icon: UserCog, label: 'Users & access' },
  // { to: '/superadmin/permissions', icon: Shield, label: 'Permissions' },
  { to: '/superadmin/documents', icon: FileStack, label: 'Documents' },
]

const hrModuleNav = [
  { to: '/superadmin/hr', icon: LayoutDashboard, label: 'HR dashboard' },
  { to: '/superadmin/hr/employees', icon: Users, label: 'Employees' },
  // { to: '/superadmin/hr/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/superadmin/hr/leave', icon: CalendarOff, label: 'Leave' },
]

const navSections = [
  { label: 'Platform', items: platformNav },
  { label: 'HRMS modules', items: hrModuleNav },
]

export default function SuperAdminLayout() {
  return (
    <HrLayout
      navSections={navSections}
      portalLabel="Super Admin"
      showHelpAndSettings={false}
      toolbarHomePath="/superadmin"
      searchVariant="hr"
      searchPlaceholder="Search orgs, users, pages…"
    />
  )
}
