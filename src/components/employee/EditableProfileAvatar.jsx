import { useId } from 'react'
import { Pencil } from 'lucide-react'
import EmployeeAvatar from './EmployeeAvatar'
import { readProfileImageFile } from '../../utils/profileImage'

const SIZE_RING = {
  sm: 'rounded-xl',
  md: 'rounded-2xl',
  lg: 'rounded-2xl',
  xl: 'rounded-2xl',
}

export default function EditableProfileAvatar({
  employee,
  size = 'lg',
  className = '',
  disabled = false,
  onImageSelected,
  onError,
}) {
  const inputId = useId()
  const ringClass = SIZE_RING[size] || SIZE_RING.lg

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    try {
      const dataUrl = await readProfileImageFile(file)
      onImageSelected?.(dataUrl || '')
    } catch (error) {
      onError?.(error.message || 'Could not upload image.')
    }
  }

  return (
    <div className="relative shrink-0">
      <input
        id={inputId}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif,image/*"
        className="sr-only"
        disabled={disabled}
        onChange={handleFileChange}
      />

      <label
        htmlFor={inputId}
        className={`group relative block cursor-pointer focus-within:outline-none focus-within:ring-2 focus-within:ring-primary/40 focus-within:ring-offset-2 ${
          disabled ? 'cursor-not-allowed opacity-60' : ''
        } ${ringClass}`}
        aria-label="Change profile photo"
      >
        <EmployeeAvatar employee={employee} size={size} className={className} />

        <span
          className={`pointer-events-none absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/35 ${ringClass}`}
        >
          <span className="flex h-10 w-10 scale-90 items-center justify-center rounded-full bg-white text-primary opacity-0 shadow-lg transition-all group-hover:scale-100 group-hover:opacity-100">
            <Pencil className="h-5 w-5" />
          </span>
        </span>

        <span className="pointer-events-none absolute -bottom-0.5 -right-0.5 flex h-8 w-8 items-center justify-center rounded-full border-2 border-white bg-primary text-white shadow-md">
          <Pencil className="h-4 w-4" />
        </span>
      </label>
    </div>
  )
}
