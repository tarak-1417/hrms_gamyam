import {
  LayoutDashboard,
  Users,
  CalendarOff,
  GitBranch,
} from 'lucide-react'
import HrLayout from './HrLayout'

const navItems = [
  { to: '/manager', icon: LayoutDashboard, label: 'Home' },
  { to: '/manager/team', icon: Users, label: 'My Team' },
  { to: '/manager/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/manager/leave', icon: CalendarOff, label: 'Leave' },
]

export default function ManagerLayout() {
  return <HrLayout navItems={navItems} portalLabel="Manager Portal" />
}
