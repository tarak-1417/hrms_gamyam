import { useCallback } from 'react'
import useMobileNav from './useMobileNav'
import useSidebarCollapsed from './useSidebarCollapsed'

/** Mobile drawer + desktop sidebar collapse, wired to the toolbar hamburger. */
export default function useAppNavigation() {
  const mobileNav = useMobileNav()
  const sidebar = useSidebarCollapsed()

  const toggleNavigation = useCallback(() => {
    if (window.matchMedia('(max-width: 1023px)').matches) {
      mobileNav.toggle()
      return
    }
    sidebar.toggle()
  }, [mobileNav, sidebar])

  return {
    mobileNav,
    sidebar,
    toggleNavigation,
  }
}
