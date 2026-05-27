import { CitySearch, type CitySearchResult } from './CitySearch'
import type { GeolocationState } from '../hooks/useGeolocation'
import type { WeatherData, WeatherState } from '../hooks/useWeather'

export interface WeatherCardProps {
  weather: WeatherState
  onCitySelect: (city: CitySearchResult) => void
  geolocation?: GeolocationState
  className?: string
}

function formatTemperature(value: number): number {
  return Math.round(value)
}

function getWeatherIcon(weatherCode: number): string {
  if (weatherCode === 0 || weatherCode === 1) {
    return '☀️'
  }

  if (weatherCode === 2 || weatherCode === 3) {
    return '☁️'
  }

  if (weatherCode === 45 || weatherCode === 48) {
    return '🌫️'
  }

  if (
    (weatherCode >= 51 && weatherCode <= 67) ||
    (weatherCode >= 80 && weatherCode <= 82)
  ) {
    return '🌧️'
  }

  if (
    (weatherCode >= 71 && weatherCode <= 77) ||
    weatherCode === 85 ||
    weatherCode === 86
  ) {
    return '❄️'
  }

  if (weatherCode >= 95 && weatherCode <= 99) {
    return '⛈️'
  }

  return '•'
}

function getFallbackMessage(
  weather: WeatherState,
  geolocation: GeolocationState | undefined,
): string | null {
  if (weather.error !== null) {
    return weather.error.message
  }

  if (geolocation?.error !== null && geolocation?.error !== undefined) {
    return geolocation.error.message
  }

  if (geolocation?.isSupported === false) {
    return 'Browser location is unavailable. Search for a city instead.'
  }

  return null
}

function WeatherSkeleton() {
  return (
    <div className="flex animate-pulse flex-col gap-5" aria-hidden="true">
      <div className="h-4 w-24 rounded bg-slate-200 dark:bg-slate-800" />
      <div className="flex items-center justify-between gap-6">
        <div className="h-16 w-32 rounded bg-slate-200 dark:bg-slate-800" />
        <div className="h-14 w-14 rounded-full bg-slate-200 dark:bg-slate-800" />
      </div>
      <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
    </div>
  )
}

function WeatherSummary({ weatherData }: { weatherData: WeatherData }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-sm font-semibold uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Current weather
          </p>
          <p className="mt-2 font-mono text-5xl font-semibold tabular-nums tracking-normal text-slate-950 dark:text-white">
            {formatTemperature(weatherData.temperatureCelsius)}
            &deg;C
          </p>
        </div>
        <span
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-slate-100 text-3xl shadow-inner dark:bg-slate-900"
          aria-hidden="true"
        >
          {getWeatherIcon(weatherData.weatherCode)}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-lg font-semibold text-slate-900 dark:text-white">
          {weatherData.condition.label}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Feels like {formatTemperature(weatherData.feelsLikeCelsius)}
          &deg;C
        </p>
      </div>
    </div>
  )
}

export function WeatherCard({
  weather,
  geolocation,
  onCitySelect,
  className,
}: WeatherCardProps) {
  const fallbackMessage = getFallbackMessage(weather, geolocation)
  const showSkeleton = weather.isLoading && weather.data === null
  const showFallback =
    !weather.isLoading && (fallbackMessage !== null || weather.data === null)
  const rootClassName = className
    ? `w-full max-w-md ${className}`
    : 'w-full max-w-md'

  return (
    <section
      className={`${rootClassName} rounded-lg border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-950`}
      aria-label="Weather"
    >
      {showSkeleton ? (
        <WeatherSkeleton />
      ) : weather.data !== null ? (
        <WeatherSummary weatherData={weather.data} />
      ) : (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-semibold uppercase tracking-normal text-slate-500 dark:text-slate-400">
            Current weather
          </p>
          <p className="text-base font-medium text-slate-700 dark:text-slate-200">
            Choose a city to show current conditions.
          </p>
        </div>
      )}

      {weather.isLoading && weather.data !== null && (
        <p className="mt-4 text-xs font-medium uppercase tracking-normal text-slate-500 dark:text-slate-400">
          Updating
        </p>
      )}

      {fallbackMessage !== null && (
        <p
          className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 dark:border-red-900/80 dark:bg-red-950/40 dark:text-red-200"
          role="alert"
        >
          {fallbackMessage}
        </p>
      )}

      {showFallback && (
        <div className="mt-5 border-t border-slate-200 pt-5 dark:border-slate-800">
          <CitySearch onCitySelect={onCitySelect} />
        </div>
      )}
    </section>
  )
}
