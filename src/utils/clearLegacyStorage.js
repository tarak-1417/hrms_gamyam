/** Legacy keys from an older HrmsContext / AuthContext — app no longer reads or writes these */
const LEGACY_KEYS = ['hrms_data_v1', 'hrms_user', 'hrms_data', 'gamyam_hrms']

/**
 * Remove stale HRMS data from localStorage so the browser does not keep
 * serving old cached JSON instead of fresh in-memory state from hrmsData.json.
 */
export function clearLegacyHrmsStorage() {
  if (typeof window === 'undefined' || !window.localStorage) return

  try {
    LEGACY_KEYS.forEach((key) => localStorage.removeItem(key))

    const toRemove = []
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i)
      if (key && (key.startsWith('hrms_') || key.startsWith('gamyam_hrms'))) {
        toRemove.push(key)
      }
    }
    toRemove.forEach((key) => localStorage.removeItem(key))
  } catch {
    /* ignore private mode / blocked storage */
  }
}
