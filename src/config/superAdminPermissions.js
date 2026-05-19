/** Super Admin capability matrix (platform control — full access) */

export const SUPER_ADMIN_RESPONSIBILITIES = [
  'Create and manage platform organizations (tenants)',
  'Manage companies, plans, and activation status',
  'Add, remove, and block HR admins and other users',
  'Manage subscriptions and billing',
  'Control global platform settings',
  'View all organizations on the platform',
  'Access every HRMS module for support and oversight',
  'View and export full audit logs for security monitoring',
  'Restore soft-deleted records from the recycle bin (employees, payroll, leave, org data)',
]

export const SUPER_ADMIN_PERMISSION_GROUPS = [
  {
    title: 'Organization management',
    permissions: [
      'Create organization',
      'Edit organization',
      'Delete organization',
      'Activate / deactivate organization',
    ],
  },
  {
    title: 'User management',
    permissions: [
      'Create admin users',
      'Reset passwords',
      'Block users',
      'Assign roles',
    ],
  },
  {
    title: 'Deleted records recovery',
    permissions: [
      'View recycle bin',
      'Restore deleted records',
      'Permanently purge from recycle bin',
    ],
    note: 'Super Admin only — HR Admin deletes move items here but cannot restore',
  },
  {
    title: 'HRMS module access',
    permissions: [
      'Employees',
      'Attendance',
      'Leave',
      'Payroll',
      'Recruitment',
      'Reports',
      'Settings',
      'Audit logs (full)',
    ],
    note: 'Full access — same as HR Admin, plus platform controls',
  },
]

export const HR_ADMIN_AUDIT_NOTE =
  'View-only access to HR-scoped audit logs (employees, leave, payroll, etc.). Platform and security logs are Super Admin only.'

export const PLATFORM_ROLES = [
  { id: 'superadmin', label: 'Super Admin', description: 'Full platform control' },
  { id: 'admin', label: 'HR Admin', description: 'Organization HR operations' },
  { id: 'manager', label: 'Manager', description: 'Team and approvals' },
  { id: 'employee', label: 'Employee', description: 'Self-service portal' },
]

export const ORGANIZATION_PLANS = ['Starter', 'Professional', 'Enterprise']
export const ORGANIZATION_STATUSES = ['active', 'trial', 'inactive']
