'use client'

import { useEffect, useRef } from 'react'

/**
 * One place for every hidden keyboard trigger, so each easter egg pays only for
 * its own keys. Two shapes are supported:
 *
 * - `sequence` — keys typed in order anywhere on the page, matched against a
 *   rolling buffer so a near miss never has to be cleared out of the way first.
 * - `chord` — a modifier combination, for people who do not want to type a
 *   dance to reach the thing.
 *
 * Both ignore keystrokes aimed at a form field: typing "deck" into the command
 * palette's search box is a search, not a shortcut.
 */
export interface Shortcut {
  /** Lower-cased keys, in order. Leave empty for a chord-only shortcut. */
  sequence?: string[]
  chord?: {
    key: string
    /** Require shift. Omit for "do not care". */
    shift?: boolean
    /** Require alt. Omit for "do not care". */
    alt?: boolean
    /** Require ⌘ on macOS or Ctrl elsewhere. Omit for "do not care". */
    mod?: boolean
  }
  run: () => void
}

/** A keystroke aimed at a field belongs to the field, not to a shortcut. */
export function isTyping(target: EventTarget | null): boolean {
  const element = target as HTMLElement | null
  if (!element || !element.tagName) return false
  return (
    element.tagName === 'INPUT' ||
    element.tagName === 'TEXTAREA' ||
    element.tagName === 'SELECT' ||
    element.isContentEditable
  )
}

function chordMatches(chord: NonNullable<Shortcut['chord']>, event: KeyboardEvent): boolean {
  if (event.key.toLowerCase() !== chord.key.toLowerCase()) return false
  if (chord.shift !== undefined && chord.shift !== event.shiftKey) return false
  if (chord.alt !== undefined && chord.alt !== event.altKey) return false
  if (chord.mod !== undefined && chord.mod !== (event.metaKey || event.ctrlKey)) return false
  return true
}

function sequenceMatches(sequence: string[], typed: string): boolean {
  if (sequence.length === 0) return false
  return typed.endsWith(sequence.join(','))
}

export function useShortcuts(shortcuts: Shortcut[], enabled = true) {
  // Kept in a ref so a shortcut list rebuilt on every render does not tear the
  // listener down and put it back up again each time.
  const latest = useRef(shortcuts)
  useEffect(() => {
    latest.current = shortcuts
  })

  useEffect(() => {
    if (!enabled) return

    const longest = latest.current.reduce(
      (length, shortcut) => Math.max(length, shortcut.sequence?.length ?? 0),
      1
    )
    let progress: string[] = []

    const onKeyDown = (event: KeyboardEvent) => {
      const typing = isTyping(event.target)

      for (const shortcut of latest.current) {
        if (!shortcut.chord) continue
        if (!chordMatches(shortcut.chord, event)) continue
        if (typing) return
        event.preventDefault()
        progress = []
        shortcut.run()
        return
      }

      // A modified keystroke is the browser's, not ours.
      if (event.metaKey || event.ctrlKey || event.altKey) {
        progress = []
        return
      }
      if (typing) return

      progress = [...progress, event.key.toLowerCase()].slice(-longest)
      const typed = progress.join(',')
      const hit = latest.current.find((shortcut) =>
        sequenceMatches(shortcut.sequence ?? [], typed)
      )
      if (hit) {
        progress = []
        hit.run()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
