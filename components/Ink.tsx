'use client'

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Eraser, X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { bindingOf, markEggFound } from '@/lib/eggs'
import { INK_EVENT } from '@/lib/secrets'
import { lockScroll, unlockScroll } from '@/lib/scrollLock'
import { useShortcuts } from '@/lib/shortcuts'

/**
 * Ink: a pencil laid over the page.
 *
 * Nothing is stored. The canvas exists while the mode is open and is thrown
 * away when it closes, which is the honest version of "draw on my site": a
 * sheet you can mark up and then leave as you found it. The stroke list is kept
 * so a resize or a rotation can replay the drawing instead of quietly wiping
 * it, which is the one bug a plain canvas always has.
 */

interface Stroke {
  points: { x: number; y: number }[]
  width: number
}

/** Cap the ratio: a 3× phone would otherwise allocate a very large canvas. */
const MAX_DPR = 2
const INK_WIDTH = 2.2

/** The site's own accent, read as the canvas needs a concrete colour. */
function inkColour(): string {
  const value = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
  if (!value) return '#0369a1'
  return `rgb(${value.split(/\s+/).join(', ')})`
}

function trace(ctx: CanvasRenderingContext2D, stroke: Stroke, colour: string) {
  const { points, width } = stroke
  ctx.lineWidth = width
  ctx.strokeStyle = colour
  ctx.fillStyle = colour

  if (points.length === 1) {
    ctx.beginPath()
    ctx.arc(points[0].x, points[0].y, width / 2, 0, Math.PI * 2)
    ctx.fill()
    return
  }

  // Quadratic through the midpoints: the pen turns corners the way a pen does
  // rather than the way a polyline does.
  ctx.beginPath()
  ctx.moveTo(points[0].x, points[0].y)
  for (let i = 1; i < points.length - 1; i += 1) {
    const next = points[i + 1]
    ctx.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + next.x) / 2, (points[i].y + next.y) / 2)
  }
  const last = points[points.length - 1]
  ctx.lineTo(last.x, last.y)
  ctx.stroke()
}

export default function Ink() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [hasInk, setHasInk] = useState(false)

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const strokesRef = useRef<Stroke[]>([])
  const activeRef = useRef<Stroke | null>(null)
  const frameRef = useRef<number | null>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  const enter = useCallback(() => setOpen(true), [])

  useShortcuts([{ ...bindingOf('ink'), run: enter }])

  useEffect(() => {
    const onOpen = () => setOpen(true)
    window.addEventListener(INK_EVENT, onOpen)
    return () => window.removeEventListener(INK_EVENT, onOpen)
  }, [])

  const redraw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const ratio = canvas.width / window.innerWidth || 1
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

    // One style read per frame, not per stroke: this runs while drawing.
    const colour = inkColour()
    strokesRef.current.forEach((stroke) => trace(ctx, stroke, colour))
    if (activeRef.current) trace(ctx, activeRef.current, colour)
  }, [])

  const schedule = useCallback(() => {
    if (frameRef.current !== null) return
    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = null
      redraw()
    })
  }, [redraw])

  const fit = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ratio = Math.min(window.devicePixelRatio || 1, MAX_DPR)
    canvas.width = Math.floor(window.innerWidth * ratio)
    canvas.height = Math.floor(window.innerHeight * ratio)
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    redraw()
  }, [redraw])

  useEffect(() => {
    if (!open) return

    markEggFound('ink')
    lockScroll()
    fit()
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('resize', fit)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('resize', fit)
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current)
      frameRef.current = null
      activeRef.current = null
      unlockScroll()
    }
  }, [open, fit])

  // Closing forgets the sheet: reopening is a new sheet of paper.
  useEffect(() => {
    if (open) return
    strokesRef.current = []
    setHasInk(false)
  }, [open])

  const point = (event: ReactPointerEvent<HTMLCanvasElement>) => ({
    x: event.clientX,
    y: event.clientY,
  })

  const start = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    try {
      // Capture keeps the pen drawing if the pointer leaves the window. It can
      // throw when the pointer is already gone; that is not a reason to lose
      // the stroke.
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Draw without capture.
    }
    activeRef.current = {
      points: [point(event)],
      // A pen can tell us how hard it is being pressed; a mouse cannot.
      width: event.pointerType === 'pen' ? INK_WIDTH + event.pressure * 2.4 : INK_WIDTH,
    }
    schedule()
  }

  const move = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!activeRef.current) return
    // Coalesced points are the ones the browser captured between frames, and
    // they are what keep a fast line from becoming a polygon.
    const coalesced =
      typeof event.nativeEvent.getCoalescedEvents === 'function'
        ? event.nativeEvent.getCoalescedEvents()
        : []
    // A browser is allowed to return none; the event itself is still a point.
    const events = coalesced.length > 0 ? coalesced : [event.nativeEvent]
    for (const raw of events) {
      activeRef.current.points.push({ x: raw.clientX, y: raw.clientY })
    }
    if (!hasInk) setHasInk(true)
    schedule()
  }

  const finish = () => {
    const stroke = activeRef.current
    activeRef.current = null
    if (!stroke) return
    strokesRef.current.push(stroke)
    setHasInk(true)
    schedule()
  }

  const clear = () => {
    activeRef.current = null
    strokesRef.current = []
    setHasInk(false)
    redraw()
  }

  if (!open) return null

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        onPointerDown={start}
        onPointerMove={move}
        onPointerUp={finish}
        onPointerCancel={finish}
        className="fixed inset-0 z-[85] cursor-crosshair touch-none"
      />

      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[87] flex justify-center px-4">
        <div
          role="toolbar"
          aria-label={t('ink.palette')}
          className="pointer-events-auto flex w-full max-w-xl animate-slide-up items-center gap-3 rounded-sm border border-rule/25 bg-paper px-3 py-2 shadow-xl sm:w-auto"
        >
          <span aria-hidden className="h-2.5 w-2.5 shrink-0 rounded-full bg-accent" />
          <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
            {t('ink.palette')}
          </span>
          <span aria-hidden className="hidden h-4 w-px shrink-0 bg-rule/20 sm:block" />
          <span className="hidden font-mono text-[10px] leading-relaxed text-muted sm:block">
            {t('ink.hint')}
          </span>

          <button
            type="button"
            onClick={clear}
            disabled={!hasInk}
            className="ml-auto inline-flex shrink-0 items-center gap-1.5 rounded-sm border border-rule/25 px-2 py-1 font-mono text-[11px] transition-colors hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-rule/25 disabled:hover:text-ink/85"
          >
            <Eraser className="h-3 w-3" />
            {t('ink.clear')}
          </button>
          <button
            ref={closeRef}
            type="button"
            onClick={() => setOpen(false)}
            aria-label={t('egg.close')}
            title={t('egg.close')}
            className="shrink-0 rounded-sm border border-rule/25 p-1.5 text-muted transition-colors hover:border-accent hover:text-accent"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  )
}
