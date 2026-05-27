// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { ClockDisplay } from './ClockDisplay'

const currentTime = new Date('2026-05-27T15:04:05.000Z')

function formatTime(hour12: boolean): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12,
  }).format(currentTime)
}

function formatDate(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(currentTime)
}

describe('ClockDisplay', () => {
  afterEach(() => {
    cleanup()
  })

  it('renders 24h formatted time and the full date', () => {
    render(<ClockDisplay currentTime={currentTime} format="24h" />)

    const time = screen.getByText(formatTime(false))

    expect(time.getAttribute('dateTime')).toBe(currentTime.toISOString())
    expect(screen.getByText(formatDate())).toBeTruthy()
  })

  it('renders 12h formatted time when selected', () => {
    render(<ClockDisplay currentTime={currentTime} format="12h" />)

    expect(screen.getByText(formatTime(true))).toBeTruthy()
  })
})
