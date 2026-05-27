import { useId, useRef, useState, type ChangeEvent } from 'react'
import type {
  BackgroundImageErrorState,
  UseBackgroundImageResult,
} from '../hooks/useBackgroundImage'

export interface BackgroundUploadProps {
  backgroundImage: Pick<
    UseBackgroundImageResult,
    'backgroundUrl' | 'isLoading' | 'error' | 'setImage' | 'clearImage'
  >
  className?: string
}

function getStatusMessage(
  error: BackgroundImageErrorState | null,
  actionError: string | null,
  isLoading: boolean,
  hasBackgroundImage: boolean,
): string {
  if (actionError !== null) {
    return actionError
  }

  if (error !== null) {
    return error.message
  }

  if (isLoading) {
    return 'Updating background image.'
  }

  if (hasBackgroundImage) {
    return 'Custom background active.'
  }

  return 'Default background active.'
}

export function BackgroundUpload({
  backgroundImage,
  className,
}: BackgroundUploadProps) {
  const inputId = useId()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  const { backgroundUrl, clearImage, error, isLoading, setImage } =
    backgroundImage
  const hasBackgroundImage = backgroundUrl !== null
  const statusMessage = getStatusMessage(
    error,
    actionError,
    isLoading,
    hasBackgroundImage,
  )
  const rootClassName = className
    ? `inline-flex flex-col items-end gap-2 ${className}`
    : 'inline-flex flex-col items-end gap-2'

  function openFilePicker(): void {
    fileInputRef.current?.click()
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ): Promise<void> {
    const selectedFile = event.target.files?.[0] ?? null
    event.target.value = ''

    if (selectedFile === null) {
      return
    }

    setActionError(null)

    try {
      await setImage(selectedFile)
    } catch {
      setActionError('Unable to apply the selected background image.')
    }
  }

  async function handleClearImage(): Promise<void> {
    setActionError(null)

    try {
      await clearImage()
    } catch {
      setActionError('Unable to reset the background image.')
    }
  }

  return (
    <div className={rootClassName}>
      <input
        ref={fileInputRef}
        id={inputId}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(event) => {
          void handleFileChange(event)
        }}
      />

      <div
        className="inline-flex rounded-lg border border-slate-200 bg-white/90 p-1 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-950/90"
        role="group"
        aria-label="Background image"
      >
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:text-slate-400 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white dark:disabled:text-slate-600"
          disabled={isLoading}
          onClick={openFilePicker}
          aria-controls={inputId}
        >
          Background
        </button>
        <button
          type="button"
          className="rounded-md px-3 py-2 text-sm font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-950 disabled:cursor-not-allowed disabled:text-slate-300 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white dark:focus-visible:outline-white dark:disabled:text-slate-700"
          disabled={isLoading || !hasBackgroundImage}
          onClick={() => {
            void handleClearImage()
          }}
        >
          Reset
        </button>
      </div>

      <p
        className={`max-w-56 text-right text-xs font-medium ${
          error !== null || actionError !== null
            ? 'text-red-700 dark:text-red-300'
            : 'text-slate-500 dark:text-slate-400'
        }`}
        role={error !== null || actionError !== null ? 'alert' : 'status'}
      >
        {statusMessage}
      </p>
    </div>
  )
}
