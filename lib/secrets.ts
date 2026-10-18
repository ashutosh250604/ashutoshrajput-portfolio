'use client'

/**
 * Doorbells for the secrets that do not have a chord of their own.
 *
 * Same reasoning as lib/os.ts: the command palette only needs to ring, and it
 * should not have to carry the room. Importing the components to reach their
 * exports would pull a grid measure, a Web Audio synth, a whole proof sheet and
 * a sketch surface into the palette's chunk for visitors who never open any of
 * them.
 *
 * Each component listens for its own event, so the keys, the palette, the key
 * sheet and anything added later all go through one door.
 */
export const BLUEPRINT_EVENT = 'portfolio:open-blueprint'
export const SIGNAL_EVENT = 'portfolio:open-signal'
export const PROOF_EVENT = 'portfolio:open-proof'
export const INK_EVENT = 'portfolio:open-ink'
export const RECEIPT_EVENT = 'portfolio:open-receipt'
export const KEYS_EVENT = 'portfolio:open-keys'

export const openBlueprint = () => window.dispatchEvent(new Event(BLUEPRINT_EVENT))
export const openSignal = () => window.dispatchEvent(new Event(SIGNAL_EVENT))
export const openProof = () => window.dispatchEvent(new Event(PROOF_EVENT))
export const openInk = () => window.dispatchEvent(new Event(INK_EVENT))
export const openReceipt = () => window.dispatchEvent(new Event(RECEIPT_EVENT))
export const openKeys = () => window.dispatchEvent(new Event(KEYS_EVENT))
