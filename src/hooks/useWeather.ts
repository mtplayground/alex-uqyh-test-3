import { useEffect, useReducer } from 'react'

export interface WeatherCoordinates {
  latitude: number
  longitude: number
}

export interface WeatherCondition {
  code: number
  label: string
}

export interface WeatherData {
  coordinates: WeatherCoordinates
  temperatureCelsius: number
  feelsLikeCelsius: number
  weatherCode: number
  condition: WeatherCondition
  fetchedAt: string
}

export type WeatherErrorCode =
  | 'missing-coordinates'
  | 'invalid-coordinates'
  | 'network'
  | 'invalid-response'

export interface WeatherErrorState {
  code: WeatherErrorCode
  message: string
}

export interface WeatherState {
  data: WeatherData | null
  error: WeatherErrorState | null
  isLoading: boolean
}

type WeatherAction =
  | { type: 'idle' }
  | { type: 'loading'; cachedData: WeatherData | null }
  | { type: 'success'; data: WeatherData }
  | { type: 'error'; error: WeatherErrorState }

interface OpenMeteoCurrentWeather {
  temperature_2m?: unknown
  apparent_temperature?: unknown
  weather_code?: unknown
}

interface OpenMeteoForecastResponse {
  current?: OpenMeteoCurrentWeather
}

export const WEATHER_CACHE_KEY = 'weather:last-result'

const OPEN_METEO_FORECAST_URL = 'https://api.open-meteo.com/v1/forecast'
const COORDINATE_MATCH_TOLERANCE = 0.0001

const WEATHER_CODE_LABELS = new Map<number, string>([
  [0, 'Clear sky'],
  [1, 'Mainly clear'],
  [2, 'Partly cloudy'],
  [3, 'Overcast'],
  [45, 'Fog'],
  [48, 'Depositing rime fog'],
  [51, 'Light drizzle'],
  [53, 'Moderate drizzle'],
  [55, 'Dense drizzle'],
  [56, 'Light freezing drizzle'],
  [57, 'Dense freezing drizzle'],
  [61, 'Slight rain'],
  [63, 'Moderate rain'],
  [65, 'Heavy rain'],
  [66, 'Light freezing rain'],
  [67, 'Heavy freezing rain'],
  [71, 'Slight snow fall'],
  [73, 'Moderate snow fall'],
  [75, 'Heavy snow fall'],
  [77, 'Snow grains'],
  [80, 'Slight rain showers'],
  [81, 'Moderate rain showers'],
  [82, 'Violent rain showers'],
  [85, 'Slight snow showers'],
  [86, 'Heavy snow showers'],
  [95, 'Thunderstorm'],
  [96, 'Thunderstorm with slight hail'],
  [99, 'Thunderstorm with heavy hail'],
])

const IDLE_STATE: WeatherState = {
  data: null,
  error: null,
  isLoading: false,
}

function weatherReducer(
  state: WeatherState,
  action: WeatherAction,
): WeatherState {
  switch (action.type) {
    case 'idle':
      return IDLE_STATE
    case 'loading':
      return {
        data: action.cachedData,
        error: null,
        isLoading: true,
      }
    case 'success':
      return {
        data: action.data,
        error: null,
        isLoading: false,
      }
    case 'error':
      return {
        data: state.data,
        error: action.error,
        isLoading: false,
      }
  }
}

function getWeatherCondition(weatherCode: number): WeatherCondition {
  return {
    code: weatherCode,
    label: WEATHER_CODE_LABELS.get(weatherCode) ?? 'Unknown conditions',
  }
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

function areValidCoordinates(
  coordinates: WeatherCoordinates | null,
): coordinates is WeatherCoordinates {
  return (
    coordinates !== null &&
    isFiniteNumber(coordinates.latitude) &&
    isFiniteNumber(coordinates.longitude) &&
    coordinates.latitude >= -90 &&
    coordinates.latitude <= 90 &&
    coordinates.longitude >= -180 &&
    coordinates.longitude <= 180
  )
}

function coordinatesMatch(
  first: WeatherCoordinates,
  second: WeatherCoordinates,
): boolean {
  return (
    Math.abs(first.latitude - second.latitude) <= COORDINATE_MATCH_TOLERANCE &&
    Math.abs(first.longitude - second.longitude) <= COORDINATE_MATCH_TOLERANCE
  )
}

function isWeatherData(value: unknown): value is WeatherData {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const candidate = value as WeatherData
  return (
    areValidCoordinates(candidate.coordinates) &&
    isFiniteNumber(candidate.temperatureCelsius) &&
    isFiniteNumber(candidate.feelsLikeCelsius) &&
    isFiniteNumber(candidate.weatherCode) &&
    typeof candidate.fetchedAt === 'string' &&
    typeof candidate.condition?.label === 'string' &&
    candidate.condition.code === candidate.weatherCode
  )
}

function readCachedWeather(
  coordinates: WeatherCoordinates,
): WeatherData | null {
  if (typeof window === 'undefined') {
    return null
  }

  try {
    const storedWeather = window.localStorage.getItem(WEATHER_CACHE_KEY)
    if (storedWeather === null) {
      return null
    }

    const parsedWeather: unknown = JSON.parse(storedWeather)
    if (
      isWeatherData(parsedWeather) &&
      coordinatesMatch(parsedWeather.coordinates, coordinates)
    ) {
      return parsedWeather
    }
  } catch {
    return null
  }

  return null
}

function writeCachedWeather(weatherData: WeatherData): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(WEATHER_CACHE_KEY, JSON.stringify(weatherData))
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

function createForecastUrl(coordinates: WeatherCoordinates): string {
  const url = new URL(OPEN_METEO_FORECAST_URL)
  url.searchParams.set('latitude', coordinates.latitude.toString())
  url.searchParams.set('longitude', coordinates.longitude.toString())
  url.searchParams.set(
    'current',
    'temperature_2m,apparent_temperature,weather_code',
  )

  return url.toString()
}

function parseWeatherData(
  response: OpenMeteoForecastResponse,
  coordinates: WeatherCoordinates,
): WeatherData | null {
  const currentWeather = response.current
  if (currentWeather === undefined) {
    return null
  }

  const {
    temperature_2m: temperatureCelsius,
    apparent_temperature: feelsLikeCelsius,
    weather_code: weatherCode,
  } = currentWeather

  if (
    !isFiniteNumber(temperatureCelsius) ||
    !isFiniteNumber(feelsLikeCelsius) ||
    !isFiniteNumber(weatherCode)
  ) {
    return null
  }

  return {
    coordinates,
    temperatureCelsius,
    feelsLikeCelsius,
    weatherCode,
    condition: getWeatherCondition(weatherCode),
    fetchedAt: new Date().toISOString(),
  }
}

function createInitialState(
  coordinates: WeatherCoordinates | null,
): WeatherState {
  if (coordinates === null) {
    return IDLE_STATE
  }

  if (!areValidCoordinates(coordinates)) {
    return {
      data: null,
      error: {
        code: 'invalid-coordinates',
        message: 'Latitude and longitude must be valid coordinates.',
      },
      isLoading: false,
    }
  }

  const cachedData = readCachedWeather(coordinates)
  if (cachedData !== null) {
    return {
      data: cachedData,
      error: null,
      isLoading: false,
    }
  }

  return {
    data: null,
    error: null,
    isLoading: true,
  }
}

export function useWeather(
  coordinates: WeatherCoordinates | null,
): WeatherState {
  const [state, dispatch] = useReducer(
    weatherReducer,
    coordinates,
    createInitialState,
  )

  useEffect(() => {
    if (coordinates === null) {
      dispatch({ type: 'idle' })
      return
    }

    if (!areValidCoordinates(coordinates)) {
      dispatch({
        type: 'error',
        error: {
          code: 'invalid-coordinates',
          message: 'Latitude and longitude must be valid coordinates.',
        },
      })
      return
    }

    const requestCoordinates = coordinates
    const cachedData = readCachedWeather(requestCoordinates)
    if (cachedData !== null) {
      dispatch({ type: 'success', data: cachedData })
      return
    }

    const abortController = new AbortController()
    dispatch({ type: 'loading', cachedData: null })

    async function fetchWeather(): Promise<void> {
      try {
        const response = await fetch(createForecastUrl(requestCoordinates), {
          signal: abortController.signal,
        })

        if (!response.ok) {
          dispatch({
            type: 'error',
            error: {
              code: 'network',
              message: `Weather request failed with status ${response.status}.`,
            },
          })
          return
        }

        const responseBody = (await response.json()) as unknown
        const weatherData = parseWeatherData(
          responseBody as OpenMeteoForecastResponse,
          requestCoordinates,
        )

        if (weatherData === null) {
          dispatch({
            type: 'error',
            error: {
              code: 'invalid-response',
              message: 'Weather response did not include current conditions.',
            },
          })
          return
        }

        writeCachedWeather(weatherData)
        dispatch({ type: 'success', data: weatherData })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }

        dispatch({
          type: 'error',
          error: {
            code: 'network',
            message: 'Unable to fetch current weather.',
          },
        })
      }
    }

    void fetchWeather()

    return () => {
      abortController.abort()
    }
  }, [coordinates])

  return state
}
