import Card from '../../components/ui/Card'
import { SUPER_ADMIN_PERMISSION_GROUPS } from '../../config/superAdminPermissions'
import PlatformUsers from './PlatformUsers'

export default function Permissions() {
  return (
    <div className="space-y-6">
       <PlatformUsers />
      <div>
        <h1 className="page-title">Super Admin permissions</h1>
        <p className="page-subtitle">
          Full platform control — all capabilities below are granted to the Super Admin role
        </p>
      </div>

      {/* <Card title="Platform responsibilities">
        <ul className="grid gap-2 sm:grid-cols-2">
          {SUPER_ADMIN_RESPONSIBILITIES.map((item) => (
            <li key={item} className="flex items-start gap-2 text-sm text-foreground">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              {item}
            </li>
          ))}
        </ul>
      </Card> */}
     

      <div className="grid gap-6 lg:grid-cols-3">
        {SUPER_ADMIN_PERMISSION_GROUPS.map((group) => (
          <Card key={group.title} title={group.title}>
            <ul className="space-y-2">
              {group.permissions.map((perm) => (
                <li
                  key={perm}
                  className="flex items-center justify-between rounded-lg bg-primary-light/30 px-3 py-2 text-sm"
                >
                  <span className="text-foreground">{perm}</span>
                  <span className="text-xs font-semibold uppercase text-primary">Full</span>
                </li>
              ))}
            </ul>
            {group.note && <p className="mt-3 text-xs text-muted">{group.note}</p>}
          </Card>
        ))}
      </div>
      
    </div>
  )
}
