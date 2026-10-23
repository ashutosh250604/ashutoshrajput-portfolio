'use client'

import { useEffect, useState } from 'react'

/**
 * The register of hidden things, in one place.
 *
 * A secret is only worth keeping if the next one is findable, so every egg
 * records itself here when it is opened. The colophon reads this list back and
 * only shows itself once something has been found - that is the whole point:
 * the index is the reward for finding your first one.
 *
 * Bindings are literals, not translated strings. They are key names, and they
 * are the same on every keyboard layout we could pretend to support.
 *
 * The register is also what each secret listens for - components spread
 * `bindingOf(id)` into useShortcuts rather than repeating their chord - so the
 * key sheet cannot advertise a trigger that no longer does anything.
 */
export type EggId =
  | 'deck'
  | 'chaos'
  | 'os'
  | 'grid'
  | 'signal'
  | 'proof'
  | 'ink'
  | 'receipt'
  | 'keys'

export interface Chord {
  key: string
  /** Require shift. Omit for "do not care". */
  shift?: boolean
  /** Require alt. Omit for "do not care". */
  alt?: boolean
  /** Require ⌘ on macOS or Ctrl elsewhere. Omit for "do not care". */
  mod?: boolean
}

export interface EggBinding {
  /** Lower-cased keys, in order. */
  sequence?: string[]
  chord?: Chord
}

export interface Egg {
  id: EggId
  /** Translation key for the name shown in the index. */
  labelKey: string
  binding: EggBinding
}

export const eggs: Egg[] = [
  {
    id: 'deck',
    labelKey: 'egg.title',
    binding: {
      sequence: [
        'arrowup', 'arrowup', 'arrowdown', 'arrowdown',
        'arrowleft', 'arrowright', 'arrowleft', 'arrowright', 'b', 'a',
      ],
    },
  },
  { id: 'chaos', labelKey: 'chaos.palette', binding: { chord: { key: 'x', shift: true, mod: true } } },
  { id: 'os', labelKey: 'os.palette', binding: { chord: { key: 'o', shift: true, mod: true } } },
  { id: 'grid', labelKey: 'grid.palette', binding: { chord: { key: 'l', shift: true, mod: true } } },
  { id: 'signal', labelKey: 'signal.palette', binding: { chord: { key: 'm', shift: true, mod: true } } },
  { id: 'proof', labelKey: 'proof.palette', binding: { chord: { key: 'e', shift: true, mod: true } } },
  // Typed, not a chord: Ctrl+Shift+I is DevTools in Chrome and Firefox, and a
  // page cannot take that key back. "Ink" costs three letters and always arrives.
  { id: 'ink', labelKey: 'ink.palette', binding: { sequence: ['i', 'n', 'k'] } },
  { id: 'receipt', labelKey: 'receipt.palette', binding: { sequence: ['r', 'e', 'c', 'e', 'i', 'p', 't'] } },
  // Shift + / on most layouts. `mod: false` keeps it clear of the browser's own
  // shortcuts, and leaving shift unset accepts layouts where ? is unshifted.
  { id: 'keys', labelKey: 'keys.palette', binding: { chord: { key: '?', mod: false } } },
]

/** The shortcut a secret listens for. */
export function bindingOf(id: EggId): EggBinding {
  return eggs.find((egg) => egg.id === id)?.binding ?? {}
}

const STORAGE_KEY = 'eggs-found'
const FOUND_EVENT = 'portfolio:eggs-found'
/** Raised to open the index without having found anything yet. */
export const EGG_INDEX_EVENT = 'portfolio:eggs-index'

function load(): EggId[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed.filter((id): id is EggId => eggs.some((egg) => egg.id === id))
  } catch {
    // Storage can be unavailable or hold something that is not ours.
    return []
  }
}

/** Called by an egg the moment it opens. */
export function markEggFound(id: EggId) {
  const found = load()
  if (found.includes(id)) return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...found, id]))
  } catch {
    // Not being able to remember is no reason to break the egg itself.
  }
  window.dispatchEvent(new Event(FOUND_EVENT))
}

/** Opens the index, wherever it is being rendered. */
export function openEggIndex() {
  window.dispatchEvent(new Event(EGG_INDEX_EVENT))
}

/**
 * Starts empty and fills in after mount: localStorage does not exist while the
 * page is rendered on the server, and guessing would desync the markup.
 */
export function useFoundEggs(): EggId[] {
  const [found, setFound] = useState<EggId[]>([])

  useEffect(() => {
    const sync = () => setFound(load())
    sync()

    window.addEventListener(FOUND_EVENT, sync)
    // Another tab finding an egg should count here too.
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(FOUND_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  return found
}
