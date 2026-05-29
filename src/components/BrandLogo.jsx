export const GAMYAM_LOGO_URL = 'https://gamyam.com/assets/logo.png'

const LOGO_URL = GAMYAM_LOGO_URL

export default function BrandLogo({
  className = 'h-9',
  tagline,
  taglineClassName = 'text-sm text-white/60',
  variant = 'default',
}) {
  if (variant === 'header') {
    return (
      <img
        src={LOGO_URL}
        alt="Gamyam HRMS"
        className={`${className} w-auto max-w-[140px] object-contain object-left sm:max-w-[160px]`}
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      <img src={LOGO_URL} alt="Gamyam" className={`${className} w-auto object-contain object-left`} />
      {tagline && <p className={taglineClassName}>{tagline}</p>}
    </div>
  )
}
