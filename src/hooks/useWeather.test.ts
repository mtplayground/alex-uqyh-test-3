// @vitest-environment jsdom

import { cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  WEATHER_CACHE_KEY,
  useWeather,
  type WeatherCoordinates,
  type WeatherData,
} from './useWeather'

const coordinates: WeatherCoordinates = {
  latitude: 40.7128,
  longitude: -74.006,
}

const originalFetch = globalThis.fetch

function createWeatherResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

function setFetchMock(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>): void {
  globalThis.fetch = fetchMock
}

function createCachedWeather(): WeatherData {
  return {
    coordinates,
    temperatureCelsius: 18.2,
    feelsLikeCelsius: 17.8,
    weatherCode: 1,
    condition: {
      code: 1,
      label: 'Mainly clear',
    },
    fetchedAt: '2026-05-27T12:00:00.000Z',
  }
}

describe('useWeather', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
    vi.restoreAllMocks()
    globalThis.fetch = originalFetch
  })

  it('fetches current weather and caches the successful result', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValueOnce(
      createWeatherResponse({
        current: {
          temperature_2m: 21.4,
          apparent_temperature: 20.8,
          weather_code: 2,
        },
      }),
    )
    setFetchMock(fetchMock)

    const { result } = renderHook(() => useWeather(coordinates))

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.data).not.toBeNull()
    })

    expect(result.current).toMatchObject({
      error: null,
      isLoading: false,
      data: {
        coordinates,
        temperatureCelsius: 21.4,
        feelsLikeCelsius: 20.8,
        weatherCode: 2,
        condition: {
          code: 2,
          label: 'Partly cloudy',
        },
      },
    })

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0]))
    expect(requestUrl.origin + requestUrl.pathname).toBe(
      'https://api.open-meteo.com/v1/forecast',
    )
    expect(requestUrl.searchParams.get('latitude')).toBe('40.7128')
    expect(requestUrl.searchParams.get('longitude')).toBe('-74.006')
    expect(requestUrl.searchParams.get('current')).toBe(
      'temperature_2m,apparent_temperature,weather_code',
    )

    const cachedWeather = JSON.parse(
      window.localStorage.getItem(WEATHER_CACHE_KEY) ?? 'null',
    ) as WeatherData | null
    expect(cachedWeather).toMatchObject({
      coordinates,
      temperatureCelsius: 21.4,
      feelsLikeCelsius: 20.8,
      weatherCode: 2,
    })
  })

  it('returns a network error when the weather request fails', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createWeatherResponse({}, 500))
    setFetchMock(fetchMock)

    const { result } = renderHook(() => useWeather(coordinates))

    await waitFor(() => {
      expect(result.current.error?.code).toBe('network')
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error?.message).toBe(
      'Weather request failed with status 500.',
    )
    expect(result.current.isLoading).toBe(false)
  })

  it('returns an invalid response error when current weather is missing', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(createWeatherResponse({ current: {} }))
    setFetchMock(fetchMock)

    const { result } = renderHook(() => useWeather(coordinates))

    await waitFor(() => {
      expect(result.current.error?.code).toBe('invalid-response')
    })

    expect(result.current.data).toBeNull()
    expect(result.current.error?.message).toBe(
      'Weather response did not include current conditions.',
    )
    expect(result.current.isLoading).toBe(false)
  })

  it('uses a matching cached result without fetching again', async () => {
    const cachedWeather = createCachedWeather()
    window.localStorage.setItem(
      WEATHER_CACHE_KEY,
      JSON.stringify(cachedWeather),
    )
    const fetchMock = vi.fn<typeof fetch>()
    setFetchMock(fetchMock)

    const { result } = renderHook(() => useWeather(coordinates))

    await waitFor(() => {
      expect(result.current.data).toEqual(cachedWeather)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
