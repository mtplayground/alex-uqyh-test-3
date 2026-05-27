import { type Dispatch, type SetStateAction, useEffect, useState } from 'react'

export type TimeFormat = '12h' | '24h'

export const FORMAT_PREF_STORAGE_KEY = 'clock-format-preference'

const DEFAULT_FORMAT: TimeFormat = '24h'

function isTimeFormat(value: string | null): value is TimeFormat {
  return value === '12h' || value === '24h'
}

function readStoredFormat(): TimeFormat {
  if (typeof window === 'undefined') {
    return DEFAULT_FORMAT
  }

  try {
    const storedFormat = window.localStorage.getItem(FORMAT_PREF_STORAGE_KEY)
    return isTimeFormat(storedFormat) ? storedFormat : DEFAULT_FORMAT
  } catch {
    return DEFAULT_FORMAT
  }
}

function writeStoredFormat(format: TimeFormat): void {
  if (typeof window === 'undefined') {
    return
  }

  try {
    window.localStorage.setItem(FORMAT_PREF_STORAGE_KEY, format)
  } catch {
    // Storage can be unavailable in private browsing or restricted contexts.
  }
}

export function useFormatPref(): readonly [
  TimeFormat,
  Dispatch<SetStateAction<TimeFormat>>,
] {
  const [format, setFormat] = useState<TimeFormat>(readStoredFormat)

  useEffect(() => {
    writeStoredFormat(format)
  }, [format])

  return [format, setFormat] as const
}
