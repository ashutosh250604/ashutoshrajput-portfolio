'use client'

import { useEffect } from 'react'
import { revision } from '@/data/colophon'
import { eggs } from '@/lib/eggs'

/**
 * The greeting in the console.
 *
 * A portfolio gets read by people who open devtools, and the console is the one
 * surface on the page that can address them directly without spending a pixel
 * of layout or a byte of markup. Nothing here is Firefox-or-Chrome specific and
 * nothing is required to use the site; it is a note left on the desk.
 *
 * The count comes from the egg register rather than being written down, so this
 * cannot end up boasting about secrets that no longer exist.
 */

/** Once per page load, even if React runs the effect twice in development. */
let greeted = false

const MONOGRAM = 'background:#58a6ff;color:#0b0b0b;font-weight:700;padding:2px 7px;border-radius:2px'
const STRONG = 'color:#58a6ff;font-weight:600'
const QUIET = 'color:#8b949e'

export default function ConsoleGreeting() {
  useEffect(() => {
    if (greeted) return
    greeted = true

    console.log('%cAR%c  Ashutosh Rajput - backend developer, Bangalore', MONOGRAM, STRONG)
    console.log(
      `%c rev ${revision} · set by hand, exported as flat HTML · no runtime backend`,
      QUIET
    )
    console.log(
      `%c ⌘K or Ctrl-K opens the palette; ? lists every key on the page. ${eggs.length} things here are not in the layout.`,
      QUIET
    )
    console.log('%c Source: https://github.com/ashutosh250604/ashutoshrajput-portfolio', QUIET)
  }, [])

  return null
}
