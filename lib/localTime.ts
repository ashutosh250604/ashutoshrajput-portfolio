'use client'

import { useEffect, useState } from 'react'

/**
 * A ticking clock on the site's own timezone, which is the owner's — the
 * colophon labels it "Local time" and means his local time, so this is
 * Asia/Kolkata and not the visitor's device zone.
 *
 * Returns null on the first paint: the server has no clock to agree with, and
 * rendering a time during hydration would print a different minute than the
 * markup contains.
 */
export function useLocalTime(parts?: Intl.DateTimeFormatOptions): string | null {
  const [time, setTime] = useState<string | null>(null)

  // Keyed by value: the callers pass object literals, which would otherwise
  // restart the interval on every render.
  const key = JSON.stringify(parts ?? null)

  useEffect(() => {
    const options: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Kolkata',
      ...(JSON.parse(key) ?? {}),
    }

    const tick = () => setTime(new Intl.DateTimeFormat(undefined, options).format(new Date()))

    tick()
    const timer = setInterval(tick, 30_000)
    return () => clearInterval(timer)
  }, [key])

  return time
}
