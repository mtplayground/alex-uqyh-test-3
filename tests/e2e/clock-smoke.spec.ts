import { expect, test } from '@playwright/test'

const formatStorageKey = 'clock-format-preference'

test('clock renders, updates, toggles format, and persists preference', async ({
  page,
}) => {
  await page.goto('/')
  await page.evaluate(
    (key) => window.localStorage.removeItem(key),
    formatStorageKey,
  )
  await page.reload()

  await expect(page.getByText('Local time')).toBeVisible()

  const clock = page.locator('time')
  await expect(clock).toBeVisible()
  await expect(clock).not.toHaveText('')

  const initialDateTime = await clock.getAttribute('datetime')
  expect(initialDateTime).toBeTruthy()

  await expect
    .poll(async () => clock.getAttribute('datetime'), { timeout: 5_000 })
    .not.toBe(initialDateTime)

  const twentyFourHourButton = page.getByRole('button', { name: '24h' })
  const twelveHourButton = page.getByRole('button', { name: '12h' })

  await expect(twentyFourHourButton).toHaveAttribute('aria-pressed', 'true')

  await twelveHourButton.click()

  await expect(twelveHourButton).toHaveAttribute('aria-pressed', 'true')
  await expect
    .poll(() =>
      page.evaluate(
        (key) => window.localStorage.getItem(key),
        formatStorageKey,
      ),
    )
    .toBe('12h')

  await page.reload()

  await expect(page.locator('time')).toBeVisible()
  await expect(page.getByRole('button', { name: '12h' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})
