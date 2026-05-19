import { useEffect, useRef, useState } from 'react'

/**
 * Hover tooltip or richer popover anchored below a top-bar control.
 */
export default function TopBarHoverPanel({
  children,
  title,
  content,
  align = 'right',
  className = '',
  panelClassName = '',
}) {
  const rootRef = useRef(null)
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(null)

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const scheduleClose = () => {
    clearCloseTimer()
    closeTimer.current = setTimeout(() => setOpen(false), 120)
  }

  const handleEnter = () => {
    clearCloseTimer()
    setOpen(true)
  }

  useEffect(() => () => clearCloseTimer(), [])

  const alignClass =
    align === 'center' ? 'left-1/2 -translate-x-1/2' : align === 'left' ? 'left-0' : 'right-0'

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={handleEnter}
      onMouseLeave={scheduleClose}
    >
      {children}
      {open && (
        <div
          role="tooltip"
          className={`topbar-hover-panel absolute top-full z-50 mt-2 min-w-[10rem] ${alignClass} ${panelClassName}`}
          onMouseEnter={handleEnter}
          onMouseLeave={scheduleClose}
        >
          {title && (
            <p className="border-b border-border/80 px-3 py-2 text-xs font-semibold text-foreground">
              {title}
            </p>
          )}
          <div className={title ? 'p-2' : ''}>{content}</div>
        </div>
      )}
    </div>
  )
}
