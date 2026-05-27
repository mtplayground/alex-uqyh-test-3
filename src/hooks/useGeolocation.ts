import { useEffect, useState } from 'react'

export interface GeolocationCoordinatesResult {
  latitude: number
  longitude: number
}

export type GeolocationErrorCode =
  | 'unsupported'
  | 'permission-denied'
  | 'position-unavailable'
  | 'timeout'
  | 'unknown'

export interface GeolocationErrorState {
  code: GeolocationErrorCode
  message: string
}

export interface GeolocationState {
  coordinates: GeolocationCoordinatesResult | null
  error: GeolocationErrorState | null
  isLoading: boolean
  isSupported: boolean
}

const DEFAULT_POSITION_OPTIONS: PositionOptions = {
  enableHighAccuracy: false,
  maximumAge: 60_000,
  timeout: 10_000,
}

const GEOLOCATION_ERROR_CODES = {
  permissionDenied: 1,
  positionUnavailable: 2,
  timeout: 3,
} as const

function canUseGeolocation(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    typeof navigator.geolocation?.getCurrentPosition === 'function'
  )
}

function createUnsupportedState(): GeolocationState {
  return {
    coordinates: null,
    error: {
      code: 'unsupported',
      message: 'Geolocation is not supported by this browser.',
    },
    isLoading: false,
    isSupported: false,
  }
}

function mapGeolocationError(error: GeolocationPositionError): GeolocationErrorState {
  switch (error.code) {
    case GEOLOCATION_ERROR_CODES.permissionDenied:
      return {
        code: 'permission-denied',
        message: error.message || 'Location permission was denied.',
      }
    case GEOLOCATION_ERROR_CODES.positionUnavailable:
      return {
        code: 'position-unavailable',
        message: error.message || 'The current position is unavailable.',
      }
    case GEOLOCATION_ERROR_CODES.timeout:
      return {
        code: 'timeout',
        message: error.message || 'Timed out while requesting location.',
      }
    default:
      return {
        code: 'unknown',
        message: error.message || 'Unable to determine the current location.',
      }
  }
}

function createInitialState(): GeolocationState {
  if (!canUseGeolocation()) {
    return createUnsupportedState()
  }

  return {
    coordinates: null,
    error: null,
    isLoading: true,
    isSupported: true,
  }
}

export function useGeolocation(
  options: PositionOptions = DEFAULT_POSITION_OPTIONS,
): GeolocationState {
  const [state, setState] = useState<GeolocationState>(createInitialState)

  useEffect(() => {
    if (!canUseGeolocation()) {
      return
    }

    let isMounted = true

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) {
          return
        }

        setState({
          coordinates: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          },
          error: null,
          isLoading: false,
          isSupported: true,
        })
      },
      (error) => {
        if (!isMounted) {
          return
        }

        setState({
          coordinates: null,
          error: mapGeolocationError(error),
          isLoading: false,
          isSupported: true,
        })
      },
      options,
    )

    return () => {
      isMounted = false
    }
  }, [options])

  return state
}
