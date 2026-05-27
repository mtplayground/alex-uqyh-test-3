// @vitest-environment jsdom

import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FORMAT_PREF_STORAGE_KEY, useFormatPref } from './useFormatPref'

describe('useFormatPref', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  afterEach(() => {
    cleanup()
    window.localStorage.clear()
  })

  it('defaults to 24h when no preference is stored', () => {
    const { result } = renderHook(() => useFormatPref())

    expect(result.current[0]).toBe('24h')
  })

  it('reads a stored 12h preference', () => {
    window.localStorage.setItem(FORMAT_PREF_STORAGE_KEY, '12h')

    const { result } = renderHook(() => useFormatPref())

    expect(result.current[0]).toBe('12h')
  })

  it('falls back to 24h for invalid stored preferences', () => {
    window.localStorage.setItem(FORMAT_PREF_STORAGE_KEY, 'invalid')

    const { result } = renderHook(() => useFormatPref())

    expect(result.current[0]).toBe('24h')
  })

  it('persists updates through the setter', () => {
    const { result } = renderHook(() => useFormatPref())

    act(() => {
      result.current[1]('12h')
    })

    expect(result.current[0]).toBe('12h')
    expect(window.localStorage.getItem(FORMAT_PREF_STORAGE_KEY)).toBe('12h')
  })
})
