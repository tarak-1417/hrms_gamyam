import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import {
  Pencil,
  Save,
  X,
  MapPin,
  BadgeCheck,
  User,
  Wallet,
  ChevronRight,
  Trash2,
  Building2,
} from 'lucide-react'
import Badge from '../../components/ui/Badge'
import EditableProfileAvatar from '../../components/employee/EditableProfileAvatar'
import { useAuth } from '../../hooks/useAuth'
import { useHrms } from '../../hooks/useHrms'
import { formatINR } from '../../utils/currency'
import {
  buildOrganizationProfileFields,
  buildPersonalProfileFields,
} from '../../utils/employeeProfileDisplay'
import {
  BLOOD_GROUP_OPTIONS,
  buildProfileFormFromEmployee,
  GENDER_OPTIONS,
  MARITAL_STATUS_OPTIONS,
  profileFormToUpdates,
} from '../../utils/employeeProfileForm'

const PROFILE_TABS = [
  { id: 'personal', label: 'Personal details', icon: User },
  { id: 'organization', label: 'Organization', icon: Building2 },
  { id: 'compensation', label: 'Compensation', icon: Wallet },
]

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div className="mb-4 flex items-center gap-2 border-b border-neutral-100 pb-4">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="text-base font-bold text-foreground">{title}</h3>
        {subtitle && <p className="text-xs text-muted">{subtitle}</p>}
      </div>
    </div>
  )
}

function InfoTile({ icon: Icon, label, value, className = '' }) {
  return (
    <div
      className={`flex gap-3 rounded-2xl border border-neutral-100 bg-gradient-to-b from-white to-neutral-50/60 p-4 ${className}`}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 break-words text-sm font-semibold text-foreground">{value || '—'}</p>
      </div>
    </div>
  )
}

function Field({ label, children, className = '', hint }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold uppercase tracking-wide text-muted">{label}</label>
      <div className="mt-1.5">{children}</div>
      {hint ? <p className="mt-1 text-[11px] text-muted">{hint}</p> : null}
    </div>
  )
}

function FormSection({ title, description, children }) {
  return (
    <div className="space-y-4 rounded-2xl border border-neutral-100 bg-neutral-50/40 p-4 sm:p-5">
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        {description ? <p className="mt-0.5 text-xs text-muted">{description}</p> : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  )
}

function ProfileTabBar({ tabs, activeTab, onChange, disabled }) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-neutral-200/90 pb-px [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(id)}
          className={`flex shrink-0 items-center gap-2 whitespace-nowrap rounded-t-xl px-4 py-3 text-sm font-semibold transition ${
            activeTab === id
              ? 'border-b-2 border-primary bg-primary-light/30 text-primary-dark'
              : 'text-muted hover:bg-neutral-50 hover:text-foreground disabled:opacity-50'
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" strokeWidth={2.25} />
          {label}
        </button>
      ))}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2.5 text-sm text-foreground shadow-sm transition-colors placeholder:text-neutral-400 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20'

const selectClass = `${inputClass} appearance-none bg-[length:1rem] bg-[right_0.65rem_center] bg-no-repeat pr-9`

export default function Profile() {
  const { user, updateSession } = useAuth()
  const { employees = [], getEmployeeDetails, updateEmployeeProfile, updateEmployeeProfileImage } =
    useHrms()

  const employeeId = useMemo(() => {
    if (user?.employeeId) return user.employeeId
    if (user?.email) {
      return employees.find((e) => e.email?.toLowerCase() === user.email.toLowerCase())?.id ?? null
    }
    return null
  }, [user?.employeeId, user?.email, employees])

  const profile = useSelector((state) =>
    employeeId ? state.hrms.employees.find((employee) => employee.id === employeeId) ?? null : null,
  )

  const details = useMemo(
    () => (employeeId ? getEmployeeDetails(employeeId) : null),
    [employeeId, getEmployeeDetails, profile?.profileImage],
  )

  const [activeTab, setActiveTab] = useState('personal')
  const [editing, setEditing] = useState(false)
  const [imageError, setImageError] = useState('')
  const [form, setForm] = useState(() => buildProfileFormFromEmployee(null))

  const patchForm = (updates) => setForm((prev) => ({ ...prev, ...updates }))

  useEffect(() => {
    if (!profile || editing) return
    setForm(buildProfileFormFromEmployee(profile))
  }, [profile, editing])

  const personalFields = useMemo(
    () => (profile ? buildPersonalProfileFields(profile) : []),
    [profile],
  )
  const organizationFields = useMemo(
    () => (profile && details ? buildOrganizationProfileFields(profile, details) : []),
    [profile, details],
  )

  const displayEmployee = useMemo(
    () =>
      profile
        ? {
            ...profile,
            profileImage: form.profileImage || profile.profileImage || '',
          }
        : null,
    [profile, form.profileImage],
  )

  if (!profile || !details) {
    return (
      <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-neutral-200 bg-white py-16 text-center">
        <User className="h-12 w-12 text-neutral-300" />
        <p className="mt-4 text-sm font-medium text-foreground">Profile not found</p>
        <p className="mt-1 text-xs text-muted">Your account may not be linked to an employee record.</p>
      </div>
    )
  }

  const { branch, manager, payroll } = details

  const handleSave = (e) => {
    e.preventDefault()
    const updates = profileFormToUpdates(form, profile)
    updateEmployeeProfile(employeeId, updates)
    updateSession({ name: updates.name, email: updates.email })
    setImageError('')
    setEditing(false)
  }

  const handleCancel = () => {
    setForm(buildProfileFormFromEmployee(profile))
    setImageError('')
    setEditing(false)
  }

  const applyProfileImage = (dataUrl) => {
    if (!employeeId) return
    setImageError('')
    const image = dataUrl || null
    setForm((prev) => ({ ...prev, profileImage: image || '' }))
    updateEmployeeProfileImage(employeeId, image)
  }

  const handleRemoveImage = () => {
    if (!employeeId) return
    setImageError('')
    setForm((prev) => ({ ...prev, profileImage: '' }))
    updateEmployeeProfileImage(employeeId, null)
  }

  const startEditing = () => {
    setActiveTab('personal')
    setEditing(true)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-4">
      <div>
        <h1 className="page-title">My Profile</h1>
        <p className="page-subtitle">
          View and update your information — use tabs for personal, organization, and compensation
          details.
        </p>
      </div>

      <section className="overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-neutral-100 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
          <div className="flex items-start gap-4">
            <div className="shrink-0 space-y-1.5">
              <EditableProfileAvatar
                employee={displayEmployee ?? profile}
                size="lg"
                onImageSelected={applyProfileImage}
                onError={(message) => setImageError(message)}
              />
              <p className="max-w-[5.5rem] text-center text-[10px] leading-tight text-muted">
                Tap photo to {displayEmployee?.profileImage ? 'change' : 'add'}
              </p>
              {imageError && !editing && (
                <p className="max-w-[8rem] text-center text-[10px] font-medium text-red-600">{imageError}</p>
              )}
              </div>
            <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">{profile.name}</h2>
                  <Badge status={profile.status} />
                </div>
                <p className="mt-1 text-sm text-muted">
                {profile.id} · {profile.role} · {profile.department}
                </p>
                {branch && (
                <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-neutral-50 px-3 py-1 text-xs font-medium text-foreground">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {branch.name}
                    {branch.city ? `, ${branch.city}` : ''}
                  </p>
                )}
              </div>
            </div>

            {!editing && (
              <button
                type="button"
              onClick={startEditing}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary/25 hover:bg-surface sm:w-auto"
              >
              <Pencil className="h-4 w-4 text-primary" />
                Edit profile
              </button>
            )}
          </div>

        {!editing && (
          <div className="px-5 sm:px-6">
            <ProfileTabBar tabs={PROFILE_TABS} activeTab={activeTab} onChange={setActiveTab} />
        </div>
        )}

      {editing ? (
          <div className="p-5 sm:p-6">
            <SectionHeader
              icon={BadgeCheck}
              title="Edit profile"
              subtitle="Update your contact, identity, and emergency details. Employee ID and work role are managed by HR."
            />
            <form onSubmit={handleSave} className="space-y-6">
              <div className="flex flex-col gap-4 rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 p-4 sm:flex-row sm:items-center sm:gap-6">
                <EditableProfileAvatar
                  employee={{ ...profile, profileImage: form.profileImage }}
                  size="xl"
                  onImageSelected={applyProfileImage}
                  onError={(message) => setImageError(message)}
                />
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-semibold text-foreground">Profile photo (optional)</p>
                  <p className="text-xs text-muted">
                    Tap the photo to upload or change. JPG, PNG, WebP, or GIF up to 2 MB.
                  </p>
                  {form.profileImage && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove photo
                    </button>
                  )}
                  {imageError && <p className="text-xs font-medium text-red-600">{imageError}</p>}
            </div>
          </div>

              <FormSection title="Basic information" description="Contact details and employee reference">
                <Field label="Employee ID">
                  <input
                    readOnly
                    value={profile.id}
                    className={`${inputClass} cursor-not-allowed bg-neutral-100 text-muted`}
                  />
                </Field>
              <Field label="Full name">
                <input
                  required
                  value={form.name}
                    onChange={(e) => patchForm({ name: e.target.value })}
                  className={inputClass}
                />
              </Field>
                <Field label="Work email">
                <input
                  required
                  type="email"
                  value={form.email}
                    onChange={(e) => patchForm({ email: e.target.value })}
                  className={inputClass}
                />
              </Field>
                <Field label="Personal email">
                  <input
                    type="email"
                    value={form.personalEmail}
                    onChange={(e) => patchForm({ personalEmail: e.target.value })}
                    className={inputClass}
                    placeholder="you@gmail.com"
                  />
                </Field>
                <Field label="Mobile number">
                <input
                  value={form.phone}
                    onChange={(e) => patchForm({ phone: e.target.value })}
                  className={inputClass}
                  placeholder="+91 98765 43210"
                />
              </Field>
                <Field label="Current address" className="sm:col-span-2">
                <textarea
                  rows={3}
                  value={form.address}
                    onChange={(e) => patchForm({ address: e.target.value })}
                    className={inputClass}
                    placeholder="Street, city, state, PIN"
                  />
                </Field>
              </FormSection>

              <FormSection title="Personal & identity" description="Date of birth, IDs, and statutory numbers">
                <Field label="Date of birth">
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => patchForm({ dateOfBirth: e.target.value })}
                    className={inputClass}
                  />
                </Field>
                <Field label="Gender">
                  <select
                    value={form.gender}
                    onChange={(e) => patchForm({ gender: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select gender</option>
                    {GENDER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Blood group">
                  <select
                    value={form.bloodGroup}
                    onChange={(e) => patchForm({ bloodGroup: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select blood group</option>
                    {BLOOD_GROUP_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Marital status">
                  <select
                    value={form.maritalStatus}
                    onChange={(e) => patchForm({ maritalStatus: e.target.value })}
                    className={selectClass}
                  >
                    <option value="">Select status</option>
                    {MARITAL_STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Nationality">
                  <input
                    value={form.nationality}
                    onChange={(e) => patchForm({ nationality: e.target.value })}
                    className={inputClass}
                    placeholder="Indian"
                  />
                </Field>
                <Field
                  label="Aadhaar number"
                  hint="12-digit number. Shown masked on your profile after saving."
                >
                  <input
                    value={form.aadhaar}
                    onChange={(e) => patchForm({ aadhaar: e.target.value })}
                    className={inputClass}
                    placeholder="2345 6789 0123"
                    inputMode="numeric"
                    maxLength={14}
                  />
                </Field>
                <Field label="PAN">
                  <input
                    value={form.pan}
                    onChange={(e) => patchForm({ pan: e.target.value.toUpperCase() })}
                    className={inputClass}
                    placeholder="ABCPM4521K"
                    maxLength={10}
                  />
                </Field>
                <Field label="UAN (PF)">
                  <input
                    value={form.uan}
                    onChange={(e) => patchForm({ uan: e.target.value })}
                    className={inputClass}
                    placeholder="101234567890"
                    inputMode="numeric"
                  />
                </Field>
              </FormSection>

              <FormSection title="Emergency contact" description="Person to reach in case of emergency">
                <Field label="Contact name">
                  <input
                    value={form.emergencyContactName}
                    onChange={(e) => patchForm({ emergencyContactName: e.target.value })}
                    className={inputClass}
                    placeholder="Full name"
                  />
                </Field>
                <Field label="Relationship">
                  <input
                    value={form.emergencyContactRelation}
                    onChange={(e) => patchForm({ emergencyContactRelation: e.target.value })}
                    className={inputClass}
                    placeholder="Father, Spouse, etc."
                  />
                </Field>
                <Field label="Emergency phone" className="sm:col-span-2">
                  <input
                    value={form.emergencyContactPhone}
                    onChange={(e) => patchForm({ emergencyContactPhone: e.target.value })}
                  className={inputClass}
                    placeholder="+91 98765 43100"
                />
              </Field>
              </FormSection>

            <div className="flex flex-wrap gap-2 border-t border-neutral-100 pt-4">
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 hover:bg-primary-dark"
              >
                <Save className="h-4 w-4" />
                Save changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex items-center gap-2 rounded-xl border border-neutral-200 bg-white px-5 py-2.5 text-sm font-semibold text-foreground hover:bg-neutral-50"
              >
                <X className="h-4 w-4" />
                Cancel
              </button>
            </div>
          </form>
          </div>
        ) : (
          <div className="p-5 sm:p-6">
            {activeTab === 'personal' && (
              <div>
                <SectionHeader
                  icon={User}
                  title="Personal details"
                  subtitle="Identity, contact, and emergency information on file"
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  {personalFields.map(({ icon, label, value }) => (
                    <InfoTile key={label} icon={icon} label={label} value={value} />
                  ))}
                </div>
                <p className="mt-4 rounded-xl bg-neutral-50 px-3 py-2.5 text-xs leading-relaxed text-muted">
                  Aadhaar is shown in masked form for your security. Use Edit profile to update your
                  personal and identity details.
                </p>
              </div>
            )}

            {activeTab === 'organization' && (
              <div>
                <SectionHeader
                  icon={Building2}
                  title="Organization details"
                  subtitle="Your role, branch, and reporting structure"
                />
            <div className="grid gap-3 sm:grid-cols-2">
                  {organizationFields.map(({ icon, label, value }) => (
                <InfoTile key={label} icon={icon} label={label} value={value} />
              ))}
            </div>
                {manager && (
                  <div className="mt-4 rounded-2xl border border-primary/15 bg-primary-light/30 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                      Reporting manager
                    </p>
                    <p className="mt-1 text-sm font-semibold text-foreground">
                      {manager.name} · {manager.role}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">{manager.email}</p>
                  </div>
                )}
            <p className="mt-4 rounded-xl bg-primary-light/50 px-3 py-2 text-xs text-muted">
                  Department, role, branch, and reporting line are updated by HR. Contact your manager
                  if something looks incorrect.
                </p>
              </div>
            )}

            {activeTab === 'compensation' && (
              <div>
                <SectionHeader
                  icon={Wallet}
                  title="Compensation"
                  subtitle={
                    payroll?.month ? `Latest payroll month: ${payroll.month}` : 'Your salary summary'
                  }
                />
                {payroll ? (
                  <>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <InfoTile icon={Wallet} label="Annual CTC" value={formatINR(payroll.yearlyCtc)} />
                      <InfoTile icon={Wallet} label="Gross / month" value={formatINR(payroll.grossSalary)} />
                      <InfoTile icon={Wallet} label="Deductions" value={formatINR(payroll.deductions)} />
                      <InfoTile icon={Wallet} label="Net pay / month" value={formatINR(payroll.net)} />
                    </div>
                    <Link
                      to="/employee/payslips"
                      className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                    >
                      View detailed payslips
                      <ChevronRight className="h-4 w-4" />
                    </Link>
                  </>
                ) : (
                  <p className="rounded-2xl border border-dashed border-neutral-200 bg-neutral-50/80 px-4 py-8 text-center text-sm text-muted">
                    Payroll details are not available yet. Check payslips once HR publishes your salary
                    record.
                  </p>
                )}
              </div>
            )}
        </div>
      )}
      </section>
    </div>
  )
}
