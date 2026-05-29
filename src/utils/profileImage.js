const MAX_BYTES = 2 * 1024 * 1024
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/jpg', 'image/pjpeg']
const ALLOWED_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'gif']

export function hasProfileImage(employee) {
  const src = employee?.profileImage
  return typeof src === 'string' && src.length > 0
}

function isAllowedImageFile(file) {
  if (!file) return false
  if (file.type && (ALLOWED_TYPES.includes(file.type) || file.type.startsWith('image/'))) {
    return true
  }
  const extension = file.name?.split('.').pop()?.toLowerCase()
  return extension ? ALLOWED_EXTENSIONS.includes(extension) : false
}

export function readProfileImageFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve(null)
      return
    }

    if (!isAllowedImageFile(file)) {
      reject(new Error('Please upload a JPG, PNG, WebP, or GIF image.'))
      return
    }

    if (file.size > MAX_BYTES) {
      reject(new Error('Image must be smaller than 2 MB.'))
      return
    }

    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => reject(new Error('Could not read the image file.'))
    reader.readAsDataURL(file)
  })
}
