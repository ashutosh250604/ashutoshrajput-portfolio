'use client'

import dynamic from 'next/dynamic'

/**
 * The desktop is a few hundred lines of window chrome that most visitors never
 * open, so it is loaded in the browser only and in its own chunk: the page's
 * own weight does not grow for something hidden, and nothing about it is part
 * of the server render that the static export writes.
 *
 * It still mounts on load, so the ⇧⌘O chord works as soon as the page is
 * interactive — the chunk arrives just after the rest of the JavaScript.
 */
const MiniOS = dynamic(() => import('./MiniOS'), { ssr: false })

export default function MiniOSMount() {
  return <MiniOS />
}
