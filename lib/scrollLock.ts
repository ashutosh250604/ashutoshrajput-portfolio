/**
 * Reference-counted body scroll lock.
 *
 * Two overlays can overlap — opening the deck from the command palette closes
 * one and opens the other in the same commit — and a plain
 * `document.body.style.overflow = ''` on close would hand the scroll back to
 * the page while the second overlay is still up.
 */
let locks = 0

export function lockScroll() {
  locks += 1
  document.body.style.overflow = 'hidden'
}

export function unlockScroll() {
  locks = Math.max(0, locks - 1)
  if (locks === 0) document.body.style.overflow = ''
}
