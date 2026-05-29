import {
  BadgeCheck,
  Briefcase,
  Building2,
  Calendar,
  CreditCard,
  Fingerprint,
  GitBranch,
  Hash,
  Heart,
  Mail,
  MapPin,
  Phone,
  Shield,
  User,
  Users,
  Wallet,
} from 'lucide-react'
import { formatDisplayDate } from './timeUtils'

function maskAadhaar(value) {
  if (!value) return '—'
  const digits = String(value).replace(/\D/g, '')
  if (digits.length < 4) return value
  const last4 = digits.slice(-4)
  return `XXXX XXXX ${last4}`
}

function pickPersonal(profile) {
  return profile?.personalDetails ?? {}
}

function pickEmployment(profile) {
  return profile?.employmentDetails ?? {}
}

/** Personal & identity fields for the employee profile (read-only except contact in edit form). */
export function buildPersonalProfileFields(profile) {
  const personal = pickPersonal(profile)

  return [
    { icon: Hash, label: 'Employee ID', value: profile.id },
    { icon: User, label: 'Full name', value: profile.name },
    { icon: Mail, label: 'Work email', value: profile.email },
    { icon: Mail, label: 'Personal email', value: personal.personalEmail },
    { icon: Phone, label: 'Mobile number', value: profile.phone },
    { icon: MapPin, label: 'Current address', value: profile.address },
    { icon: Calendar, label: 'Date of birth', value: formatDisplayDate(personal.dateOfBirth) },
    { icon: User, label: 'Gender', value: personal.gender },
    { icon: Heart, label: 'Blood group', value: personal.bloodGroup },
    { icon: BadgeCheck, label: 'Marital status', value: personal.maritalStatus },
    { icon: Shield, label: 'Nationality', value: personal.nationality },
    { icon: Fingerprint, label: 'Aadhaar number', value: maskAadhaar(personal.aadhaar) },
    { icon: CreditCard, label: 'PAN', value: personal.pan },
    { icon: Wallet, label: 'UAN (PF)', value: personal.uan },
    {
      icon: Phone,
      label: 'Emergency contact',
      value: personal.emergencyContactName
        ? `${personal.emergencyContactName}${personal.emergencyContactRelation ? ` (${personal.emergencyContactRelation})` : ''}`
        : null,
    },
    { icon: Phone, label: 'Emergency phone', value: personal.emergencyContactPhone },
  ]
}

/** Organization & reporting fields (HR-managed). */
export function buildOrganizationProfileFields(profile, details) {
  const employment = pickEmployment(profile)
  const { branch, manager, directReports = [] } = details ?? {}

  return [
    { icon: Building2, label: 'Department', value: profile.department },
    { icon: Briefcase, label: 'Job title', value: profile.role },
    { icon: BadgeCheck, label: 'Employment status', value: profile.status },
    { icon: Briefcase, label: 'Employment type', value: employment.employmentType },
    { icon: MapPin, label: 'Work mode', value: employment.workMode },
    { icon: Calendar, label: 'Date of joining', value: formatDisplayDate(profile.joinDate) },
    { icon: Hash, label: 'Designation level', value: employment.designationLevel },
    { icon: Hash, label: 'Cost center', value: employment.costCenter },
    { icon: MapPin, label: 'Work location', value: employment.workLocation },
    { icon: GitBranch, label: 'Branch', value: branch?.name },
    { icon: Hash, label: 'Branch code', value: branch?.code },
    {
      icon: MapPin,
      label: 'Branch address',
      value: branch
        ? [branch.address, branch.city, branch.country].filter(Boolean).join(', ') || '—'
        : '—',
    },
    {
      icon: User,
      label: 'Reporting manager',
      value: manager ? `${manager.name} · ${manager.role}` : '—',
    },
    {
      icon: Users,
      label: 'Direct reports',
      value: directReports.length
        ? directReports.map((report) => report.name).join(', ')
        : 'No direct reports',
    },
  ]
}
