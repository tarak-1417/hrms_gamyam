import {
  LayoutDashboard,
  CalendarOff,
  GitBranch,
  ClipboardList,
  FileText,
  FolderOpen,
  User,
} from 'lucide-react'
import HrLayout from './HrLayout'

const teamNav = [
  { to: '/manager', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/manager/reporting', icon: GitBranch, label: 'Reporting tree' },
  { to: '/manager/leave', icon: ClipboardList, label: 'Leave approvals' },
]

const personalNav = [
  { to: '/manager/profile', icon: User, label: 'My profile' },
  { to: '/manager/my-leave', icon: CalendarOff, label: 'Apply leave' },
  { to: '/manager/payslips', icon: FileText, label: 'Payslips' },
  { to: '/manager/documents', icon: FolderOpen, label: 'My documents' },
]

const navSections = [
  { label: 'Team', items: teamNav },
  { label: 'Personal', items: personalNav },
]

export default function ManagerLayout() {
  return <HrLayout navSections={navSections} portalLabel="Manager Portal" profilePath="/manager/profile" />
}
