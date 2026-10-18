'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { revision } from '@/data/colophon'
import { bindingOf, markEggFound } from '@/lib/eggs'
import { PROOF_EVENT } from '@/lib/secrets'
import { useShortcuts } from '@/lib/shortcuts'

/**
 * Press proof: the site dressed as the proof sheet it would be printed from.
 *
 * A proof is what you check before the run — crop marks where the guillotine
 * will cut, registration marks to see the inks line up, a bar of the inks in
 * use, and a slug carrying the revision. That is a genuine document behaviour
 * rather than a theme, which is why it suits a page that claims to be set like
 * one, and why it can be drawn entirely in hairlines with nothing to load.
 *
 * The ink bar is not decoration: each swatch reads its value from the same CSS
 * custom properties the site paints with, and re-reads them when the theme
 * class changes. So the bar is a live readout of the inks in use, and flipping
 * light to dark changes the bars in front of you — which is the one thing a
 * proof sheet is actually for.
 */

/** Inset of the trim frame from the viewport edge, in pixels. */
const TRIM = 26
/** Length of a crop mark's arms. */
const ARM = 16

const INKS = [
  { token: '--paper', label: 'Paper' },
  { token: '--ink', label: 'Ink' },
  { token: '--muted', label: 'Muted' },
  { token: '--rule', label: 'Rule' },
  { token: '--accent', label: 'Accent' },
  { token: '--accent-strong', label: 'Strong' },
]

/** `247 245 239` as written in the stylesheet, read as a live value. */
function readToken(name: string): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return value || '0 0 0'
}

/**
 * The eight arms of the four crop marks. Each one starts at a corner of the
 * trim frame and runs outward, which is where a trim mark sits on real stock:
 * outside the cut, so it falls away with the offcut.
 */
function CropMarks() {
  const arm = `${ARM}px`
  const marks = [
    // top-left
    { className: '-left-px -top-px -translate-x-full', style: { width: arm, height: '1px' } },
    { className: '-left-px -top-px -translate-y-full', style: { width: '1px', height: arm } },
    // top-right
    { className: '-right-px -top-px translate-x-full', style: { width: arm, height: '1px' } },
    { className: '-right-px -top-px -translate-y-full', style: { width: '1px', height: arm } },
    // bottom-left
    { className: '-bottom-px -left-px -translate-x-full', style: { width: arm, height: '1px' } },
    { className: '-bottom-px -left-px translate-y-full', style: { width: '1px', height: arm } },
    // bottom-right
    { className: '-bottom-px -right-px translate-x-full', style: { width: arm, height: '1px' } },
    { className: '-bottom-px -right-px translate-y-full', style: { width: '1px', height: arm } },
  ]

  return (
    <>
      {marks.map((mark) => (
        <span
          key={mark.className}
          aria-hidden
          className={`absolute bg-ink/45 ${mark.className}`}
          style={mark.style}
        />
      ))}
    </>
  )
}

/** A register target: a ring with a crosshair, one per edge of the sheet. */
function RegistrationMark({ className }: { className: string }) {
  return (
    <span aria-hidden className={`absolute h-4 w-4 rounded-full border border-ink/35 ${className}`}>
      <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-ink/35" />
      <span className="absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-ink/35" />
    </span>
  )
}

export default function PressProof() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [inks, setInks] = useState<string[]>([])
  const closeRef = useRef<HTMLButtonElement>(null)

  const enter = useCallback(() => setOpen(true), [])

  useShortcuts([{ ...bindingOf('proof'), run: enter }])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(PROOF_EVENT, onOpen)
    return () => window.removeEventListener(PROOF_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    markEggFound('proof')

    const read = () => setInks(INKS.map((ink) => readToken(ink.token)))
    read()

    // The theme is a class on the document element, so that is what to watch.
    const observer = new MutationObserver(read)
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      observer.disconnect()
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!open) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-[82]">
      <span aria-hidden className="absolute animate-marks-in" style={{ inset: `${TRIM}px` }}>
        {/* The trim: where the sheet would be cut. */}
        <span className="absolute inset-0 border border-ink/25" />
        <CropMarks />
        <RegistrationMark className="left-1/2 top-0 -translate-x-1/2 -translate-y-1/2" />
        <RegistrationMark className="bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2" />
        <RegistrationMark className="left-0 top-1/2 -translate-x-1/2 -translate-y-1/2" />
        <RegistrationMark className="right-0 top-1/2 -translate-y-1/2 translate-x-1/2" />
      </span>

      {/* The slug: what this sheet is, and the revision it was set from. */}
      <p
        aria-hidden
        className="absolute left-1/2 -translate-x-1/2 animate-marks-in whitespace-nowrap bg-paper px-3 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-muted"
        style={{ top: `${TRIM - 1}px` }}
      >
        Proof · not for press · rev {revision}
      </p>

      {/* The ink bar, read live from the theme's own tokens. */}
      <div
        aria-hidden
        className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 animate-marks-in"
      >
        <div className="flex items-stretch gap-px bg-paper p-1">
          {INKS.map((ink, index) => (
            <span
              key={ink.token}
              title={`${ink.label} · ${inks[index] ?? ''}`}
              className="h-3.5 w-9 border border-ink/15"
              style={{ background: `rgb(${inks[index] ?? '0 0 0'} / 1)` }}
            />
          ))}
        </div>
      </div>

      <div
        role="dialog"
        aria-label={t('proof.palette')}
        className="pointer-events-auto absolute right-6 top-16 w-[19rem] max-w-[86vw] animate-fade-in rounded-sm border border-rule/25 bg-paper p-4 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              {t('proof.palette')}
            </p>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{t('proof.hint')}</p>
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

        <dl className="mt-4 divide-y divide-rule/15 border-y border-rule/15 font-mono text-[10px]">
          {INKS.map((ink, index) => (
            <div key={ink.token} className="flex items-baseline justify-between gap-3 py-1.5">
              <dt className="uppercase tracking-[0.14em] text-muted">{ink.label}</dt>
              <dd className="tabular text-ink/90">{inks[index] ?? '—'}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
