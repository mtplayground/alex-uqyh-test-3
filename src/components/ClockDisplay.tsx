import { useMemo } from 'react'
import type { TimeFormat } from '../hooks/useFormatPref'

export interface ClockDisplayProps {
  currentTime: Date
  format: TimeFormat
}

export function ClockDisplay({ currentTime, format }: ClockDisplayProps) {
  const formattedTime = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: format === '12h',
      }).format(currentTime),
    [currentTime, format],
  )

  const formattedDate = useMemo(
    () =>
      new Intl.DateTimeFormat(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(currentTime),
    [currentTime],
  )

  return (
    <section
      className="flex flex-col items-center gap-4 text-center"
      aria-label="Current time"
    >
      <time
        className="font-mono text-5xl font-semibold tabular-nums tracking-normal text-slate-950 sm:text-7xl dark:text-white"
        dateTime={currentTime.toISOString()}
        aria-live="polite"
      >
        {formattedTime}
      </time>
      <p className="text-base font-medium tracking-normal text-slate-600 sm:text-lg dark:text-slate-300">
        {formattedDate}
      </p>
    </section>
  )
}
