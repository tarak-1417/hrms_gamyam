import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'hrAdminTheme'

function readInitial() {
  if (typeof window === 'undefined') return 'dark'
  try {
    return window.localStorage.getItem(STORAGE_KEY) === 'light' ? 'light' : 'dark'
  } catch {
    return 'dark'
  }
}

/** Persisted dark / light theme for the HR Admin portal. */
export default function useAdminTheme() {
  const [theme, setTheme] = useState(readInitial)

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, theme)
    } catch {
      /* ignore storage failures */
    }
  }, [theme])

  const toggle = useCallback(() => {
    setTheme((current) => (current === 'dark' ? 'light' : 'dark'))
  }, [])

  return { theme, toggle, isDark: theme === 'dark' }
}
