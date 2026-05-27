// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useCurrentTime } from './useCurrentTime'

describe('useCurrentTime', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-27T12:00:00.000Z'))
  })

  afterEach(() => {
    cleanup()
    vi.useRealTimers()
  })

  it('returns the current Date and updates every second', () => {
    const { result } = renderHook(() => useCurrentTime())

    expect(result.current.toISOString()).toBe('2026-05-27T12:00:00.000Z')

    act(() => {
      vi.advanceTimersByTime(1000)
    })

    expect(result.current.toISOString()).toBe('2026-05-27T12:00:01.000Z')
  })

  it('cleans up its interval on unmount', () => {
    const { unmount } = renderHook(() => useCurrentTime())

    expect(vi.getTimerCount()).toBe(1)

    unmount()

    expect(vi.getTimerCount()).toBe(0)
  })
})
