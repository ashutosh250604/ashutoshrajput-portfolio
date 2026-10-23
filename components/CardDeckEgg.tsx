'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowUpRight, X } from 'lucide-react'
import { cardGameUrl } from '@/data/projects'
import { lockScroll, unlockScroll } from '@/lib/scrollLock'
import { useShortcuts } from '@/lib/shortcuts'
import { bindingOf, markEggFound } from '@/lib/eggs'
import { useLanguage } from '@/contexts/LanguageContext'

const OPEN_EVENT = 'portfolio:deal-deck'

/** Opens the deck from anywhere - the command palette uses this. */
export function dealDeck() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/**
 * A 7-8 deck: 30 cards, because the game drops the 6s - spades and hearts run
 * from 7 up, diamonds and clubs from 8.
 */
const suits = [
  { name: 'spades', glyph: '♠', red: false, from: 7 },
  { name: 'hearts', glyph: '♥', red: true, from: 7 },
  { name: 'diamonds', glyph: '♦', red: true, from: 8 },
  { name: 'clubs', glyph: '♣', red: false, from: 8 },
]

const ranks: { value: number; label: string }[] = [
  { value: 7, label: '7' },
  { value: 8, label: '8' },
  { value: 9, label: '9' },
  { value: 10, label: '10' },
  { value: 11, label: 'J' },
  { value: 12, label: 'Q' },
  { value: 13, label: 'K' },
  { value: 14, label: 'A' },
]

interface Card {
  id: string
  rank: string
  suit: (typeof suits)[number]
}

const deck: Card[] = suits.flatMap((suit) =>
  ranks
    .filter((rank) => rank.value >= suit.from)
    .map((rank) => ({ id: `${rank.label}${suit.name}`, rank: rank.label, suit }))
)

function shuffle<T>(input: T[]): T[] {
  const copy = [...input]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export default function CardDeckEgg() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [hand, setHand] = useState<Card[]>([])
  const [trump, setTrump] = useState(suits[0])
  const [deals, setDeals] = useState(0)
  const closeRef = useRef<HTMLButtonElement>(null)

  const deal = useCallback(() => {
    setHand(shuffle(deck).slice(0, 7))
    setTrump(suits[Math.floor(Math.random() * suits.length)])
    setDeals((count) => count + 1)
  }, [])

  // The back door: the Konami code, typed anywhere on the page. The sequence
  // itself lives in the egg register, so the key sheet prints what this listens for.
  useShortcuts([{ ...bindingOf('deck'), run: () => setOpen(true) }])

  // The command palette opens the same dialog without typing anything.
  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return

    deal()
    markEggFound('deck')
    lockScroll()
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
    }
  }, [open, deal])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={() => setOpen(false)} />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="deck-title"
        className="relative w-full max-w-lg animate-slide-down rounded-sm border border-rule/20 bg-paper shadow-2xl"
      >
        <div className="flex items-center justify-between gap-4 border-b border-rule/15 px-4 py-3">
          <div className="flex items-baseline gap-3">
            <span className="tabular font-mono text-xs text-accent">07–08</span>
            <h2 id="deck-title" className="font-mono text-[11px] uppercase tracking-[0.18em]">
              {t('egg.title')}
            </h2>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('egg.close')}
            className="rounded-sm p-1.5 text-muted transition-colors hover:text-accent"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-4 py-5">
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-7">
            {hand.map((card, index) => {
              const isTrump = card.suit.name === trump.name
              return (
                <div
                  key={`${card.id}-${deals}`}
                  style={{ animationDelay: `${index * 45}ms` }}
                  className={`flex aspect-[5/7] animate-card-in flex-col justify-between rounded-sm border bg-paper p-1.5 ${
                    isTrump ? 'border-accent/70' : 'border-rule/25'
                  }`}
                >
                  <span className="font-mono text-xs leading-none sm:text-sm">{card.rank}</span>
                  <span
                    className={`self-end rotate-180 font-mono text-base leading-none sm:text-lg ${
                      card.suit.red ? 'text-rose-500' : 'text-ink/90'
                    }`}
                  >
                    {card.suit.glyph}
                  </span>
                </div>
              )
            })}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-rule/15 pt-4">
            <p className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
              {t('egg.trump')}
              <span
                aria-hidden
                className={`text-base leading-none ${trump.red ? 'text-rose-500' : 'text-ink/90'}`}
              >
                {trump.glyph}
              </span>
              <span aria-hidden className="h-3 w-px bg-rule/20" />
              <span className="tabular">DEAL {String(deals).padStart(2, '0')}</span>
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={deal}
                className="rounded-sm bg-ink px-3 py-2 font-mono text-xs text-paper transition-opacity hover:opacity-85"
              >
                {t('egg.deal')}
              </button>
              <a
                href={cardGameUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 rounded-sm border border-rule/20 px-3 py-2 font-mono text-xs transition-colors hover:border-accent hover:text-accent"
              >
                {t('egg.cta')}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <kbd className="hidden rounded-sm border border-rule/20 px-1.5 py-1 font-mono text-[10px] text-muted sm:block">
                esc
              </kbd>
            </div>
          </div>

          <p className="mt-4 text-xs leading-relaxed text-muted">{t('egg.body')}</p>
        </div>
      </div>
    </div>
  )
}
