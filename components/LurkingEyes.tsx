'use client'

import { useEffect, useRef, useState } from 'react'

/** The furthest a pupil can travel from the centre of its eye. */
const MAX_LOOK = 5

/**
 * Two small eyes for the page furniture.
 *
 * They are decoration, not a control: no copy, no tab stop, no announcement.
 * A single pointer listener feeds a small rAF loop so the pupils ease toward
 * the cursor instead of jumping there, and a random blink keeps them from
 * feeling like a pair of pinned dots. Visitors who ask for reduced motion get
 * no blinking and no easing, but the pupils still answer the pointer directly:
 * that movement is driven by the visitor rather than played at them.
 */
export default function LurkingEyes() {
  const rootRef = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<number | null>(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const [blinking, setBlinking] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)')
    const sync = () => setReducedMotion(query.matches)

    sync()
    query.addEventListener('change', sync)
    return () => query.removeEventListener('change', sync)
  }, [])

  useEffect(() => {
    const root = rootRef.current
    if (!root) return

    const commit = (x: number, y: number) => {
      currentRef.current = { x, y }
      root.style.setProperty('--eye-x', `${x.toFixed(2)}px`)
      root.style.setProperty('--eye-y', `${y.toFixed(2)}px`)
    }

    if (reducedMotion) {
      const target = targetRef.current
      commit(target.x, target.y)
    }

    let lastPointer: { x: number; y: number } | null = null

    const paint = () => {
      frameRef.current = null
      const target = targetRef.current
      const current = currentRef.current
      const x = current.x + (target.x - current.x) * 0.2
      const y = current.y + (target.y - current.y) * 0.2

      commit(x, y)

      if (Math.abs(target.x - x) > 0.05 || Math.abs(target.y - y) > 0.05) {
        frameRef.current = window.requestAnimationFrame(paint)
      }
    }

    const aim = (clientX: number, clientY: number) => {
      const bounds = root.getBoundingClientRect()
      const dx = clientX - (bounds.left + bounds.width / 2)
      const dy = clientY - (bounds.top + bounds.height / 2)
      const distance = Math.hypot(dx, dy)

      if (distance < 8) {
        targetRef.current = { x: 0, y: 0 }
      } else {
        const reach = Math.min(distance / 140, 1)
        const look = MAX_LOOK * reach
        targetRef.current = { x: (dx / distance) * look, y: (dy / distance) * look }
      }

      if (reducedMotion) {
        const target = targetRef.current
        commit(target.x, target.y)
      } else if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(paint)
      }
    }

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch') return
      lastPointer = { x: event.clientX, y: event.clientY }
      aim(event.clientX, event.clientY)
    }

    // If the page moves under a still pointer, the gaze should follow the page
    // rather than stay pointed at the space the cursor used to occupy.
    const reaim = () => {
      if (lastPointer) aim(lastPointer.x, lastPointer.y)
    }

    window.addEventListener('pointermove', onPointerMove, { passive: true })
    window.addEventListener('scroll', reaim, { passive: true })
    window.addEventListener('resize', reaim)

    return () => {
      window.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('scroll', reaim)
      window.removeEventListener('resize', reaim)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [reducedMotion])

  useEffect(() => {
    if (reducedMotion) {
      setBlinking(false)
      return
    }

    let active = true
    let closeTimer: number | undefined
    let nextTimer: number | undefined

    const schedule = () => {
      nextTimer = window.setTimeout(() => {
        if (!active) return
        setBlinking(true)

        closeTimer = window.setTimeout(() => {
          if (!active) return
          setBlinking(false)
          schedule()
        }, 110)
      }, 4200 + Math.random() * 4200)
    }

    schedule()

    return () => {
      active = false
      if (nextTimer) window.clearTimeout(nextTimer)
      if (closeTimer) window.clearTimeout(closeTimer)
    }
  }, [reducedMotion])

  return (
    <span
      ref={rootRef}
      data-lurking-eyes
      aria-hidden="true"
      className="inline-flex items-center gap-[5px]"
    >
      {[0, 1].map((eye) => (
        <span
          key={eye}
          className={`relative grid place-items-center rounded-[50%] border border-rule/40 bg-paper transition-transform duration-100 ease-out ${
            eye === 0 ? 'h-[18px] w-[24px]' : 'h-[16px] w-[22px]'
          } ${blinking ? 'scale-y-[0.08]' : 'scale-y-100'}`}
        >
          <span
            className="relative h-2 w-2 rounded-full bg-ink ring-1 ring-paper"
            style={{ transform: 'translate3d(var(--eye-x, 0px), var(--eye-y, 0px), 0)' }}
          >
            <span className="absolute left-px top-px h-0.5 w-0.5 rounded-full bg-paper" />
          </span>
        </span>
      ))}
    </span>
  )
}
