import { useState, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'

/** Mobile drawer nav: open/close, auto-close on route change, lock body scroll when open. */
export default function useMobileNav() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return undefined
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const toggle = useCallback(() => setOpen((v) => !v), [])
  const close = useCallback(() => setOpen(false), [])

  return { open, toggle, close }
}
