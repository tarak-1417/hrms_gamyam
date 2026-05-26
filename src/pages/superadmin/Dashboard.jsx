import { Link } from 'react-router-dom'
import {
  Building2,
  Users,
  Network,
  UserCog,
  Shield,
  ArchiveRestore,
} from 'lucide-react'
import KpiCard from '../../components/hr/KpiCard'
import ChartCard from '../../components/charts/ChartCard'
import PlatformGrowthChart from '../../components/charts/PlatformGrowthChart'
import ActivityFeed from '../../components/hr/ActivityFeed'
import Card from '../../components/ui/Card'
import { usePlatform } from '../../hooks/usePlatform'
import { SUPER_ADMIN_RESPONSIBILITIES } from '../../config/superAdminPermissions'

const quickLinks = [
  { to: '/superadmin/companies', icon: Building2, label: 'Organizations', desc: 'Create & manage tenants' },
  { to: '/superadmin/users', icon: UserCog, label: 'Users & access', desc: 'HR admins, roles, passwords' },
  { to: '/superadmin/organization', icon: Network, label: 'Org setup', desc: 'Departments, branches, reporting' },
  { to: '/superadmin/permissions', icon: Shield, label: 'Permissions', desc: 'Super Admin capabilities' },
  { to: '/superadmin/trash', icon: ArchiveRestore, label: 'Recycle bin', desc: 'Restore deleted records' },
  { to: '/superadmin/hr/employees', icon: Users, label: 'HR modules', desc: 'Full HRMS access' },
]

export default function SuperAdminDashboard() {
  const { organizations, users } = usePlatform()
  const activeOrgs = (organizations || []).filter((o) => o.status === 'active' || o.status === 'trial').length
  const adminUsers = (users || []).filter((u) => u.role === 'admin' && !u.blocked).length

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Platform overview</h1>
        <p className="mt-1 text-muted">
          Super Admin controls the entire platform — organizations, users, subscriptions, and all
          HRMS modules
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <KpiCard icon={Building2} label="Organizations" value={activeOrgs} to="/superadmin/companies" />
        <KpiCard icon={Users} label="HR admins" value={adminUsers} to="/superadmin/users" />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card title="Super Admin responsibilities" className="lg:col-span-1">
          <ul className="space-y-2 text-sm text-muted">
            {SUPER_ADMIN_RESPONSIBILITIES.slice(0, 5).map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
          <Link
            to="/superadmin/permissions"
            className="mt-4 inline-block text-sm font-semibold text-primary hover:text-primary-dark"
          >
            View all permissions →
          </Link>
        </Card>

        <div className="grid gap-3 sm:grid-cols-2 lg:col-span-2">
          {quickLinks.map(({ to, icon: Icon, label, desc }) => (
            <Link
              key={to}
              to={to}
              className="flex items-start gap-3 rounded-xl border border-border bg-white p-4 shadow-sm transition hover:border-primary/30 hover:shadow-md"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="font-semibold text-foreground">{label}</p>
                <p className="mt-0.5 text-xs text-muted">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <ChartCard title="Platform growth" subtitle="Companies & users" className="lg:col-span-2">
          <PlatformGrowthChart />
        </ChartCard>
        <ActivityFeed />
      </div>
    </div>
  )
}
