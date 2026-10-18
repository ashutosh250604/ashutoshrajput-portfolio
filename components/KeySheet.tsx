'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { bindingOf, eggs, markEggFound, useFoundEggs } from '@/lib/eggs'
import { chordParts, currentPlatform, sequenceParts, type Platform } from '@/lib/keys'
import { lockScroll, unlockScroll } from '@/lib/scrollLock'
import { KEYS_EVENT } from '@/lib/secrets'
import { useShortcuts } from '@/lib/shortcuts'

/**
 * The key sheet: every way into the page, on one slip.
 *
 * A hidden page needs a way of being found that is not a link — that is what
 * keeps the secrets secrets — but "you had to be told on Twitter" is not a
 * mechanism either. So this lists every trigger, including the ones that are
 * still unfound, and marks them the way the colophon's index does. The list is
 * read from the register rather than written out here: a sheet that lies about
 * a chord is worse than no sheet.
 */
export default function KeySheet() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  // Only the browser knows the keyboard. This component is client-only, so the
  // answer is available on the first render.
  const [platform] = useState<Platform>(() => currentPlatform())
  const found = useFoundEggs()

  const closeRef = useRef<HTMLButtonElement>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  const enter = useCallback(() => setOpen(true), [])

  useShortcuts([{ ...bindingOf('keys'), run: enter }])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(KEYS_EVENT, onOpen)
    return () => window.removeEventListener(KEYS_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return

    markEggFound('keys')
    returnFocusRef.current = document.activeElement as HTMLElement | null
    lockScroll()
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
      // The footer's little `?` is the way most visitors will have come in; put
      // the caret back where it was rather than at the top of the document.
      const previous = returnFocusRef.current
      if (previous && document.contains(previous)) previous.focus()
    }
  }, [open])

  if (!open) return null

  const chords = eggs.filter((egg) => egg.binding.chord)
  const typed = eggs.filter((egg) => egg.binding.sequence)
  const paletteBinding = { chord: { key: 'k', mod: true } }

  const trapTab = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('button, [href]')
    )
    if (focusable.length === 0) return
    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first.focus()
    }
  }

  const chip = 'rounded-sm border border-rule/20 px-1.5 py-0.5 font-mono text-[10px] leading-none'

  return (
    <div className="fixed inset-0 z-[86] flex items-start justify-center px-4 py-[8vh] sm:py-[12vh]">
      <div aria-hidden className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="keys-title"
        onKeyDown={trapTab}
        className="relative max-h-[84vh] w-full max-w-xl animate-slide-down overflow-y-auto rounded-sm border border-rule/20 bg-paper shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-rule/15 bg-paper px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span aria-hidden className="font-mono text-sm text-accent">
              ?
            </span>
            <h2 id="keys-title" className="font-mono text-[11px] uppercase tracking-[0.18em]">
              {t('keys.palette')}
            </h2>
            <span className="tabular font-mono text-[10px] text-muted">
              {found.length}/{eggs.length}
            </span>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('egg.close')}
            title={t('egg.close')}
            className="rounded-sm p-1.5 text-muted transition-colors hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-5 sm:px-5">
          <p className="max-w-prose font-mono text-[11px] leading-relaxed text-muted">
            {t('keys.hint')}
          </p>

          <h3 className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {t('keys.chords')}
          </h3>
          <ul className="mt-2 divide-y divide-rule/15 border-y border-rule/15">
            <li className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="font-mono text-xs text-ink/85">{t('palette.hint')}</span>
              <span className="flex shrink-0 items-baseline gap-1">
                {chordParts(paletteBinding.chord, platform).map((part) => (
                  <kbd key={part} className={`${chip} text-muted`}>
                    {part}
                  </kbd>
                ))}
              </span>
            </li>

            {chords.map((egg) => {
              const isFound = found.includes(egg.id)
              return (
                <li key={egg.id} className="flex items-baseline justify-between gap-4 py-2.5">
                  <span className="flex items-baseline gap-2">
                    <span aria-hidden className={isFound ? 'text-accent' : 'text-muted'}>
                      {isFound ? '●' : '○'}
                    </span>
                    <span className={`font-mono text-xs ${isFound ? 'text-ink/90' : 'text-muted'}`}>
                      {t(egg.labelKey)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-baseline gap-1">
                    {chordParts(egg.binding.chord!, platform).map((part) => (
                      <kbd key={part} className={chip}>
                        {part}
                      </kbd>
                    ))}
                  </span>
                </li>
              )
            })}
          </ul>

          <h3 className="mt-6 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
            {t('keys.typed')}
          </h3>
          <ul className="mt-2 divide-y divide-rule/15 border-y border-rule/15">
            {typed.map((egg) => {
              const isFound = found.includes(egg.id)
              return (
                <li key={egg.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-2.5">
                  <span className="flex items-baseline gap-2">
                    <span aria-hidden className={isFound ? 'text-accent' : 'text-muted'}>
                      {isFound ? '●' : '○'}
                    </span>
                    <span className={`font-mono text-xs ${isFound ? 'text-ink/90' : 'text-muted'}`}>
                      {t(egg.labelKey)}
                    </span>
                  </span>
                  <kbd className={`${chip} whitespace-nowrap tabular ${isFound ? 'text-ink/80' : 'text-muted'}`}>
                    {sequenceParts(egg.binding.sequence!).join(' ')}
                  </kbd>
                </li>
              )
            })}
          </ul>

          <p className="mt-4 flex items-center gap-2 font-mono text-[10px] leading-relaxed text-muted">
            <kbd className={chip}>Esc</kbd>
            <span>{t('keys.escape')}</span>
          </p>
        </div>
      </div>
    </div>
  )
}
