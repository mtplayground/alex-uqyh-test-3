import { useEffect, useState } from 'react'

const ONE_SECOND_MS = 1000

export function useCurrentTime(): Date {
  const [currentTime, setCurrentTime] = useState(() => new Date())

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setCurrentTime(new Date())
    }, ONE_SECOND_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [])

  return currentTime
}
