// @vitest-environment jsdom

import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BackgroundUpload } from './BackgroundUpload'
import type { UseBackgroundImageResult } from '../hooks/useBackgroundImage'

type BackgroundUploadState = Pick<
  UseBackgroundImageResult,
  'backgroundUrl' | 'isLoading' | 'error' | 'setImage' | 'clearImage'
>

function createBackgroundImageState(
  overrides: Partial<BackgroundUploadState> = {},
): BackgroundUploadState {
  return {
    backgroundUrl: null,
    isLoading: false,
    error: null,
    setImage: vi
      .fn<UseBackgroundImageResult['setImage']>()
      .mockResolvedValue(undefined),
    clearImage: vi
      .fn<UseBackgroundImageResult['clearImage']>()
      .mockResolvedValue(undefined),
    ...overrides,
  }
}

describe('BackgroundUpload', () => {
  afterEach(() => {
    cleanup()
  })

  it('restricts the file picker to images', () => {
    const backgroundImage = createBackgroundImageState()

    render(<BackgroundUpload backgroundImage={backgroundImage} />)

    const input = screen.getByLabelText('Choose background image')
    expect(input.getAttribute('type')).toBe('file')
    expect(input.getAttribute('accept')).toBe('image/*')
  })

  it('passes the selected file to the background image hook action', async () => {
    const imageFile = new File(['image'], 'background.png', {
      type: 'image/png',
    })
    const setImage = vi
      .fn<UseBackgroundImageResult['setImage']>()
      .mockResolvedValue(undefined)
    const backgroundImage = createBackgroundImageState({ setImage })

    render(<BackgroundUpload backgroundImage={backgroundImage} />)

    fireEvent.change(screen.getByLabelText('Choose background image'), {
      target: {
        files: [imageFile],
      },
    })

    await waitFor(() => {
      expect(setImage).toHaveBeenCalledWith(imageFile)
    })
    expect(setImage).toHaveBeenCalledTimes(1)
  })

  it('does not call setImage when file selection is canceled', () => {
    const setImage = vi
      .fn<UseBackgroundImageResult['setImage']>()
      .mockResolvedValue(undefined)
    const backgroundImage = createBackgroundImageState({ setImage })

    render(<BackgroundUpload backgroundImage={backgroundImage} />)

    fireEvent.change(screen.getByLabelText('Choose background image'), {
      target: {
        files: [],
      },
    })

    expect(setImage).not.toHaveBeenCalled()
  })

  it('clears the custom background when reset is clicked', async () => {
    const clearImage = vi
      .fn<UseBackgroundImageResult['clearImage']>()
      .mockResolvedValue(undefined)
    const backgroundImage = createBackgroundImageState({
      backgroundUrl: 'blob:background',
      clearImage,
    })

    render(<BackgroundUpload backgroundImage={backgroundImage} />)

    fireEvent.click(screen.getByRole('button', { name: 'Reset' }))

    await waitFor(() => {
      expect(clearImage).toHaveBeenCalledTimes(1)
    })
  })

  it('disables reset when the default background is active', () => {
    const backgroundImage = createBackgroundImageState()

    render(<BackgroundUpload backgroundImage={backgroundImage} />)

    expect(
      (screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(screen.getByRole('status').textContent).toBe(
      'Default background active.',
    )
  })

  it('disables controls while background work is loading', () => {
    const backgroundImage = createBackgroundImageState({
      backgroundUrl: 'blob:background',
      isLoading: true,
    })

    render(<BackgroundUpload backgroundImage={backgroundImage} />)

    expect(
      (screen.getByRole('button', { name: 'Background' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(
      (screen.getByRole('button', { name: 'Reset' }) as HTMLButtonElement)
        .disabled,
    ).toBe(true)
    expect(screen.getByRole('status').textContent).toBe(
      'Updating background image.',
    )
  })

  it('renders hook errors as alerts', () => {
    const backgroundImage = createBackgroundImageState({
      error: {
        code: 'write-failed',
        message: 'Unable to save the selected background image.',
      },
    })

    render(<BackgroundUpload backgroundImage={backgroundImage} />)

    expect(screen.getByRole('alert').textContent).toBe(
      'Unable to save the selected background image.',
    )
  })
})
