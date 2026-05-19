const LOGO_URL = 'https://gamyam.com/assets/logo.png'

export default function BrandLogo({
  className = 'h-9',
  tagline,
  taglineClassName = 'text-sm text-white/60',
}) {
  return (
    <div className="flex flex-col gap-2">
      <img src={LOGO_URL} alt="Gamyam" className={`${className} w-auto object-contain object-left`} />
      {tagline && <p className={taglineClassName}>{tagline}</p>}
    </div>
  )
}
