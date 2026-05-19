# Gamyam HRMS

Full Human Resource Management System with **Employee**, **Manager**, **HR/Admin**, and **Super Admin** portals. Built with React, Tailwind CSS, and Recharts (animated charts from JSON data).

## Run

```bash
nvm use
npm install
npm run dev
```

## Demo logins

| Portal | Email | Password |
|--------|-------|----------|
| **Manager** (charts dashboard) | manager@gamyam.com | mgr123 |
| **HR / Admin** | admin@gamyam.com | admin123 |
| **Employee** | arjun@company.com | emp123 |
| **Super Admin** | super@gamyam.com | super123 |

## Portals & features

### Manager (`/manager`)
- Home dashboard with animated charts (attendance, leave, payroll, hiring)
- My Team, Attendance, Leave approval, Reports, Tasks

### HR / Admin (`/admin`)
- HR dashboard with analytics
- Employees, Attendance, Leave, Payroll, Recruitment, Departments
- Reports, Roles & Permissions, Settings

### Employee (`/employee`)
- Dashboard, Profile, Attendance, Leave, Payslips
- Tasks, Documents, Performance, Messages

### Super Admin (`/superadmin`)
- Platform overview, Companies, Subscriptions
- Monitoring, Analytics, Billing & Security

## Data (JSON in memory)

| File | Purpose |
|------|---------|
| `src/data/hrmsData.json` | Employees, leave, attendance, payroll, tasks, activity |
| `src/data/users.json` | Login accounts |
| `src/data/analytics.json` | Chart seed data |

Edits work during your session. **Refresh** reloads from JSON. Admin → **Settings** → **Reset data from JSON** restores defaults without refreshing.

## Tech

- React 19 + Vite
- Tailwind CSS 4
- Recharts (animated)
- React Router 7
# hrmsgamyam
# hrmsgamyam
