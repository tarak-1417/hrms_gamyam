import { MapPin } from 'lucide-react'
import Card from '../../components/ui/Card'
import { useHrms } from '../../hooks/useHrms'

export default function Settings() {
  const { showToast, attendancePolicy } = useHrms()

  return (
    <div className="max-w-2xl space-y-6">
      <Card title="Company Settings">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            showToast('Settings saved (session only)')
          }}
        >
          <div>
            <label className="block text-sm font-medium text-foreground">Company Name</label>
            <input
              type="text"
              defaultValue="Gamyam Technologies"
              className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Work Hours</label>
            <input
              type="text"
              defaultValue="9:00 AM – 6:00 PM"
              className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Leave Policy</label>
            <select className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary">
              <option>Standard (12 CL, 12 SL, 15 EL)</option>
              <option>Flexible</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
          >
            Save Changes
          </button>
        </form>
      </Card>

      <Card title="Geo check-in" subtitle="Office location for employee attendance">
        <div className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4">
          <MapPin className="h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {attendancePolicy?.geoCheckInEnabled ? 'Enabled' : 'Disabled'} — employees must be
              within office radius to check in
            </p>
            {(attendancePolicy?.officeLocations ?? []).map((office) => (
              <div key={office.id} className="mt-3 rounded-lg bg-white p-3 ring-1 ring-border">
                <p className="font-medium">{office.name}</p>
                <p className="mt-1 text-xs text-muted">{office.address}</p>
                <p className="mt-1 font-mono text-xs text-muted">
                  {office.latitude}, {office.longitude} · radius {office.radiusMeters ?? attendancePolicy?.radiusMeters} m
                </p>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
