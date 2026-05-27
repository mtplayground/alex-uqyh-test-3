import { useCallback, useEffect, useReducer, useRef } from 'react'

export type BackgroundImageErrorCode =
  | 'indexeddb-unavailable'
  | 'read-failed'
  | 'write-failed'
  | 'clear-failed'
  | 'invalid-file'

export interface BackgroundImageErrorState {
  code: BackgroundImageErrorCode
  message: string
}

export interface BackgroundImageState {
  backgroundUrl: string | null
  error: BackgroundImageErrorState | null
  isLoading: boolean
}

export interface UseBackgroundImageResult extends BackgroundImageState {
  setImage: (file: File) => Promise<void>
  clearImage: () => Promise<void>
}

type BackgroundImageAction =
  | { type: 'loading' }
  | { type: 'success'; backgroundUrl: string | null }
  | { type: 'error'; error: BackgroundImageErrorState }

const DB_NAME = 'alex-uqyh-background'
const DB_VERSION = 1
const STORE_NAME = 'images'
const BACKGROUND_IMAGE_KEY = 'background'

const INDEXED_DB_UNAVAILABLE_ERROR: BackgroundImageErrorState = {
  code: 'indexeddb-unavailable',
  message: 'Background images cannot be saved in this browser.',
}

function canUseIndexedDb(): boolean {
  return typeof indexedDB !== 'undefined'
}

function createInitialState(): BackgroundImageState {
  if (!canUseIndexedDb()) {
    return {
      backgroundUrl: null,
      error: INDEXED_DB_UNAVAILABLE_ERROR,
      isLoading: false,
    }
  }

  return {
    backgroundUrl: null,
    error: null,
    isLoading: true,
  }
}

function backgroundImageReducer(
  state: BackgroundImageState,
  action: BackgroundImageAction,
): BackgroundImageState {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        error: null,
        isLoading: true,
      }
    case 'success':
      return {
        backgroundUrl: action.backgroundUrl,
        error: null,
        isLoading: false,
      }
    case 'error':
      return {
        ...state,
        error: action.error,
        isLoading: false,
      }
  }
}

function requestToPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => {
      resolve(request.result)
    }
    request.onerror = () => {
      reject(request.error ?? new Error('IndexedDB request failed.'))
    }
  })
}

function openBackgroundImageDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(
        request.error ?? new Error('Unable to open background image database.'),
      )
    }
  })
}

async function withBackgroundImageStore<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openBackgroundImageDatabase()

  try {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    return await requestToPromise(operation(store))
  } finally {
    database.close()
  }
}

async function readStoredImage(): Promise<Blob | null> {
  const storedImage = await withBackgroundImageStore('readonly', (store) =>
    store.get(BACKGROUND_IMAGE_KEY),
  )

  return storedImage instanceof Blob ? storedImage : null
}

async function writeStoredImage(file: File): Promise<void> {
  await withBackgroundImageStore('readwrite', (store) =>
    store.put(file, BACKGROUND_IMAGE_KEY),
  )
}

async function deleteStoredImage(): Promise<void> {
  await withBackgroundImageStore('readwrite', (store) =>
    store.delete(BACKGROUND_IMAGE_KEY),
  )
}

function createObjectUrl(blob: Blob): string {
  return URL.createObjectURL(blob)
}

function isValidImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

export function useBackgroundImage(): UseBackgroundImageResult {
  const [state, dispatch] = useReducer(
    backgroundImageReducer,
    undefined,
    createInitialState,
  )
  const activeObjectUrlRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  const updateBackgroundUrl = useCallback(
    (nextBackgroundUrl: string | null) => {
      if (activeObjectUrlRef.current !== null) {
        URL.revokeObjectURL(activeObjectUrlRef.current)
      }

      activeObjectUrlRef.current = nextBackgroundUrl

      if (isMountedRef.current) {
        dispatch({ type: 'success', backgroundUrl: nextBackgroundUrl })
      }
    },
    [],
  )

  useEffect(() => {
    isMountedRef.current = true

    if (!canUseIndexedDb()) {
      return
    }

    async function loadStoredImage(): Promise<void> {
      try {
        const storedImage = await readStoredImage()
        const storedImageUrl =
          storedImage === null ? null : createObjectUrl(storedImage)
        updateBackgroundUrl(storedImageUrl)
      } catch {
        if (isMountedRef.current) {
          dispatch({
            type: 'error',
            error: {
              code: 'read-failed',
              message: 'Unable to load the saved background image.',
            },
          })
        }
      }
    }

    void loadStoredImage()

    return () => {
      isMountedRef.current = false

      if (activeObjectUrlRef.current !== null) {
        URL.revokeObjectURL(activeObjectUrlRef.current)
        activeObjectUrlRef.current = null
      }
    }
  }, [updateBackgroundUrl])

  const setImage = useCallback(
    async (file: File): Promise<void> => {
      if (!isValidImageFile(file)) {
        dispatch({
          type: 'error',
          error: {
            code: 'invalid-file',
            message: 'Choose a valid image file for the background.',
          },
        })
        return
      }

      if (!canUseIndexedDb()) {
        dispatch({ type: 'error', error: INDEXED_DB_UNAVAILABLE_ERROR })
        return
      }

      dispatch({ type: 'loading' })

      try {
        await writeStoredImage(file)
        updateBackgroundUrl(createObjectUrl(file))
      } catch {
        if (isMountedRef.current) {
          dispatch({
            type: 'error',
            error: {
              code: 'write-failed',
              message: 'Unable to save the selected background image.',
            },
          })
        }
      }
    },
    [updateBackgroundUrl],
  )

  const clearImage = useCallback(async (): Promise<void> => {
    if (!canUseIndexedDb()) {
      dispatch({ type: 'error', error: INDEXED_DB_UNAVAILABLE_ERROR })
      return
    }

    dispatch({ type: 'loading' })

    try {
      await deleteStoredImage()
      updateBackgroundUrl(null)
    } catch {
      if (isMountedRef.current) {
        dispatch({
          type: 'error',
          error: {
            code: 'clear-failed',
            message: 'Unable to remove the saved background image.',
          },
        })
      }
    }
  }, [updateBackgroundUrl])

  return {
    ...state,
    setImage,
    clearImage,
  }
}
