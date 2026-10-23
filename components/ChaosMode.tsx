'use client'

import { useEffect, useRef, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { useShortcuts } from '@/lib/shortcuts'
import { bindingOf, markEggFound } from '@/lib/eggs'

const OPEN_EVENT = 'portfolio:start-chaos'

/** The command palette starts the mode through this. */
export function startChaos() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

/** Per-frame drag on a flung piece. Lower is a quicker stop. */
const FRICTION = 0.955
/** Below this many pixels per frame a piece has come to rest. */
const MIN_SPEED = 0.25
/** Under this much travel the gesture was a click, not a drag. */
const DRAG_THRESHOLD = 6
/** How much of a piece has to be off-screen before it counts as thrown out. */
const OUT_RATIO = 0.15

interface Piece {
  element: HTMLElement
  /** The inline style from before we touched it, so restoring is exact. */
  original: string
  x: number
  y: number
  rotation: number
  velocityX: number
  velocityY: number
  pointerId: number | null
  grabX: number
  grabY: number
  samples: { x: number; y: number; time: number }[]
  frame: number | null
  moved: boolean
  gone: boolean
}

/**
 * Opt-in chaos: reached by ⇧⌘X or from the command palette, every section and
 * the footer become draggable, and a hard enough throw carries them off the
 * page entirely.
 *
 * It is deliberately opt-in and it always leaves a way back. The navbar, the
 * HUD and the site's own links stay put, so a visitor who lands here by
 * accident is never stranded on a blank page, and the mode restores every
 * element's original inline style rather than trying to undo its own effects.
 */
export default function ChaosMode() {
  const { t } = useLanguage()
  const [active, setActive] = useState(false)
  const [remaining, setRemaining] = useState(0)
  const [total, setTotal] = useState(0)

  const restoreRef = useRef<() => void>(() => {})

  useShortcuts([{ ...bindingOf('chaos'), run: () => setActive(true) }])

  useEffect(() => {
    const onOpen = () => setActive(true)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => window.removeEventListener(OPEN_EVENT, onOpen)
  }, [])

  // Found is found however it was reached - chord, palette, or another tab.
  useEffect(() => {
    if (active) markEggFound('chaos')
  }, [active])

  useEffect(() => {
    if (!active) return

    const elements = Array.from(
      document.querySelectorAll<HTMLElement>('#main > *')
    ).concat(Array.from(document.querySelectorAll<HTMLElement>('footer')))

    const pieces: Piece[] = elements.map((element) => ({
      element,
      original: element.style.cssText,
      x: 0,
      y: 0,
      rotation: 0,
      velocityX: 0,
      velocityY: 0,
      pointerId: null,
      grabX: 0,
      grabY: 0,
      samples: [],
      frame: null,
      moved: false,
      gone: false,
    }))

    setTotal(pieces.length)
    setRemaining(pieces.length)

    const apply = (piece: Piece) => {
      piece.element.style.transform = `translate3d(${piece.x}px, ${piece.y}px, 0) rotate(${piece.rotation}deg)`
    }

    /**
     * A piece counts as thrown out once it has been moved and is essentially
     * off-screen. The displacement test is what keeps a section that merely
     * scrolled past the viewport from being counted as thrown away.
     */
    const isGone = (piece: Piece) => {
      const rect = piece.element.getBoundingClientRect()
      const displaced = Math.abs(piece.x) + Math.abs(piece.y) > 60
      if (!displaced) return false

      const fullyOut =
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      if (fullyOut) return true

      const overlapWidth = Math.max(0, Math.min(rect.right, window.innerWidth) - Math.max(rect.left, 0))
      const overlapHeight = Math.max(0, Math.min(rect.bottom, window.innerHeight) - Math.max(rect.top, 0))
      const area = Math.max(1, rect.width * rect.height)
      return (overlapWidth * overlapHeight) / area < OUT_RATIO
    }

    const recount = () => setRemaining(pieces.filter((piece) => !piece.gone).length)

    const settle = (piece: Piece) => {
      const next = isGone(piece)
      if (next === piece.gone) return
      piece.gone = next
      recount()
    }

    const launch = (piece: Piece) => {
      const step = () => {
        piece.velocityX *= FRICTION
        piece.velocityY *= FRICTION
        piece.x += piece.velocityX
        piece.y += piece.velocityY
        piece.rotation += piece.velocityX * 0.06
        apply(piece)

        if (Math.hypot(piece.velocityX, piece.velocityY) > MIN_SPEED) {
          piece.frame = requestAnimationFrame(step)
        } else {
          piece.frame = null
          settle(piece)
        }
      }

      if (Math.hypot(piece.velocityX, piece.velocityY) > MIN_SPEED) {
        piece.frame = requestAnimationFrame(step)
      } else {
        settle(piece)
      }
    }

    const restore = () => {
      for (const piece of pieces) {
        if (piece.frame !== null) cancelAnimationFrame(piece.frame)
        piece.frame = null
        piece.x = 0
        piece.y = 0
        piece.rotation = 0
        piece.velocityX = 0
        piece.velocityY = 0
        piece.pointerId = null
        piece.gone = false
        piece.element.style.cssText = piece.original
      }
      recount()
    }
    restoreRef.current = restore

    /**
     * A drag must not also follow the link it started on.
     */
    let suppressClicksUntil = 0
    const onClickCapture = (event: MouseEvent) => {
      if (performance.now() < suppressClicksUntil) {
        event.preventDefault()
        event.stopPropagation()
      }
    }
    document.addEventListener('click', onClickCapture, true)

    const detach: (() => void)[] = []

    for (const piece of pieces) {
      const { element } = piece

      element.style.touchAction = 'none'
      element.style.cursor = 'grab'
      element.style.willChange = 'transform'

      const onPointerDown = (event: PointerEvent) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        piece.pointerId = event.pointerId
        piece.moved = false
        piece.grabX = event.clientX - piece.x
        piece.grabY = event.clientY - piece.y
        piece.velocityX = 0
        piece.velocityY = 0
        piece.samples = [{ x: event.clientX, y: event.clientY, time: performance.now() }]
        if (piece.frame !== null) {
          cancelAnimationFrame(piece.frame)
          piece.frame = null
        }
        element.style.cursor = 'grabbing'
        element.style.zIndex = '60'
        try {
          element.setPointerCapture(event.pointerId)
        } catch {
          // Pointer capture needs a live pointer; a synthesised event has none,
          // and some input types cannot be captured at all. Tracking still
          // works without it, so this is not worth failing the gesture over.
        }
      }

      const onPointerMove = (event: PointerEvent) => {
        if (piece.pointerId !== event.pointerId) return
        piece.x = event.clientX - piece.grabX
        piece.y = event.clientY - piece.grabY
        if (!piece.moved && Math.abs(piece.x) + Math.abs(piece.y) > DRAG_THRESHOLD) {
          piece.moved = true
        }
        piece.samples.push({ x: event.clientX, y: event.clientY, time: performance.now() })
        if (piece.samples.length > 6) piece.samples.shift()
        apply(piece)
      }

      const onPointerUp = (event: PointerEvent) => {
        if (piece.pointerId !== event.pointerId) return
        piece.pointerId = null
        element.style.cursor = 'grab'
        element.style.zIndex = ''

        const first = piece.samples[0]
        const last = piece.samples[piece.samples.length - 1]
        const elapsed = Math.max(1, last.time - first.time)
        // Pixels per 16ms frame, which is what the rAF loop integrates.
        piece.velocityX = ((last.x - first.x) / elapsed) * 16
        piece.velocityY = ((last.y - first.y) / elapsed) * 16

        if (piece.moved) suppressClicksUntil = performance.now() + 150
        launch(piece)
      }

      const onLostCapture = () => {
        if (piece.pointerId === null) return
        piece.pointerId = null
        element.style.cursor = 'grab'
        element.style.zIndex = ''
      }

      element.addEventListener('pointerdown', onPointerDown)
      element.addEventListener('pointermove', onPointerMove)
      element.addEventListener('pointerup', onPointerUp)
      element.addEventListener('pointercancel', onPointerUp)
      element.addEventListener('lostpointercapture', onLostCapture)

      detach.push(() => {
        element.removeEventListener('pointerdown', onPointerDown)
        element.removeEventListener('pointermove', onPointerMove)
        element.removeEventListener('pointerup', onPointerUp)
        element.removeEventListener('pointercancel', onPointerUp)
        element.removeEventListener('lostpointercapture', onLostCapture)
      })
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setActive(false)
    }
    document.addEventListener('keydown', onKeyDown)

    const previousSelect = document.body.style.userSelect
    const previousOverflowX = document.documentElement.style.overflowX
    document.body.style.userSelect = 'none'
    document.documentElement.style.overflowX = 'hidden'

    return () => {
      document.removeEventListener('click', onClickCapture, true)
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.userSelect = previousSelect
      document.documentElement.style.overflowX = previousOverflowX
      detach.forEach((fn) => fn())
      restore()
    }
  }, [active])

  if (!active) return null

  const empty = remaining === 0

  return (
    <div
      role="toolbar"
      aria-label={t('chaos.palette')}
      className="fixed bottom-4 left-1/2 z-[90] flex max-w-[94vw] -translate-x-1/2 flex-wrap items-center gap-x-3 gap-y-2 rounded-sm border border-rule/25 bg-paper px-3 py-2 shadow-2xl"
    >
      <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
      <p className="font-mono text-[11px] leading-snug text-muted">
        {empty ? t('chaos.empty') : t('chaos.hint')}
      </p>
      <span className="tabular font-mono text-[10px] text-muted">
        {remaining}/{total}
      </span>
      <button
        type="button"
        onClick={() => restoreRef.current()}
        className="inline-flex items-center gap-1.5 rounded-sm border border-rule/25 px-2 py-1 font-mono text-[11px] transition-colors hover:border-accent hover:text-accent"
      >
        <RotateCcw className="h-3 w-3" />
        {t('chaos.restore')}
      </button>
      <button
        type="button"
        onClick={() => setActive(false)}
        aria-label={t('chaos.close')}
        className="rounded-sm p-1 text-muted transition-colors hover:text-accent"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
