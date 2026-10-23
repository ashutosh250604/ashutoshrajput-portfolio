'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Volume2, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { bindingOf, markEggFound } from '@/lib/eggs'
import { SIGNAL_EVENT } from '@/lib/secrets'
import { useShortcuts } from '@/lib/shortcuts'

/**
 * Signal: four notes the browser makes for itself.
 *
 * There is no audio file anywhere in this project, and that is the point - the
 * site is a static export with no runtime backend, so the only way it can make
 * a sound is to build the waveform in front of you. An A major arpeggio, sine
 * with a quiet triangle an octave up for a little sheen, under an envelope
 * short enough to read as a chime rather than a note being held.
 *
 * It is quiet on purpose (a portfolio that startles people is a bad portfolio)
 * and it says so when a browser holds the sound back, rather than pretending
 * the press worked.
 */

const NOTES = [
  { name: 'A4', frequency: 440 },
  { name: 'C#5', frequency: 554.37 },
  { name: 'E5', frequency: 659.25 },
  { name: 'A5', frequency: 880 },
]

/** Gap between the notes, in seconds: an arpeggio, not a chord. */
const STEP = 0.17
/** How long one note rings. */
const RING = 1.15
/** Peak gain of the whole phrase. Low: this is a chime, not a demo. */
const PEAK = 0.13

type BrowserAudio = typeof AudioContext

/**
 * The context's state, read through a call.
 *
 * Written this way because TypeScript keeps its pre-await narrowing on a direct
 * `context.state` read: after `if (state === 'suspended')` it believes the state
 * can only still be "suspended", which makes asking again look like a mistake.
 * It is not - `resume()` is exactly what changes it.
 */
const stateOf = (context: AudioContext): AudioContextState => context.state

export default function Signal() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState<number | null>(null)
  const [blocked, setBlocked] = useState(false)

  const contextRef = useRef<AudioContext | null>(null)
  const timersRef = useRef<number[]>([])
  const closeRef = useRef<HTMLButtonElement>(null)

  const enter = useCallback(() => setOpen(true), [])

  useShortcuts([{ ...bindingOf('signal'), run: enter }])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(SIGNAL_EVENT, onOpen)
    return () => window.removeEventListener(SIGNAL_EVENT, onOpen)
  }, [])

  const clearTimers = () => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }

  /** Built on the first press, and reused for every replay after that. */
  const ensureContext = useCallback((): AudioContext | null => {
    if (contextRef.current) return contextRef.current

    const Ctor: BrowserAudio | undefined =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: BrowserAudio }).webkitAudioContext
    if (!Ctor) {
      setBlocked(true)
      return null
    }

    try {
      contextRef.current = new Ctor()
      return contextRef.current
    } catch {
      setBlocked(true)
      return null
    }
  }, [])

  const play = useCallback(async () => {
    const context = ensureContext()
    if (!context) return

    // A browser may hand over a suspended context until it has seen a gesture.
    // A keypress is one, so this usually resolves immediately; when it does not,
    // say so instead of showing a silent light show.
    if (context.state === 'suspended') {
      try {
        await context.resume()
      } catch {
        // Fall through: the read below is the real answer either way.
      }

      // Ask again: the await is the whole reason the answer may have changed.
      if (stateOf(context) !== 'running') {
        setBlocked(true)
        return
      }
    }

    setBlocked(false)
    clearTimers()

    NOTES.forEach((note, index) => {
      const start = context.currentTime + 0.02 + index * STEP

      const envelope = context.createGain()
      envelope.gain.setValueAtTime(0.0001, start)
      envelope.gain.exponentialRampToValueAtTime(PEAK, start + 0.012)
      envelope.gain.exponentialRampToValueAtTime(0.0001, start + RING)
      envelope.connect(context.destination)

      const voice = context.createOscillator()
      voice.type = 'sine'
      voice.frequency.setValueAtTime(note.frequency, start)
      voice.connect(envelope)

      // An octave up, quiet, to keep the sine from sounding like a test tone.
      const shimmer = context.createOscillator()
      const shimmerGain = context.createGain()
      shimmer.type = 'triangle'
      shimmer.frequency.setValueAtTime(note.frequency * 2, start)
      shimmerGain.gain.value = 0.16
      shimmer.connect(shimmerGain)
      shimmerGain.connect(envelope)

      voice.start(start)
      shimmer.start(start)
      voice.stop(start + RING + 0.05)
      shimmer.stop(start + RING + 0.05)

      timersRef.current.push(
        window.setTimeout(() => setActive(index), index * STEP * 1000),
        window.setTimeout(() => setActive(null), (index * STEP + 0.5) * 1000)
      )
    })
  }, [ensureContext])

  useEffect(() => {
    if (!open) return
    markEggFound('signal')
    closeRef.current?.focus()
    void play()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      clearTimers()
    }
  }, [open, play])

  // One context for the life of the page, closed when the page goes.
  useEffect(
    () => () => {
      clearTimers()
      void contextRef.current?.close().catch(() => {})
      contextRef.current = null
    },
    []
  )

  if (!open) return null

  return (
    <div
      role="dialog"
      aria-label={t('signal.palette')}
      className="fixed bottom-4 left-4 z-[85] w-[20rem] max-w-[92vw] rounded-sm border border-rule/25 bg-paper p-4 shadow-2xl animate-fade-in"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            {t('signal.palette')}
          </p>
          <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{t('signal.hint')}</p>
        </div>
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('egg.close')}
          title={t('egg.close')}
          className="rounded-sm p-1 text-muted transition-colors hover:text-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <ul aria-hidden className="mt-4 grid grid-cols-4 gap-1.5">
        {NOTES.map((note, index) => (
          <li
            key={note.name}
            className={`rounded-sm border py-2 text-center font-mono text-[10px] transition-colors duration-150 ${
              active === index
                ? 'border-accent bg-accent text-accent-on'
                : 'border-rule/20 text-muted'
            }`}
          >
            {note.name}
          </li>
        ))}
      </ul>

      {blocked ? (
        <p className="mt-3 font-mono text-[10px] leading-relaxed text-accent">{t('signal.blocked')}</p>
      ) : null}

      <button
        type="button"
        onClick={() => void play()}
        className="mt-4 inline-flex items-center gap-1.5 rounded-sm border border-rule/25 px-2.5 py-1.5 font-mono text-[11px] transition-colors hover:border-accent hover:text-accent"
      >
        <Volume2 className="h-3 w-3" />
        {t('signal.replay')}
      </button>
    </div>
  )
}
