'use client'

/**
 * The desktop's doorbell, in its own module so nothing that only wants to open
 * the desktop has to pull the desktop's code in with it. The command palette
 * needs the function; the desktop itself needs the whole window manager.
 */
export const OS_EVENT = 'portfolio:start-os'

export function startOS() {
  window.dispatchEvent(new Event(OS_EVENT))
}
