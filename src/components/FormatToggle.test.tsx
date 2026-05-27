// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { FormatToggle } from './FormatToggle'

describe('FormatToggle', () => {
  afterEach(() => {
    cleanup()
  })

  it('calls the setter with 12h when the 12h option is clicked', () => {
    const setFormat = vi.fn()

    render(<FormatToggle format="24h" setFormat={setFormat} />)

    fireEvent.click(screen.getByRole('button', { name: '12h' }))

    expect(setFormat).toHaveBeenCalledTimes(1)
    expect(setFormat).toHaveBeenCalledWith('12h')
  })

  it('calls the setter with 24h when the 24h option is clicked', () => {
    const setFormat = vi.fn()

    render(<FormatToggle format="12h" setFormat={setFormat} />)

    fireEvent.click(screen.getByRole('button', { name: '24h' }))

    expect(setFormat).toHaveBeenCalledTimes(1)
    expect(setFormat).toHaveBeenCalledWith('24h')
  })
})
