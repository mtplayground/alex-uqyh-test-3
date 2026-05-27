// @vitest-environment jsdom

import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { useGeolocation } from './useGeolocation'

type GetCurrentPosition = Geolocation['getCurrentPosition']
type GeolocationSuccessCallback = Parameters<GetCurrentPosition>[0]

const originalGeolocation = navigator.geolocation

function setMockGeolocation(getCurrentPosition: GetCurrentPosition): void {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition,
    },
  })
}

function setUnsupportedGeolocation(): void {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: undefined,
  })
}

function createPosition(
  latitude: number,
  longitude: number,
): GeolocationPosition {
  return {
    coords: {
      latitude,
      longitude,
    },
  } as GeolocationPosition
}

function createPositionError(
  code: number,
  message: string,
): GeolocationPositionError {
  return {
    code,
    message,
  } as GeolocationPositionError
}

describe('useGeolocation', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: originalGeolocation,
    })
  })

  it('requests the current position and returns latitude and longitude', async () => {
    const getCurrentPosition = vi.fn<GetCurrentPosition>((success) => {
      success(createPosition(40.7128, -74.006))
    })
    setMockGeolocation(getCurrentPosition)

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current).toEqual({
      coordinates: {
        latitude: 40.7128,
        longitude: -74.006,
      },
      error: null,
      isLoading: false,
      isSupported: true,
    })
    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      {
        enableHighAccuracy: false,
        maximumAge: 60_000,
        timeout: 10_000,
      },
    )
  })

  it('returns a permission denied error state', async () => {
    const getCurrentPosition = vi.fn<GetCurrentPosition>((_, error) => {
      error?.(createPositionError(1, 'User denied geolocation'))
    })
    setMockGeolocation(getCurrentPosition)

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.error?.code).toBe('permission-denied')
    })

    expect(result.current.coordinates).toBeNull()
    expect(result.current.error).toEqual({
      code: 'permission-denied',
      message: 'User denied geolocation',
    })
    expect(result.current.isLoading).toBe(false)
    expect(result.current.isSupported).toBe(true)
  })

  it('returns a timeout error state', async () => {
    const getCurrentPosition = vi.fn<GetCurrentPosition>((_, error) => {
      error?.(createPositionError(3, 'Location request timed out'))
    })
    setMockGeolocation(getCurrentPosition)

    const { result } = renderHook(() => useGeolocation())

    await waitFor(() => {
      expect(result.current.error?.code).toBe('timeout')
    })

    expect(result.current.coordinates).toBeNull()
    expect(result.current.error).toEqual({
      code: 'timeout',
      message: 'Location request timed out',
    })
    expect(result.current.isLoading).toBe(false)
  })

  it('returns an unsupported state when geolocation is unavailable', () => {
    setUnsupportedGeolocation()

    const { result } = renderHook(() => useGeolocation())

    expect(result.current).toEqual({
      coordinates: null,
      error: {
        code: 'unsupported',
        message: 'Geolocation is not supported by this browser.',
      },
      isLoading: false,
      isSupported: false,
    })
  })

  it('does not update state from a late callback after unmount', () => {
    let successCallback: GeolocationSuccessCallback | null = null
    const getCurrentPosition = vi.fn<GetCurrentPosition>((success) => {
      successCallback = success
    })
    setMockGeolocation(getCurrentPosition)

    const { result, unmount } = renderHook(() => useGeolocation())

    expect(result.current.isLoading).toBe(true)

    unmount()

    act(() => {
      successCallback?.(createPosition(34.0522, -118.2437))
    })

    expect(result.current.coordinates).toBeNull()
    expect(result.current.isLoading).toBe(true)
  })

  it('passes custom position options to the browser API', () => {
    const getCurrentPosition = vi.fn<GetCurrentPosition>()
    setMockGeolocation(getCurrentPosition)
    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000,
    }

    renderHook(() => useGeolocation(options))

    expect(getCurrentPosition).toHaveBeenCalledWith(
      expect.any(Function),
      expect.any(Function),
      options,
    )
  })
})
