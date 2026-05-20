import Card from '../../components/ui/Card'
import { useHrms } from '../../hooks/useHrms'

export default function Settings() {
  const { organization, updateOrganization } = useHrms()
  const org = organization || {}

  return (
    <div className="max-w-2xl space-y-6">
      <Card title="Company Settings">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            const fd = new FormData(e.currentTarget)
            updateOrganization({
              displayName: fd.get('displayName'),
              workHours: fd.get('workHours'),
            })
          }}
        >
          <div>
            <label className="block text-sm font-medium text-foreground">Company Name</label>
            <input
              name="displayName"
              type="text"
              key={org.displayName}
              defaultValue={org.displayName || 'Gamyam Technologies'}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground">Work Hours</label>
            <input
              name="workHours"
              type="text"
              key={org.workHours}
              defaultValue={org.workHours || '9:00 AM – 6:00 PM'}
              className="mt-1 w-full rounded-lg border border-border px-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>
          <p className="text-xs text-muted">
            Tax, logo, branches, and departments: Super Admin → Organization.
          </p>
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
    </div>
  )
}
