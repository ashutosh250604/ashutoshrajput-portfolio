'use client'

/**
 * The desktop's doorbell, in its own module so nothing that only wants to open
 * the desktop has to pull the desktop's code in with it. The command palette
 * needs the function; the desktop itself needs the whole window manager.
 */
export const OS_EVENT = 'portfolio:start-os'
export const OS_CLOSE_EVENT = 'portfolio:close-os'

export function startOS() {
  window.dispatchEvent(new Event(OS_EVENT))
}

/** The palette asks for the desktop to step aside before it navigates. */
export function closeOS() {
  window.dispatchEvent(new Event(OS_CLOSE_EVENT))
}

/** Every app the desktop can open, in the order the dock lists them. */
export type OsAppId = 'projects' | 'terminal' | 'about' | 'resume' | 'trash'
