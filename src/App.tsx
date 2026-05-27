import { ClockDisplay } from './components/ClockDisplay'
import { FormatToggle } from './components/FormatToggle'
import { useCurrentTime } from './hooks/useCurrentTime'
import { useFormatPref } from './hooks/useFormatPref'

function App() {
  const currentTime = useCurrentTime()
  const [format, setFormat] = useFormatPref()

  return (
    <main className="min-h-svh bg-slate-50 px-5 py-8 text-slate-950 dark:bg-slate-950 dark:text-white sm:px-8">
      <div className="mx-auto flex min-h-[calc(100svh-4rem)] max-w-3xl flex-col items-center justify-center gap-10">
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="text-sm font-semibold uppercase text-slate-500 dark:text-slate-400">
            Local time
          </p>
          <ClockDisplay currentTime={currentTime} format={format} />
        </div>

        <FormatToggle format={format} setFormat={setFormat} />
      </div>
    </main>
  )
}

export default App
