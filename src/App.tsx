import { useState } from 'react'
import { BackgroundUpload } from './components/BackgroundUpload'
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
import { useBackgroundImage } from './hooks/useBackgroundImage'
import { useWeather } from './hooks/useWeather'

function App() {
  const currentTime = useCurrentTime()
  const [format, setFormat] = useFormatPref()
  const geolocation = useGeolocation()
  const backgroundImage = useBackgroundImage()
  const [selectedCity, setSelectedCity] = useState<CitySearchResult | null>(
    readStoredSelectedCity,
  )
  const weatherCoordinates = selectedCity ?? geolocation.coordinates
  const weather = useWeather(weatherCoordinates)
  const pageBackgroundStyle =
    backgroundImage.backgroundUrl === null
      ? undefined
      : { backgroundImage: `url(${backgroundImage.backgroundUrl})` }

  return (
    <main
      className="relative min-h-svh overflow-hidden bg-slate-50 bg-cover bg-center bg-no-repeat px-5 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8"
      style={pageBackgroundStyle}
    >
      {backgroundImage.backgroundUrl !== null && (
        <div
          className="absolute inset-0 bg-slate-50/85 backdrop-blur-[1px] dark:bg-slate-950/80"
          aria-hidden="true"
        />
      )}

      <div className="relative z-10 mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col items-center justify-center gap-10">
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

        <div className="flex w-full flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <FormatToggle format={format} setFormat={setFormat} />
          <BackgroundUpload backgroundImage={backgroundImage} />
        </div>
      </div>
    </main>
  )
}

export default App
