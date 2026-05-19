/** Haversine distance in meters between two WGS84 points */
export function distanceMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`
  return `${(meters / 1000).toFixed(1)} km`
}

/**
 * Read browser GPS position.
 * Requires HTTPS or localhost.
 */
export function getCurrentPosition(options = {}) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by this browser.'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        })
      },
      (err) => {
        const messages = {
          1: 'Location permission denied. Allow location access to check in.',
          2: 'Unable to detect your location. Check GPS or network and try again.',
          3: 'Location request timed out. Please try again.',
        }
        reject(new Error(messages[err.code] || err.message || 'Location unavailable'))
      },
      {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 0,
        ...options,
      },
    )
  })
}

/**
 * Find nearest office and whether user is within allowed radius.
 */
export function validateOfficeProximity(position, attendancePolicy) {
  const offices = attendancePolicy?.officeLocations ?? []
  const defaultRadius = attendancePolicy?.radiusMeters ?? 500

  if (!offices.length) {
    return {
      ok: false,
      message: 'No office location configured. Contact HR.',
    }
  }

  let nearest = null
  let nearestDist = Infinity

  for (const office of offices) {
    const radius = office.radiusMeters ?? defaultRadius
    const dist = distanceMeters(
      position.latitude,
      position.longitude,
      office.latitude,
      office.longitude,
    )
    if (dist < nearestDist) {
      nearestDist = dist
      nearest = { office, radius, distanceMeters: dist }
    }
  }

  if (!nearest) {
    return { ok: false, message: 'Could not verify office location.' }
  }

  if (nearest.distanceMeters > nearest.radius) {
    return {
      ok: false,
      message: `You are ${formatDistance(nearest.distanceMeters)} from ${nearest.office.name} (allowed: ${formatDistance(nearest.radius)}). Move closer to check in.`,
      nearestOffice: nearest.office,
      distanceMeters: nearest.distanceMeters,
      allowedRadius: nearest.radius,
    }
  }

  return {
    ok: true,
    office: nearest.office,
    distanceMeters: nearest.distanceMeters,
    allowedRadius: nearest.radius,
    geo: {
      latitude: position.latitude,
      longitude: position.longitude,
      accuracy: position.accuracy,
      officeId: nearest.office.id,
      officeName: nearest.office.name,
      distanceMeters: Math.round(nearest.distanceMeters),
    },
  }
}

export function isGeoBypassEnabled() {
  return import.meta.env.VITE_GEO_CHECK_IN_BYPASS === 'true'
}

export function isGeoCheckInRequired(attendancePolicy) {
  if (isGeoBypassEnabled()) return false
  if (!attendancePolicy?.geoCheckInEnabled) return false
  return attendancePolicy.requireGeoForCheckIn !== false
}
