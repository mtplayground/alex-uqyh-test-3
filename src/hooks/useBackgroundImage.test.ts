// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useBackgroundImage } from './useBackgroundImage'

const BACKGROUND_IMAGE_KEY = 'background'

const originalIndexedDb = globalThis.indexedDB
const originalCreateObjectUrl = URL.createObjectURL
const originalRevokeObjectUrl = URL.revokeObjectURL

class FakeObjectStore {
  private readonly records: Map<string, Blob>

  constructor(records: Map<string, Blob>) {
    this.records = records
  }

  get(key: string): IDBRequest<Blob | undefined> {
    return createSuccessfulRequest(() => this.records.get(key))
  }

  put(value: Blob, key: string): IDBRequest<IDBValidKey> {
    return createSuccessfulRequest(() => {
      this.records.set(key, value)
      return key as IDBValidKey
    })
  }

  delete(key: string): IDBRequest<undefined> {
    return createSuccessfulRequest(() => {
      this.records.delete(key)
      return undefined
    })
  }
}

class FakeTransaction {
  private readonly records: Map<string, Blob>

  constructor(records: Map<string, Blob>) {
    this.records = records
  }

  objectStore(): FakeObjectStore {
    return new FakeObjectStore(this.records)
  }
}

class FakeDatabase {
  readonly objectStoreNames = {
    contains: () => true,
  }

  private readonly records: Map<string, Blob>

  constructor(records: Map<string, Blob>) {
    this.records = records
  }

  createObjectStore(): void {
    return undefined
  }

  transaction(): FakeTransaction {
    return new FakeTransaction(this.records)
  }

  close(): void {
    return undefined
  }
}

function createSuccessfulRequest<T>(resolveResult: () => T): IDBRequest<T> {
  const request = {
    error: null,
    result: undefined as T,
    onsuccess: null,
    onerror: null,
  } as Partial<IDBRequest<T>> as IDBRequest<T>

  queueMicrotask(() => {
    Object.defineProperty(request, 'result', {
      configurable: true,
      value: resolveResult(),
    })
    request.onsuccess?.call(request, new Event('success'))
  })

  return request
}

function installFakeIndexedDb(records: Map<string, Blob>): void {
  const database = new FakeDatabase(records)
  const indexedDb = {
    open: () => {
      const request = {
        error: null,
        result: database,
        onsuccess: null,
        onerror: null,
        onupgradeneeded: null,
      } as unknown as IDBOpenDBRequest

      queueMicrotask(() => {
        request.onupgradeneeded?.call(
          request,
          new Event('upgradeneeded') as IDBVersionChangeEvent,
        )
        request.onsuccess?.call(request, new Event('success'))
      })

      return request
    },
  } as Partial<IDBFactory> as IDBFactory

  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: indexedDb,
  })
}

function removeIndexedDb(): void {
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: undefined,
  })
}

function restoreIndexedDb(): void {
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: originalIndexedDb,
  })
}

describe('useBackgroundImage', () => {
  let records: Map<string, Blob>
  let objectUrlCount: number
  let createObjectUrlMock: ReturnType<typeof vi.fn<(blob: Blob) => string>>
  let revokeObjectUrlMock: ReturnType<typeof vi.fn<(url: string) => void>>

  beforeEach(() => {
    records = new Map<string, Blob>()
    objectUrlCount = 0
    createObjectUrlMock = vi.fn(() => {
      objectUrlCount += 1
      return `blob:background-${objectUrlCount}`
    })
    revokeObjectUrlMock = vi.fn()

    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: createObjectUrlMock,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: revokeObjectUrlMock,
    })
    installFakeIndexedDb(records)
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    restoreIndexedDb()
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: originalCreateObjectUrl,
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: originalRevokeObjectUrl,
    })
  })

  it('loads a saved image blob from IndexedDB as an object URL', async () => {
    const storedImage = new Blob(['stored'], { type: 'image/png' })
    records.set(BACKGROUND_IMAGE_KEY, storedImage)

    const { result } = renderHook(() => useBackgroundImage())

    expect(result.current.isLoading).toBe(true)

    await waitFor(() => {
      expect(result.current.backgroundUrl).toBe('blob:background-1')
    })

    expect(result.current.error).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(createObjectUrlMock).toHaveBeenCalledWith(storedImage)
  })

  it('saves an image file and updates the background URL', async () => {
    const imageFile = new File(['new image'], 'background.png', {
      type: 'image/png',
    })
    const { result } = renderHook(() => useBackgroundImage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.setImage(imageFile)
    })

    expect(records.get(BACKGROUND_IMAGE_KEY)).toBe(imageFile)
    expect(result.current.backgroundUrl).toBe('blob:background-1')
    expect(result.current.error).toBeNull()
  })

  it('persists a saved image for the next hook instance', async () => {
    const imageFile = new File(['new image'], 'background.png', {
      type: 'image/png',
    })
    const firstHook = renderHook(() => useBackgroundImage())

    await waitFor(() => {
      expect(firstHook.result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await firstHook.result.current.setImage(imageFile)
    })
    firstHook.unmount()

    const secondHook = renderHook(() => useBackgroundImage())

    await waitFor(() => {
      expect(secondHook.result.current.backgroundUrl).toBe('blob:background-2')
    })

    expect(records.get(BACKGROUND_IMAGE_KEY)).toBe(imageFile)
    expect(createObjectUrlMock).toHaveBeenLastCalledWith(imageFile)
    expect(secondHook.result.current.error).toBeNull()
  })

  it('rejects non-image files without writing them to IndexedDB', async () => {
    const textFile = new File(['notes'], 'notes.txt', { type: 'text/plain' })
    const { result } = renderHook(() => useBackgroundImage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.setImage(textFile)
    })

    expect(records.has(BACKGROUND_IMAGE_KEY)).toBe(false)
    expect(result.current.backgroundUrl).toBeNull()
    expect(result.current.error?.code).toBe('invalid-file')
  })

  it('clears a saved image and revokes the active object URL', async () => {
    const imageFile = new File(['new image'], 'background.png', {
      type: 'image/png',
    })
    const { result } = renderHook(() => useBackgroundImage())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    await act(async () => {
      await result.current.setImage(imageFile)
    })
    await act(async () => {
      await result.current.clearImage()
    })

    expect(records.has(BACKGROUND_IMAGE_KEY)).toBe(false)
    expect(result.current.backgroundUrl).toBeNull()
    expect(result.current.error).toBeNull()
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:background-1')
  })

  it('returns an error when IndexedDB is unavailable', () => {
    removeIndexedDb()

    const { result } = renderHook(() => useBackgroundImage())

    expect(result.current.backgroundUrl).toBeNull()
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error?.code).toBe('indexeddb-unavailable')
  })

  it('revokes the active object URL on unmount', async () => {
    const storedImage = new Blob(['stored'], { type: 'image/png' })
    records.set(BACKGROUND_IMAGE_KEY, storedImage)

    const { result, unmount } = renderHook(() => useBackgroundImage())

    await waitFor(() => {
      expect(result.current.backgroundUrl).toBe('blob:background-1')
    })

    unmount()

    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:background-1')
  })
})
