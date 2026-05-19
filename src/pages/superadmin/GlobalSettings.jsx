import { useEffect, useState } from 'react'
import { Save } from 'lucide-react'
import Card from '../../components/ui/Card'
import { usePlatform } from '../../hooks/usePlatform'

const TIMEZONES = ['Asia/Kolkata', 'Asia/Dubai', 'Europe/Berlin', 'America/New_York', 'UTC']
const CURRENCIES = ['INR', 'USD', 'EUR', 'AED', 'GBP']

export default function GlobalSettings() {
  const { settings, updateSettings } = usePlatform()
  const [form, setForm] = useState(settings || {})

  useEffect(() => {
    if (settings) setForm({ ...settings })
  }, [settings])

  const handleSubmit = (e) => {
    e.preventDefault()
    updateSettings({
      ...form,
      sessionTimeoutMinutes: Number(form.sessionTimeoutMinutes),
      maxOrganizations: Number(form.maxOrganizations),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Global settings</h1>
        <p className="page-subtitle">Platform-wide configuration controlled by Super Admin</p>
      </div>

      <Card title="Platform configuration" subtitle="Applies to all organizations">
        <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground">Platform name</label>
            <input
              value={form.platformName || ''}
              onChange={(e) => setForm({ ...form, platformName: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Support email</label>
            <input
              type="email"
              value={form.supportEmail || ''}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Default timezone</label>
              <select
                value={form.defaultTimezone || 'Asia/Kolkata'}
                onChange={(e) => setForm({ ...form, defaultTimezone: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>
                    {tz}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Default currency</label>
              <select
                value={form.defaultCurrency || 'INR'}
                onChange={(e) => setForm({ ...form, defaultCurrency: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-foreground">Session timeout (minutes)</label>
              <input
                type="number"
                min="30"
                value={form.sessionTimeoutMinutes ?? 480}
                onChange={(e) => setForm({ ...form, sessionTimeoutMinutes: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground">Max organizations</label>
              <input
                type="number"
                min="1"
                value={form.maxOrganizations ?? 100}
                onChange={(e) => setForm({ ...form, maxOrganizations: e.target.value })}
                className="mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border border-border bg-surface p-4">
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.maintenanceMode)}
                onChange={(e) => setForm({ ...form, maintenanceMode: e.target.checked })}
              />
              <span>
                <span className="font-medium text-foreground">Maintenance mode</span>
                <span className="mt-0.5 block text-muted">Block non–Super Admin logins</span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.allowSelfSignup)}
                onChange={(e) => setForm({ ...form, allowSelfSignup: e.target.checked })}
              />
              <span>
                <span className="font-medium text-foreground">Allow self-signup</span>
                <span className="mt-0.5 block text-muted">New organizations can register publicly</span>
              </span>
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(form.enforceMfa)}
                onChange={(e) => setForm({ ...form, enforceMfa: e.target.checked })}
              />
              <span>
                <span className="font-medium text-foreground">Enforce MFA</span>
                <span className="mt-0.5 block text-muted">Require multi-factor for all admins</span>
              </span>
            </label>
          </div>
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            <Save className="h-4 w-4" />
            Save global settings
          </button>
        </form>
      </Card>
    </div>
  )
}
