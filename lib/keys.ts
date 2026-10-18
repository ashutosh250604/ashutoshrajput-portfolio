'use client'

import type { Chord, EggBinding } from './eggs'

/**
 * How a binding is written down, in one place.
 *
 * The register says what opens a secret; this says how to print it. The colophon
 * wants both keyboard dialects side by side (it is static HTML and cannot know
 * who is reading), the palette wants the short form, and the key sheet wants the
 * one that matches the visitor's own keyboard. Three shapes, one source.
 */
export type Platform = 'mac' | 'pc'

/** Keys that have a symbol rather than a letter. */
const GLYPHS: Record<string, string> = {
  arrowup: '↑',
  arrowdown: '↓',
  arrowleft: '←',
  arrowright: '→',
  escape: 'Esc',
  enter: 'Return',
  ' ': 'Space',
}

export function keyLabel(key: string): string {
  const glyph = GLYPHS[key.toLowerCase()]
  if (glyph) return glyph
  return key.length === 1 ? key.toUpperCase() : key
}

/**
 * Modifiers in the order each keyboard writes them: ⇧ ⌘ X on a Mac, Ctrl Shift X
 * on Windows and Linux. Same gesture, and neither side reads it backwards.
 */
export function chordParts(chord: Chord, platform: Platform): string[] {
  const mod = chord.mod ? (platform === 'mac' ? '⌘' : 'Ctrl') : null
  const alt = chord.alt ? (platform === 'mac' ? '⌥' : 'Alt') : null
  const shift = chord.shift ? (platform === 'mac' ? '⇧' : 'Shift') : null
  const modifiers = platform === 'mac' ? [shift, alt, mod] : [mod, alt, shift]
  const parts = modifiers.filter((part): part is string => part !== null)
  parts.push(keyLabel(chord.key))
  return parts
}

export function sequenceParts(sequence: string[]): string[] {
  return sequence.map(keyLabel)
}

/**
 * The platform of the visitor's keyboard.
 *
 * `platform` is deprecated but still the most reliable cheap answer, and
 * `userAgentData` is the replacement where it exists. Only called in the
 * browser: the static export has no navigator.
 */
export function currentPlatform(): Platform {
  if (typeof navigator === 'undefined') return 'pc'

  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData
  const hint = uaData?.platform ?? navigator.platform ?? navigator.userAgent
  return /mac|iphone|ipad|ipod/i.test(hint) ? 'mac' : 'pc'
}

/**
 * The form the colophon prints: both dialects for a chord, one line for a
 * sequence, which is the same on every keyboard.
 */
export function bindingLabel(binding: EggBinding): string {
  if (binding.chord) {
    const mac = chordParts(binding.chord, 'mac').join(' ')
    const pc = chordParts(binding.chord, 'pc').join(' ')
    // "? · ?" is noise: some bindings are the same key on both keyboards.
    return mac === pc ? mac : `${mac} · ${pc}`
  }
  return sequenceParts(binding.sequence ?? []).join(' ')
}

/** The compact form the palette's hint column uses. */
export function bindingHint(binding: EggBinding, platform: Platform): string {
  if (binding.chord) {
    const parts = chordParts(binding.chord, platform)
    // ⇧⌘X is read as one gesture on a Mac; Windows is written with spaces.
    return platform === 'mac' ? parts.join('') : parts.join(' ')
  }
  return sequenceParts(binding.sequence ?? []).join('')
}
