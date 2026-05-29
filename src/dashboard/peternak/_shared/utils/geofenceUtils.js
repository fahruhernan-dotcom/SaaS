/**
 * Geofence Utilities for TernakOS
 * Client-side distance calculation and browser Geolocation wrappers.
 */

/**
 * Calculates the geodetic distance between two coordinates using the Haversine formula.
 * @param {number|string} lat1 - Latitude of point 1
 * @param {number|string} lon1 - Longitude of point 1
 * @param {number|string} lat2 - Latitude of point 2
 * @param {number|string} lon2 - Longitude of point 2
 * @returns {number|null} Distance in meters, or null if coordinates are invalid.
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null
  const nLat1 = Number(lat1)
  const nLon1 = Number(lon1)
  const nLat2 = Number(lat2)
  const nLon2 = Number(lon2)
  if (isNaN(nLat1) || isNaN(nLon1) || isNaN(nLat2) || isNaN(nLon2)) return null

  const R = 6371e3 // Earth radius in meters
  const phi1 = (nLat1 * Math.PI) / 180
  const phi2 = (nLat2 * Math.PI) / 180
  const deltaPhi = ((nLat2 - nLat1) * Math.PI) / 180
  const deltaLambda = ((nLon2 - nLon1) * Math.PI) / 180

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) *
    Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Promise-wrapped geolocation fetch.
 * @param {PositionOptions} options - Options passed to getCurrentPosition
 * @returns {Promise<GeolocationPosition>}
 */
export function getCurrentPosition(options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }) {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, options)
  })
}

/**
 * Calculates the relative coordinate offsets (X, Y) in meters of a user location
 * relative to a farm center coordinate.
 * @param {number|string} userLat - User latitude
 * @param {number|string} userLon - User longitude
 * @param {number|string} farmLat - Farm center latitude
 * @param {number|string} farmLon - Farm center longitude
 * @returns {{x: number, y: number}|null}
 */
export function getRelativeXY(userLat, userLon, farmLat, farmLon) {
  if (userLat == null || userLon == null || farmLat == null || farmLon == null) return null
  const uLat = Number(userLat)
  const uLon = Number(userLon)
  const fLat = Number(farmLat)
  const fLon = Number(farmLon)
  if (isNaN(uLat) || isNaN(uLon) || isNaN(fLat) || isNaN(fLon)) return null

  // 1 degree latitude = ~111,320 meters
  const y = (uLat - fLat) * 111320
  // 1 degree longitude = ~111,320 * cos(latitude) meters
  const x = (uLon - fLon) * 111320 * Math.cos((fLat * Math.PI) / 180)
  return { x, y }
}
