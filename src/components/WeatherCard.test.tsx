// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { WeatherCard } from './WeatherCard'
import type { GeolocationState } from '../hooks/useGeolocation'
import type { WeatherData, WeatherState } from '../hooks/useWeather'

const weatherData: WeatherData = {
  coordinates: {
    latitude: 40.7128,
    longitude: -74.006,
  },
  temperatureCelsius: 21.4,
  feelsLikeCelsius: 20.8,
  weatherCode: 2,
  condition: {
    code: 2,
    label: 'Partly cloudy',
  },
  fetchedAt: '2026-05-27T12:00:00.000Z',
}

const idleGeolocation: GeolocationState = {
  coordinates: null,
  error: null,
  isLoading: false,
  isSupported: true,
}

function renderWeatherCard(
  weather: WeatherState,
  geolocation = idleGeolocation,
) {
  return render(
    <WeatherCard
      weather={weather}
      geolocation={geolocation}
      onCitySelect={vi.fn()}
    />,
  )
}

describe('WeatherCard', () => {
  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('renders weather data with condition and feels-like temperature', () => {
    renderWeatherCard({
      data: weatherData,
      error: null,
      isLoading: false,
    })

    expect(screen.getByRole('region', { name: 'Weather' })).toBeTruthy()
    expect(screen.getByText('Current weather')).toBeTruthy()
    expect(screen.getAllByText(/21°C/)).toHaveLength(2)
    expect(screen.getByText('Partly cloudy')).toBeTruthy()
    expect(screen.getByText(/Feels like 21°C/)).toBeTruthy()
  })

  it('renders an updating label when refreshing cached weather data', () => {
    renderWeatherCard({
      data: weatherData,
      error: null,
      isLoading: true,
    })

    expect(screen.getByText('Updating')).toBeTruthy()
    expect(screen.getByText('Partly cloudy')).toBeTruthy()
  })

  it('renders a loading skeleton while resolving location or weather', () => {
    const { container } = renderWeatherCard(
      {
        data: null,
        error: null,
        isLoading: false,
      },
      {
        coordinates: null,
        error: null,
        isLoading: true,
        isSupported: true,
      },
    )

    expect(container.querySelector('.animate-pulse')).toBeTruthy()
    expect(screen.queryByRole('searchbox')).toBeNull()
  })

  it('renders an error message and city fallback search', () => {
    renderWeatherCard({
      data: null,
      error: {
        code: 'network',
        message: 'Unable to fetch current weather.',
      },
      isLoading: false,
    })

    expect(screen.getByRole('alert').textContent).toBe(
      'Unable to fetch current weather.',
    )
    expect(screen.getByRole('searchbox', { name: 'City' })).toBeTruthy()
  })

  it('renders geolocation denied fallback when weather has no data', () => {
    renderWeatherCard(
      {
        data: null,
        error: null,
        isLoading: false,
      },
      {
        coordinates: null,
        error: {
          code: 'permission-denied',
          message: 'Location permission was denied.',
        },
        isLoading: false,
        isSupported: true,
      },
    )

    expect(screen.getByRole('alert').textContent).toBe(
      'Location permission was denied.',
    )
    expect(screen.getByRole('searchbox', { name: 'City' })).toBeTruthy()
  })
})
