import type { WeatherCoordinates } from '../hooks/useWeather'

export interface CitySearchResult extends WeatherCoordinates {
  id: number
  name: string
  country: string
  admin1: string | null
  timezone: string | null
}

const SELECTED_CITY_STORAGE_KEY = 'weather:selected-city'

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

export function isCitySearchResult(value: unknown): value is CitySearchResult {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as CitySearchResult
  return (
    isFiniteNumber(candidate.id) &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.country === 'string' &&
    candidate.country.trim().length > 0 &&
    isFiniteNumber(candidate.latitude) &&
    candidate.latitude >= -90 &&
    candidate.latitude <= 90 &&
    isFiniteNumber(candidate.longitude) &&
    candidate.longitude >= -180 &&
    candidate.longitude <= 180 &&
    (candidate.admin1 === null || typeof candidate.admin1 === 'string') &&
    (candidate.timezone === null || typeof candidate.timezone === 'string')
  )
}

export function readStoredSelectedCity(): CitySearchResult | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedCity = window.localStorage.getItem(SELECTED_CITY_STORAGE_KEY)
    if (storedCity === null) {
      return null
    }

    const parsedCity: unknown = JSON.parse(storedCity)
    return isCitySearchResult(parsedCity) ? parsedCity : null
  } catch {
    return null
  }
}

export function writeStoredSelectedCity(city: CitySearchResult): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(SELECTED_CITY_STORAGE_KEY, JSON.stringify(city))
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}
