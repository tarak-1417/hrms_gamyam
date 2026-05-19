import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  CalendarOff,
  BarChart3,
  Building2,
} from 'lucide-react'
import HrLayout from './HrLayout'

const navItems = [
  { to: '/manager', icon: LayoutDashboard, label: 'Home' },
  { to: '/manager/team', icon: Users, label: 'My Team' },
  { to: '/manager/departments', icon: Building2, label: 'Department' },
  { to: '/manager/attendance', icon: CalendarCheck, label: 'Attendance' },
  { to: '/manager/leave', icon: CalendarOff, label: 'Leave' },
  { to: '/manager/reports', icon: BarChart3, label: 'Reports' },
]

export default function ManagerLayout() {
  return <HrLayout navItems={navItems} portalLabel="Manager Portal" />
}
