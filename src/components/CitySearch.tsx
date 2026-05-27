import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import {
  isCitySearchResult,
  readStoredSelectedCity,
  writeStoredSelectedCity,
  type CitySearchResult,
} from './citySearchStorage'

export interface CitySearchProps {
  onCitySelect: (city: CitySearchResult) => void
  className?: string
}

interface GeocodingApiResult {
  id?: unknown
  name?: unknown
  latitude?: unknown
  longitude?: unknown
  country?: unknown
  admin1?: unknown
  timezone?: unknown
}

interface GeocodingApiResponse {
  results?: unknown
}

const GEOCODING_API_URL = 'https://geocoding-api.open-meteo.com/v1/search'
const MAX_CITY_RESULTS = 5

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function normalizeNullableString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : null
}

function mapGeocodingResult(
  result: GeocodingApiResult,
): CitySearchResult | null {
  if (
    !isFiniteNumber(result.id) ||
    typeof result.name !== 'string' ||
    result.name.trim().length === 0 ||
    typeof result.country !== 'string' ||
    result.country.trim().length === 0 ||
    !isFiniteNumber(result.latitude) ||
    !isFiniteNumber(result.longitude)
  ) {
    return null
  }

  const city: CitySearchResult = {
    id: result.id,
    name: result.name.trim(),
    country: result.country.trim(),
    admin1: normalizeNullableString(result.admin1),
    timezone: normalizeNullableString(result.timezone),
    latitude: result.latitude,
    longitude: result.longitude,
  }

  return isCitySearchResult(city) ? city : null
}

function parseGeocodingResponse(
  response: GeocodingApiResponse,
): CitySearchResult[] {
  if (!Array.isArray(response.results)) {
    return []
  }

  return response.results
    .map((result) => mapGeocodingResult(result as GeocodingApiResult))
    .filter((result): result is CitySearchResult => result !== null)
}

function createGeocodingUrl(query: string): string {
  const url = new URL(GEOCODING_API_URL)
  url.searchParams.set('name', query)
  url.searchParams.set('count', MAX_CITY_RESULTS.toString())
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  return url.toString()
}

function formatCityLabel(city: CitySearchResult): string {
  return [city.name, city.admin1, city.country].filter(Boolean).join(', ')
}

export function CitySearch({ onCitySelect, className }: CitySearchProps) {
  const inputId = useId()
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)
  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(
    readStoredSelectedCity,
  )
  const [query, setQuery] = useState(() => readStoredSelectedCity()?.name ?? '')
  const [results, setResults] = useState<CitySearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    return () => {
      isMountedRef.current = false
      abortControllerRef.current?.abort()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const trimmedQuery = query.trim()
    if (trimmedQuery.length === 0) {
      setResults([])
      setError('Enter a city name to search.')
      return
    }

    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    setIsLoading(true)
    setError(null)
    setResults([])

    try {
      const response = await fetch(createGeocodingUrl(trimmedQuery), {
        signal: abortController.signal,
      })

      if (!response.ok) {
        setError(`City search failed with status ${response.status}.`)
        return
      }

      const responseBody = (await response.json()) as unknown
      const parsedResults = parseGeocodingResponse(
        responseBody as GeocodingApiResponse,
      )

      if (parsedResults.length === 0) {
        setError('No matching cities found.')
        return
      }

      if (isMountedRef.current) {
        setResults(parsedResults)
      }
    } catch (fetchError) {
      if (
        fetchError instanceof DOMException &&
        fetchError.name === 'AbortError'
      ) {
        return
      }

      if (isMountedRef.current) {
        setError('Unable to search for cities.')
      }
    } finally {
      if (
        isMountedRef.current &&
        abortControllerRef.current === abortController
      ) {
        setIsLoading(false)
        abortControllerRef.current = null
      }
    }
  }

  function handleCitySelect(city: CitySearchResult): void {
    writeStoredSelectedCity(city)
    setSelectedCity(city)
    setQuery(city.name)
    setResults([])
    setError(null)
    onCitySelect(city)
  }

  const rootClassName = className
    ? `w-full max-w-md ${className}`
    : 'w-full max-w-md'

  return (
    <section className={rootClassName} aria-label="City search">
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label
          className="text-sm font-semibold text-slate-700 dark:text-slate-200"
          htmlFor={inputId}
        >
          City
        </label>
        <div className="flex gap-2">
          <input
            id={inputId}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            placeholder="Search for a city"
            autoComplete="off"
            className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 shadow-sm outline-none transition-colors placeholder:text-slate-400 focus:border-slate-950 focus:ring-2 focus:ring-slate-950/10 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:border-white dark:focus:ring-white/15"
          />
          <button
            type="submit"
            disabled={isLoading}
            className="rounded-md bg-slate-950 px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 dark:bg-white dark:text-slate-950 dark:hover:bg-slate-200 dark:disabled:bg-slate-600 dark:disabled:text-slate-300"
          >
            {isLoading ? 'Searching' : 'Search'}
          </button>
        </div>
      </form>

      {selectedCity !== null && (
        <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
          Selected: {formatCityLabel(selectedCity)}
        </p>
      )}

      {error !== null && (
        <p
          className="mt-3 text-sm font-medium text-red-700 dark:text-red-300"
          role="alert"
        >
          {error}
        </p>
      )}

      {results.length > 0 && (
        <ul
          className="mt-3 max-h-60 overflow-y-auto rounded-md border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-950"
          aria-label="City results"
        >
          {results.map((city) => (
            <li
              key={city.id}
              className="border-b border-slate-100 last:border-b-0 dark:border-slate-800"
            >
              <button
                type="button"
                className="flex w-full flex-col items-start gap-1 px-3 py-2 text-left transition-colors hover:bg-slate-100 focus:bg-slate-100 focus:outline-none dark:hover:bg-slate-900 dark:focus:bg-slate-900"
                onClick={() => {
                  handleCitySelect(city)
                }}
              >
                <span className="text-sm font-semibold text-slate-950 dark:text-white">
                  {formatCityLabel(city)}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {city.latitude.toFixed(4)}, {city.longitude.toFixed(4)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
