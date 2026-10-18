'use client'

import { useCallback, useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { bindingOf, markEggFound } from '@/lib/eggs'
import { BLUEPRINT_EVENT } from '@/lib/secrets'
import { useShortcuts } from '@/lib/shortcuts'

/**
 * Blueprint: the grid the page is set on, drawn over it.
 *
 * The site claims to be set like a document, so here is the setting: the ruled
 * column, the guides that divide it, the baseline every line of copy sits on,
 * and the type scale — all measured from the page itself rather than declared
 * here, so the overlay cannot describe a layout the page is not using.
 *
 * It is an instrument, not a modal. The page stays scrollable and clickable
 * underneath (the scrim does not take pointer events) because the whole point
 * is to read the grid across several sections; only the readout is interactive.
 */

/** The column is one column of text. These are the subdivisions, not real columns. */
const COLUMNS = 6

/** Type sizes worth naming, in the order a reader meets them. */
const ROWS: { label: string; selector: string }[] = [
  { label: 'H1', selector: 'main h1' },
  { label: 'H2', selector: 'main h2' },
  { label: 'H3', selector: 'main h3' },
  { label: 'Body', selector: 'main p' },
  { label: 'Meta', selector: 'main .font-mono' },
]

interface Guide {
  x: number
  /** The outer two are the column rules; the rest are guides. */
  edge: boolean
}

interface Measure {
  viewport: string
  /** The ruled box: the hairline frame the sections are set in. */
  frame: number
  /** The measure: the width of the text itself, which is what sets the line length. */
  measure: number
  /** Viewport edge to first character. */
  gutter: number
  baseline: number
  guides: Guide[]
  scale: { label: string; size: number; leading: number }[]
}

const px = (value: string) => Math.round(parseFloat(value) || 0)

/**
 * The ruled column.
 *
 * Selected by the property that makes it the column — the left hairline — and
 * not by position. The first `section > div` on the page is the hero's own
 * container, which carries no rule and no padding, so measuring by position
 * reported a gutter of zero and a column that was not the one being read.
 */
function findColumn(): HTMLElement | null {
  const candidates = Array.from(
    document.querySelectorAll<HTMLElement>('main section > div, main > div')
  ).filter((element) => element.getBoundingClientRect().width > 0)
  if (candidates.length === 0) return null

  const ruled = candidates.filter(
    (element) => parseFloat(getComputedStyle(element).borderLeftWidth) > 0
  )
  const pool = ruled.length > 0 ? ruled : candidates

  return pool.reduce((widest, element) =>
    element.getBoundingClientRect().width > widest.getBoundingClientRect().width ? element : widest
  )
}

/**
 * Reads the page. Returns null before the layout exists, which is the one case
 * where there is nothing honest to draw.
 */
function measure(): Measure | null {
  const container = findColumn()
  if (!container) return null

  const rect = container.getBoundingClientRect()
  const style = getComputedStyle(container)
  const paddingLeft = px(style.paddingLeft)
  const paddingRight = px(style.paddingRight)

  const innerLeft = rect.left + paddingLeft
  const innerWidth = rect.width - paddingLeft - paddingRight
  if (innerWidth <= 0) return null

  const guides: Guide[] = Array.from({ length: COLUMNS + 1 }, (_, index) => ({
    x: innerLeft + (innerWidth * index) / COLUMNS,
    edge: index === 0 || index === COLUMNS,
  }))

  const body = document.querySelector<HTMLElement>('main p')
  const baseline = body ? Math.round(parseFloat(getComputedStyle(body).lineHeight) || 0) : 0

  const scale = ROWS.flatMap((row) => {
    const element = document.querySelector<HTMLElement>(row.selector)
    if (!element) return []
    const computed = getComputedStyle(element)
    return [
      {
        label: row.label,
        size: px(computed.fontSize),
        leading: px(computed.lineHeight),
      },
    ]
  })

  return {
    viewport: `${window.innerWidth} × ${window.innerHeight}`,
    frame: Math.round(rect.width),
    measure: Math.round(innerWidth),
    gutter: Math.round(rect.left + paddingLeft),
    baseline: baseline || 24,
    guides,
    scale,
  }
}

export default function Blueprint() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<Measure | null>(null)

  const enter = useCallback(() => setOpen(true), [])

  useShortcuts([{ ...bindingOf('grid'), run: enter }])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(BLUEPRINT_EVENT, onOpen)
    return () => window.removeEventListener(BLUEPRINT_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!open) return
    markEggFound('grid')

    const remeasure = () => setData(measure())
    remeasure()

    window.addEventListener('resize', remeasure)

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      window.removeEventListener('resize', remeasure)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  if (!open || !data) return null

  return (
    <div className="fixed inset-0 z-[80]">
      {/* The scrim sits under the page's own content, and takes no clicks. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-paper/55 animate-fade-in" />

      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        {/* Vertical guides. They do not move when the page scrolls. */}
        {data.guides.map((guide) => (
          <div
            key={guide.x}
            className={`absolute top-0 h-full w-px origin-top animate-rules-in ${
              guide.edge ? 'bg-accent/70' : 'bg-rule/25'
            }`}
            style={{ left: `${guide.x}px` }}
          />
        ))}

        {/* The baseline: every line of copy lands on one of these. */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `repeating-linear-gradient(to bottom, rgb(var(--rule) / 0.14) 0 1px, transparent 1px ${data.baseline}px)`,
          }}
        />
      </div>

      <div
        role="dialog"
        aria-label={t('grid.palette')}
        className="pointer-events-auto absolute right-4 top-4 w-[19rem] max-w-[92vw] rounded-sm border border-rule/25 bg-paper p-4 shadow-2xl animate-fade-in"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
              {t('grid.palette')}
            </p>
            <p className="mt-2 font-mono text-[10px] leading-relaxed text-muted">{t('grid.hint')}</p>
          </div>
          <button
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
          {[
            { label: 'Viewport', value: data.viewport },
            { label: 'Frame', value: `${data.frame}px` },
            { label: 'Measure', value: `${data.measure}px` },
            { label: 'Gutter', value: `${data.gutter}px` },
            { label: 'Baseline', value: `${data.baseline}px` },
          ].map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-1.5">
              <dt className="uppercase tracking-[0.14em] text-muted">{row.label}</dt>
              <dd className="tabular text-ink/90">{row.value}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.14em] text-muted">Type scale</p>
        <dl className="mt-1.5 divide-y divide-rule/15 font-mono text-[10px]">
          {data.scale.map((row) => (
            <div key={row.label} className="flex items-baseline justify-between gap-4 py-1">
              <dt className="uppercase tracking-[0.14em] text-muted">{row.label}</dt>
              <dd className="tabular text-ink/90">
                {row.size}
                <span className="text-muted">/{row.leading}</span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  )
}
