import {
  LayoutDashboard,
  Building2,
  CreditCard,
  Activity,
  BarChart3,
  Shield,
  FileStack,
} from 'lucide-react'
import HrLayout from './HrLayout'

const navItems = [
  { to: '/superadmin', icon: LayoutDashboard, label: 'Overview' },
  { to: '/superadmin/companies', icon: Building2, label: 'Companies' },
  { to: '/superadmin/documents', icon: FileStack, label: 'Documents' },
  { to: '/superadmin/subscriptions', icon: CreditCard, label: 'Subscriptions' },
  { to: '/superadmin/monitoring', icon: Activity, label: 'Monitoring' },
  { to: '/superadmin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/superadmin/billing', icon: Shield, label: 'Billing & Security' },
]

export default function SuperAdminLayout() {
  return <HrLayout navItems={navItems} portalLabel="Super Admin" />
}
