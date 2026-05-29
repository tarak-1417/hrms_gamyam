import { hasProfileImage } from '../../utils/profileImage'

const SIZE_CLASS = {
  sm: 'h-10 w-10 text-sm rounded-xl',
  md: 'h-16 w-16 text-xl rounded-2xl',
  lg: 'h-20 w-20 text-2xl rounded-2xl',
  xl: 'h-24 w-24 text-3xl rounded-2xl',
}

export default function EmployeeAvatar({ employee, size = 'md', className = '' }) {
  const sizeClass = SIZE_CLASS[size] || SIZE_CLASS.md
  const initials = employee?.avatar || 'E'

  if (hasProfileImage(employee)) {
    return (
      <img
        src={employee.profileImage}
        alt={employee?.name ? `${employee.name} profile` : 'Profile'}
        className={`shrink-0 object-cover shadow-sm ring-2 ring-white ${sizeClass} ${className}`}
      />
    )
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center bg-primary-light font-bold text-primary shadow-sm ring-2 ring-white ${sizeClass} ${className}`}
      aria-hidden={!initials}
    >
      {initials}
    </div>
  )
}
