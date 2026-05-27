import type { Dispatch, SetStateAction } from 'react'
import type { TimeFormat } from '../hooks/useFormatPref'

export interface FormatToggleProps {
  format: TimeFormat
  setFormat: Dispatch<SetStateAction<TimeFormat>>
}

const formatOptions: TimeFormat[] = ['12h', '24h']

function getButtonClass(isActive: boolean): string {
  const baseClass =
    'min-w-16 rounded-md px-4 py-2 text-sm font-semibold tracking-normal transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 dark:focus-visible:outline-white'

  if (isActive) {
    return `${baseClass} bg-slate-950 text-white shadow-sm dark:bg-white dark:text-slate-950`
  }

  return `${baseClass} text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white`
}

export function FormatToggle({ format, setFormat }: FormatToggleProps) {
  return (
    <div
      className="inline-flex rounded-lg border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-950"
      role="group"
      aria-label="Time format"
    >
      {formatOptions.map((option) => (
        <button
          key={option}
          type="button"
          className={getButtonClass(option === format)}
          aria-pressed={option === format}
          onClick={() => setFormat(option)}
        >
          {option}
        </button>
      ))}
    </div>
  )
}
