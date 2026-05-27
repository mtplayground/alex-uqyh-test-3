import { useState } from 'react'
import { ClockDisplay } from './components/ClockDisplay'
import { FormatToggle } from './components/FormatToggle'
import { WeatherCard } from './components/WeatherCard'
import {
  readStoredSelectedCity,
  type CitySearchResult,
} from './components/citySearchStorage'
import { useCurrentTime } from './hooks/useCurrentTime'
import { useFormatPref } from './hooks/useFormatPref'
import { useGeolocation } from './hooks/useGeolocation'
import { useWeather } from './hooks/useWeather'

function App() {
  const currentTime = useCurrentTime()
  const [format, setFormat] = useFormatPref()
  const geolocation = useGeolocation()
  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(
    readStoredSelectedCity,
  )
  const weatherCoordinates = selectedCity ?? geolocation.coordinates
  const weather = useWeather(weatherCoordinates)

  return (
    <main className="min-h-svh bg-slate-50 px-5 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
            Local time
          </p>
          <ClockDisplay currentTime={currentTime} format={format} />
        </div>

        <WeatherCard
          weather={weather}
          geolocation={geolocation}
          onCitySelect={setSelectedCity}
        />

        <FormatToggle format={format} setFormat={setFormat} />
      </div>
    </main>
  )
}

export default App
