'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage, languages } from '@/contexts/LanguageContext'
import { revision } from '@/data/colophon'
import { bindingOf, eggs, markEggFound, useFoundEggs } from '@/lib/eggs'
import { RECEIPT_EVENT } from '@/lib/secrets'
import { useShortcuts } from '@/lib/shortcuts'

/**
 * The visitor's slip: a receipt for this visit, printed from what the browser
 * will tell us and nothing else.
 *
 * Every portfolio measures its visitors; almost none of them say so in a way
 * anybody reads. This one hands you the printout instead: the clock you are
 * reading by, the window you are reading in, the language you asked for - and
 * then the line that matters, that none of it left the browser. It is a small
 * joke about analytics that is also literally true.
 *
 * Nothing here is stored or sent. The facts are read when the slip prints, so
 * turning the phone sideways and printing another one tells the truth again.
 */

interface Facts {
  date: string
  time: string
  zone: string
  locale: string
  screen: string
  platform: string
  number: string
}

function readFacts(): Facts {
  const now = new Date()
  const locale = navigator.language || 'en'

  const format = (options: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat(locale, options).format(now)
    } catch {
      // An unknown locale tag is a reason to fall back, not to fail the toy.
      return ''
    }
  }

  let zone = ''
  try {
    zone =
      new Intl.DateTimeFormat(locale, { timeZoneName: 'short' })
        .formatToParts(now)
        .find((part) => part.type === 'timeZoneName')?.value ?? ''
  } catch {
    zone = ''
  }

  const uaData = (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData

  return {
    date: format({ dateStyle: 'long' }),
    time: format({ hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
    zone,
    locale,
    // Some browsers report a ratio like 1.0000000298 after a zoom; a slip
    // should not print that.
    screen: `${window.innerWidth} × ${window.innerHeight} @ ${
      Math.round((window.devicePixelRatio || 1) * 100) / 100
    }×`,
    platform: uaData?.platform || navigator.platform || '-',
    // A receipt number, so the slip looks like one. Six digits of the clock.
    number: String(Date.now()).slice(-6),
  }
}

/** Bars from the receipt number, so no two slips have the same barcode. */
function bars(number: string): number[] {
  return number.split('').flatMap((digit) => {
    const value = Number(digit)
    return [1 + (value % 3), 1, 1 + ((value + 1) % 2)]
  })
}

export default function Receipt() {
  const { t, language } = useLanguage()
  const [open, setOpen] = useState(false)
  const [facts, setFacts] = useState<Facts | null>(null)
  const found = useFoundEggs()
  const closeRef = useRef<HTMLButtonElement>(null)

  const enter = useCallback(() => setOpen(true), [])

  useShortcuts([{ ...bindingOf('receipt'), run: enter }])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(RECEIPT_EVENT, onOpen)
    return () => window.removeEventListener(RECEIPT_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return

    markEggFound('receipt')
    setFacts(readFacts())

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  // The slip only exists once its facts have been read, so the caret has to
  // wait for that render rather than for the open flag.
  useEffect(() => {
    if (open && facts) closeRef.current?.focus()
  }, [open, facts])

  if (!open || !facts) return null

  const languageName = languages.find((entry) => entry.code === language)?.nativeName ?? language

  const rows = [
    { label: t('contact.localTime'), value: `${facts.time}${facts.zone ? ` ${facts.zone}` : ''}` },
    { label: t('receipt.locale'), value: `${facts.locale} · ${languageName}` },
    { label: t('receipt.screen'), value: facts.screen },
    { label: t('receipt.platform'), value: facts.platform },
    { label: t('receipt.stored'), value: `${found.length} / ${eggs.length}` },
  ]

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[84] flex justify-center p-4 sm:justify-end sm:p-6">
      <div
        role="dialog"
        aria-labelledby="receipt-title"
        className="pointer-events-auto relative w-full max-w-[21rem] animate-slide-up border border-rule/25 bg-paper px-5 pb-4 pt-6 font-mono shadow-2xl"
      >
        <button
          ref={closeRef}
          type="button"
          onClick={() => setOpen(false)}
          aria-label={t('egg.close')}
          title={t('egg.close')}
          className="absolute right-2 top-2 rounded-sm p-1 text-muted transition-colors hover:text-accent"
        >
          <X className="h-3.5 w-3.5" />
        </button>

        <div className="text-center">
          <p id="receipt-title" className="text-[11px] uppercase tracking-[0.24em]">
            {t('hero.name')}
          </p>
          <p className="mt-1.5 text-[9px] uppercase tracking-[0.18em] text-muted">
            {t('hero.role.backend')}
          </p>
          <p className="mt-0.5 text-[9px] uppercase tracking-[0.18em] text-muted">
            {t('contact.locationValue')}
          </p>
        </div>

        <div className="mt-4 flex items-baseline justify-between gap-3 border-t border-dashed border-rule/25 pt-3 text-[9px] text-muted">
          <span>{facts.date}</span>
          <span className="tabular shrink-0">NO. {facts.number}</span>
        </div>

        <dl className="mt-3 space-y-1.5">
          {rows.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-3">
              <dt className="shrink-0 text-[9px] uppercase tracking-[0.14em] text-muted">{row.label}</dt>
              <dd className="tabular truncate text-right text-[11px] text-ink/85">{row.value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 flex items-baseline justify-between gap-3 border-t border-dashed border-rule/25 pt-2.5">
          <span className="text-[9px] uppercase tracking-[0.18em] text-muted">{t('receipt.total')}</span>
          <span className="tabular text-sm">0.00</span>
        </div>

        <p className="mt-4 text-[9px] leading-relaxed text-muted">{t('receipt.hint')}</p>
        <p className="mt-2 text-[10px] leading-relaxed text-accent">{t('receipt.thanks')}</p>

        <div aria-hidden className="mt-4 flex h-7 items-stretch gap-[2px]">
          {bars(facts.number).map((width, index) => (
            <span
              key={index}
              style={{ width: `${width * 2}px` }}
              className="bg-ink/75"
            />
          ))}
        </div>
        <p className="mt-1.5 flex justify-between text-[9px] uppercase tracking-[0.16em] text-muted">
          <span>REV {revision}</span>
          <span>NO. {facts.number}</span>
        </p>
      </div>
    </div>
  )
}
