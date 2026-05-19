import { useEffect, useMemo, useState } from 'react'
import { Building2, Briefcase, GitBranch, MapPin, Network, Save, Plus, Pencil, Trash2 } from 'lucide-react'
import Card from '../../components/ui/Card'
import { useHrms } from '../../hooks/useHrms'
import { getEmployeeManagerName } from '../../utils/organizationHelpers'

const TABS = [
  { id: 'company', label: 'Company', icon: Building2 },
  { id: 'departments', label: 'Departments', icon: Network },
  { id: 'designations', label: 'Designations', icon: Briefcase },
  { id: 'branches', label: 'Branches', icon: MapPin },
  { id: 'reporting', label: 'Reporting', icon: GitBranch },
]

const inputClass =
  'mt-1 w-full rounded-lg border border-border px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary'
const labelClass = 'block text-sm font-medium text-foreground'

const TIMEZONES = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Europe/Berlin',
  'America/New_York',
  'UTC',
]

const CURRENCIES = ['INR', 'USD', 'EUR', 'AED', 'GBP']

function emptyDept() {
  return { name: '', code: '', head: '', headEmployeeId: '', status: 'active' }
}

function emptyDesig() {
  return { title: '', department: '', level: '', status: 'active' }
}

function emptyBranch() {
  return {
    name: '',
    code: '',
    address: '',
    city: '',
    country: '',
    timezone: 'Asia/Kolkata',
    contactPhone: '',
    isHeadOffice: false,
    status: 'active',
    latitude: '',
    longitude: '',
    radiusMeters: 500,
  }
}

export default function Organization() {
  const {
    organization,
    departments,
    designations,
    branches,
    employees,
    updateOrganization,
    upsertDepartment,
    deleteDepartment,
    upsertDesignation,
    deleteDesignation,
    upsertBranch,
    deleteBranch,
    setReportingStructure,
  } = useHrms()

  const [tab, setTab] = useState('company')
  const [companyForm, setCompanyForm] = useState({
    legalName: '',
    displayName: '',
    logoUrl: '',
    address: {},
    contact: {},
    tax: {},
    timezone: 'Asia/Kolkata',
    currency: 'INR',
    workHours: '',
    hrSignatory: '',
  })

  useEffect(() => {
    if (!organization) return
    setCompanyForm({
      ...organization,
      address: { ...organization.address },
      contact: { ...organization.contact },
      tax: { ...organization.tax },
    })
  }, [organization])

  const [deptForm, setDeptForm] = useState(emptyDept())
  const [editingDeptId, setEditingDeptId] = useState(null)
  const [desigForm, setDesigForm] = useState(emptyDesig())
  const [editingDesigId, setEditingDesigId] = useState(null)
  const [branchForm, setBranchForm] = useState(emptyBranch())
  const [editingBranchId, setEditingBranchId] = useState(null)
  const [reportingDraft, setReportingDraft] = useState({})

  const activeEmployees = useMemo(
    () => employees.filter((e) => e.status !== 'inactive'),
    [employees],
  )

  const managerOptions = useMemo(
    () => activeEmployees.filter((e) => e.status === 'active'),
    [activeEmployees],
  )

  const saveCompany = (e) => {
    e.preventDefault()
    updateOrganization(companyForm)
  }

  const saveDept = (e) => {
    e.preventDefault()
    if (!deptForm.name.trim()) return
    const headEmp = deptForm.headEmployeeId
      ? employees.find((em) => em.id === deptForm.headEmployeeId)
      : null
    upsertDepartment({
      ...deptForm,
      id: editingDeptId ?? undefined,
      head: headEmp?.name || deptForm.head || '',
      headEmployeeId: deptForm.headEmployeeId || null,
    })
    setDeptForm(emptyDept())
    setEditingDeptId(null)
  }

  const saveDesig = (e) => {
    e.preventDefault()
    if (!desigForm.title.trim()) return
    upsertDesignation({ ...desigForm, id: editingDesigId ?? undefined })
    setDesigForm(emptyDesig())
    setEditingDesigId(null)
  }

  const saveBranch = (e) => {
    e.preventDefault()
    if (!branchForm.name.trim()) return
    upsertBranch({
      ...branchForm,
      id: editingBranchId ?? undefined,
      latitude: branchForm.latitude === '' ? null : Number(branchForm.latitude),
      longitude: branchForm.longitude === '' ? null : Number(branchForm.longitude),
      radiusMeters: branchForm.radiusMeters === '' ? null : Number(branchForm.radiusMeters),
    })
    setBranchForm(emptyBranch())
    setEditingBranchId(null)
  }

  const initReporting = () => {
    const draft = {}
    activeEmployees.forEach((e) => {
      draft[e.id] = e.managerId || ''
    })
    setReportingDraft(draft)
  }

  const saveReporting = () => {
    const assignments = Object.entries(reportingDraft).map(([employeeId, managerId]) => ({
      employeeId,
      managerId: managerId || null,
    }))
    setReportingStructure(assignments)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-title">Organization Setup</h1>
        <p className="page-subtitle">
          Company profile, departments, designations, branches, and reporting hierarchy
        </p>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-border pb-1">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id)
              if (id === 'reporting' && !Object.keys(reportingDraft).length) initReporting()
            }}
            className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
              tab === id
                ? 'bg-primary text-white'
                : 'text-muted hover:bg-neutral-100 hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'company' && (
        <Card title="Company information" subtitle="Legal identity, tax, locale, and branding">
          <form onSubmit={saveCompany} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Legal name *</label>
                <input
                  required
                  value={companyForm.legalName || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, legalName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Display name *</label>
                <input
                  required
                  value={companyForm.displayName || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, displayName: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>Logo URL</label>
                <input
                  value={companyForm.logoUrl || ''}
                  onChange={(e) => setCompanyForm({ ...companyForm, logoUrl: e.target.value })}
                  placeholder="https://… or /assets/logo.png"
                  className={inputClass}
                />
              </div>
            </div>

            <fieldset className="space-y-3 rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-semibold text-foreground">Address</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className={labelClass}>Street / line 1</label>
                  <input
                    value={companyForm.address?.line1 || ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        address: { ...companyForm.address, line1: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                {['city', 'state', 'postalCode', 'country'].map((key) => (
                  <div key={key}>
                    <label className={labelClass}>{key.replace(/([A-Z])/g, ' $1')}</label>
                    <input
                      value={companyForm.address?.[key] || ''}
                      onChange={(e) =>
                        setCompanyForm({
                          ...companyForm,
                          address: { ...companyForm.address, [key]: e.target.value },
                        })
                      }
                      className={inputClass}
                    />
                  </div>
                ))}
              </div>
            </fieldset>

            <fieldset className="space-y-3 rounded-xl border border-border p-4">
              <legend className="px-1 text-sm font-semibold text-foreground">Contact & tax</legend>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Phone</label>
                  <input
                    value={companyForm.contact?.phone || ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        contact: { ...companyForm.contact, phone: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Email *</label>
                  <input
                    required
                    type="email"
                    value={companyForm.contact?.email || ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        contact: { ...companyForm.contact, email: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Website</label>
                  <input
                    value={companyForm.contact?.website || ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        contact: { ...companyForm.contact, website: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>HR signatory</label>
                  <input
                    value={companyForm.hrSignatory || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, hrSignatory: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>GSTIN</label>
                  <input
                    value={companyForm.tax?.gstin || ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        tax: { ...companyForm.tax, gstin: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>PAN</label>
                  <input
                    value={companyForm.tax?.pan || ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        tax: { ...companyForm.tax, pan: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>TAN</label>
                  <input
                    value={companyForm.tax?.tan || ''}
                    onChange={(e) =>
                      setCompanyForm({
                        ...companyForm,
                        tax: { ...companyForm.tax, tan: e.target.value },
                      })
                    }
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Time zone *</label>
                  <select
                    required
                    value={companyForm.timezone || 'Asia/Kolkata'}
                    onChange={(e) => setCompanyForm({ ...companyForm, timezone: e.target.value })}
                    className={inputClass}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Currency *</label>
                  <select
                    required
                    value={companyForm.currency || 'INR'}
                    onChange={(e) => setCompanyForm({ ...companyForm, currency: e.target.value })}
                    className={inputClass}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className={labelClass}>Default work hours</label>
                  <input
                    value={companyForm.workHours || ''}
                    onChange={(e) => setCompanyForm({ ...companyForm, workHours: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
            </fieldset>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-dark"
            >
              <Save className="h-4 w-4" />
              Save company profile
            </button>
          </form>
        </Card>
      )}

      {tab === 'departments' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={editingDeptId ? 'Edit department' : 'Add department'}>
            <form onSubmit={saveDept} className="space-y-4">
              <div>
                <label className={labelClass}>Name *</label>
                <input
                  required
                  value={deptForm.name}
                  onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
                  placeholder="e.g. Engineering"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Code</label>
                <input
                  value={deptForm.code}
                  onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value })}
                  placeholder="ENG"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Department head</label>
                <select
                  value={deptForm.headEmployeeId || ''}
                  onChange={(e) => setDeptForm({ ...deptForm, headEmployeeId: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— Select employee —</option>
                  {activeEmployees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.role})
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-white"
                >
                  <Plus className="h-4 w-4" />
                  {editingDeptId ? 'Update' : 'Add'}
                </button>
                {editingDeptId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDeptId(null)
                      setDeptForm(emptyDept())
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>
          <Card title="Departments" subtitle={`${departments?.length ?? 0} units`}>
            <ul className="divide-y divide-border">
              {(departments || []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div>
                    <p className="font-medium text-foreground">
                      {d.name}
                      {d.code && (
                        <span className="ml-2 text-xs font-normal text-muted">({d.code})</span>
                      )}
                    </p>
                    <p className="text-xs text-muted">Head: {d.head || '—'}</p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDeptId(d.id)
                        setDeptForm({
                          name: d.name,
                          code: d.code || '',
                          head: d.head || '',
                          headEmployeeId: d.headEmployeeId || '',
                          status: d.status || 'active',
                        })
                      }}
                      className="rounded-lg p-2 text-muted hover:bg-neutral-100"
                      aria-label="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDepartment(d.id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'designations' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={editingDesigId ? 'Edit designation' : 'Add designation'}>
            <form onSubmit={saveDesig} className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input
                  required
                  value={desigForm.title}
                  onChange={(e) => setDesigForm({ ...desigForm, title: e.target.value })}
                  placeholder="Software Engineer"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Default department</label>
                <select
                  value={desigForm.department}
                  onChange={(e) => setDesigForm({ ...desigForm, department: e.target.value })}
                  className={inputClass}
                >
                  <option value="">— Any —</option>
                  {(departments || []).map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Level</label>
                <input
                  value={desigForm.level}
                  onChange={(e) => setDesigForm({ ...desigForm, level: e.target.value })}
                  placeholder="L2"
                  className={inputClass}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-white"
                >
                  {editingDesigId ? 'Update' : 'Add'}
                </button>
                {editingDesigId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingDesigId(null)
                      setDesigForm(emptyDesig())
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>
          <Card title="Designations" subtitle="Job titles used when hiring">
            <ul className="max-h-[28rem] divide-y divide-border overflow-y-auto">
              {(designations || []).map((d) => (
                <li key={d.id} className="flex items-center justify-between gap-3 py-3 first:pt-0">
                  <div>
                    <p className="font-medium text-foreground">{d.title}</p>
                    <p className="text-xs text-muted">
                      {[d.department, d.level].filter(Boolean).join(' · ') || '—'}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingDesigId(d.id)
                        setDesigForm({
                          title: d.title,
                          department: d.department || '',
                          level: d.level || '',
                          status: d.status || 'active',
                        })
                      }}
                      className="rounded-lg p-2 text-muted hover:bg-neutral-100"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteDesignation(d.id)}
                      className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'branches' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card title={editingBranchId ? 'Edit branch' : 'Add branch'}>
            <form onSubmit={saveBranch} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Name *</label>
                  <input
                    required
                    value={branchForm.name}
                    onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Code</label>
                  <input
                    value={branchForm.code}
                    onChange={(e) => setBranchForm({ ...branchForm, code: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <div>
                <label className={labelClass}>Address</label>
                <input
                  value={branchForm.address}
                  onChange={(e) => setBranchForm({ ...branchForm, address: e.target.value })}
                  className={inputClass}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>City</label>
                  <input
                    value={branchForm.city}
                    onChange={(e) => setBranchForm({ ...branchForm, city: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input
                    value={branchForm.country}
                    onChange={(e) => setBranchForm({ ...branchForm, country: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Time zone</label>
                  <select
                    value={branchForm.timezone}
                    onChange={(e) => setBranchForm({ ...branchForm, timezone: e.target.value })}
                    className={inputClass}
                  >
                    {TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Contact phone</label>
                  <input
                    value={branchForm.contactPhone}
                    onChange={(e) => setBranchForm({ ...branchForm, contactPhone: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Latitude (geo check-in)</label>
                  <input
                    type="number"
                    step="any"
                    value={branchForm.latitude}
                    onChange={(e) => setBranchForm({ ...branchForm, latitude: e.target.value })}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={branchForm.longitude}
                    onChange={(e) => setBranchForm({ ...branchForm, longitude: e.target.value })}
                    className={inputClass}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={branchForm.isHeadOffice}
                  onChange={(e) =>
                    setBranchForm({ ...branchForm, isHeadOffice: e.target.checked })
                  }
                />
                Head office
              </label>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary py-2 text-sm font-semibold text-white"
                >
                  {editingBranchId ? 'Update' : 'Add'}
                </button>
                {editingBranchId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBranchId(null)
                      setBranchForm(emptyBranch())
                    }}
                    className="rounded-lg border border-border px-4 py-2 text-sm"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </Card>
          <Card title="Branches / locations" subtitle="Geo-enabled branches sync to attendance check-in">
            <ul className="divide-y divide-border">
              {(branches || []).map((b) => (
                <li key={b.id} className="py-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-foreground">
                        {b.name}
                        {b.isHeadOffice && (
                          <span className="ml-2 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary">
                            HQ
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-muted">
                        {b.city}, {b.country} · {b.timezone}
                      </p>
                      {b.latitude != null && (
                        <p className="mt-1 font-mono text-[10px] text-muted">
                          {b.latitude}, {b.longitude}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBranchId(b.id)
                          setBranchForm({
                            name: b.name,
                            code: b.code || '',
                            address: b.address || '',
                            city: b.city || '',
                            country: b.country || '',
                            timezone: b.timezone || 'Asia/Kolkata',
                            contactPhone: b.contactPhone || '',
                            isHeadOffice: Boolean(b.isHeadOffice),
                            status: b.status || 'active',
                            latitude: b.latitude ?? '',
                            longitude: b.longitude ?? '',
                            radiusMeters: b.radiusMeters ?? 500,
                          })
                        }}
                        className="rounded-lg p-2 text-muted hover:bg-neutral-100"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteBranch(b.id)}
                        className="rounded-lg p-2 text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'reporting' && (
        <Card
          title="Reporting structure"
          subtitle="Who reports to whom — used for manager team views and HR letters"
          action={
            <button
              type="button"
              onClick={saveReporting}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-sm font-semibold text-white"
            >
              <Save className="h-4 w-4" />
              Save all
            </button>
          }
        >
          <div className="table-scroll">
            <table className="w-full min-w-[32rem] text-sm">
              <thead className="bg-neutral-50 text-muted">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Employee</th>
                  <th className="px-4 py-3 text-left font-medium">Department</th>
                  <th className="px-4 py-3 text-left font-medium">Reports to</th>
                  <th className="px-4 py-3 text-left font-medium">Current manager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {activeEmployees.map((e) => (
                  <tr key={e.id}>
                    <td className="px-4 py-3 font-medium">
                      {e.name}
                      <span className="ml-1 text-xs text-muted">({e.id})</span>
                    </td>
                    <td className="px-4 py-3 text-muted">{e.department}</td>
                    <td className="px-4 py-3">
                      <select
                        value={reportingDraft[e.id] ?? e.managerId ?? ''}
                        onChange={(ev) =>
                          setReportingDraft({ ...reportingDraft, [e.id]: ev.target.value })
                        }
                        className="w-full max-w-xs rounded-lg border border-border px-2 py-1.5 text-sm"
                      >
                        <option value="">— No manager —</option>
                        {managerOptions
                          .filter((m) => m.id !== e.id)
                          .map((m) => (
                            <option key={m.id} value={m.id}>
                              {m.name} · {m.role}
                            </option>
                          ))}
                      </select>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {getEmployeeManagerName(employees, e.managerId)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
