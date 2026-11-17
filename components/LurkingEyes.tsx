'use client'

import { useEffect, useId, useRef, useState } from 'react'

type EyeSize = 'sm' | 'md'

export type EyeTone = 'blue' | 'violet' | 'green' | 'brown' | 'hazel' | 'grey'

const tones: Record<EyeTone, { light: string; base: string; dark: string }> = {
  blue: { light: '#a6dcf2', base: '#4b8fb8', dark: '#205d80' },
  violet: { light: '#d8bdf2', base: '#8d67b7', dark: '#523a72' },
  green: { light: '#addcba', base: '#5b9774', dark: '#2d6046' },
  brown: { light: '#ddb383', base: '#9a6a42', dark: '#5b3820' },
  hazel: { light: '#dfd087', base: '#a3843d', dark: '#5d491d' },
  grey: { light: '#d5e0e6', base: '#8196a3', dark: '#485b67' },
}

const sizes = {
  sm: {
    eyes: [
      { width: 34, height: 26 },
      { width: 31, height: 24 },
    ],
    gap: 'gap-[5px]',
    lookX: 4.6,
    lookY: 2.2,
  },
  md: {
    eyes: [
      { width: 40, height: 31 },
      { width: 36, height: 28 },
    ],
    gap: 'gap-[6px]',
    lookX: 5.5,
    lookY: 2.6,
  },
}

const EYE_PATH =
  'M3 17 C8 9 17 5.5 26 6.3 C34 7 39.5 11.3 42 17 C36 23.7 25.5 25.8 16 24.4 C8.5 23.2 4.6 20.7 3 17 Z'

const BROW_PATH =
  'M6.2 0.4 C13.4 -2.9 22 -4 29.2 -3.2 C34.8 -2.6 39.2 -0.9 42 1.1 C38.2 0.3 34.3 -0.1 29.5 0 C21.5 0.2 13.4 0.6 7.4 1.5 C6.9 1.2 6.5 0.8 6.2 0.4 Z'

interface LurkingEyesProps {
  size?: EyeSize
  /** Iris colour, so pairs down the page do not all read the same. */
  tone?: EyeTone
  /** Mirror the pair, so repeated eyes do not all lean the same way. */
  flip?: boolean
}

/**
 * A pair of eyes that follows the pointer.
 *
 * They are decoration, not a control: no copy, no tab stop, no announcement.
 * The almond shape, lash line, small wing and arched brow keep them closer to
 * a drawn face than to two circles. A single pointer listener feeds a small
 * rAF loop so the irises ease toward the cursor instead of jumping there, and
 * a random blink
 * keeps them from feeling like pinned dots. Visitors who ask for reduced
 * motion get no blinking and no easing, but the irises still answer the
 * pointer directly: that movement is driven by the visitor rather than played
 * at them.
 */
export default function LurkingEyes({ size = 'md', tone = 'blue', flip = false }: LurkingEyesProps) {
  const rootRef = useRef<HTMLSpanElement>(null)
  const frameRef = useRef<number | null>(null)
  const targetRef = useRef({ x: 0, y: 0 })
  const currentRef = useRef({ x: 0, y: 0 })
  const [blinking, setBlinking] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  const rawId = useId().replace(/:/g, '')
  const clipId = `eye-clip-${rawId}`
  const irisId = `eye-iris-${rawId}`
  const palette = tones[tone]

  const geometry = sizes[size]
  const eyeShapes = flip
    ? [geometry.eyes[1], geometry.eyes[0]]
    : geometry.eyes

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
      // The left eye is drawn inside a mirrored group, so its horizontal
      // offset has to be mirrored as well or the pair crosses itself.
      root.style.setProperty('--eye-mirror-x', `${(-x).toFixed(2)}px`)
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
        targetRef.current = {
          x: (dx / distance) * geometry.lookX * reach,
          y: (dy / distance) * geometry.lookY * reach,
        }
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
  }, [geometry.lookX, geometry.lookY, reducedMotion])

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
        }, 120)
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
      data-eye-size={size}
      data-eye-tone={tone}
      aria-hidden="true"
      className={`inline-flex items-center ${geometry.gap}`}
    >
      <svg width="0" height="0" aria-hidden="true" className="absolute h-0 w-0">
        <defs>
          <radialGradient id={irisId} cx="34%" cy="28%" r="78%">
            <stop offset="0%" stopColor={palette.light} />
            <stop offset="58%" stopColor={palette.base} />
            <stop offset="100%" stopColor={palette.dark} />
          </radialGradient>
          <clipPath id={clipId}>
            <path d={EYE_PATH} />
          </clipPath>
        </defs>
      </svg>

      {eyeShapes.map((shape, eye) => (
        <span
          key={`${size}-${flip ? 'flipped' : 'forward'}-${eye}`}
          className={`block shrink-0 drop-shadow-[0_1px_1px_rgba(0,0,0,0.28)] transition-transform duration-100 ease-out ${
            blinking ? 'scale-y-[0.08]' : 'scale-y-100'
          }`}
          style={{ width: shape.width, height: shape.height }}
        >
          <svg viewBox="0 -4 44 34" className="h-full w-full" aria-hidden="true" focusable="false">
            <g transform={eye === 0 ? 'translate(44 0) scale(-1 1)' : undefined}>
              <path d={BROW_PATH} fill="#9b765f" opacity="0.9" />
              <path d={EYE_PATH} fill="#f8f4ea" stroke="#2f2822" strokeWidth="1.15" strokeLinejoin="round" />

              <g clipPath={`url(#${clipId})`}>
                <g
                  style={{
                    transform: `translate3d(${eye === 0 ? 'var(--eye-mirror-x, 0px)' : 'var(--eye-x, 0px)'}, var(--eye-y, 0px), 0)`,
                  }}
                >
                  <circle
                    cx="23"
                    cy="15.8"
                    r="8.2"
                    fill={`url(#${irisId})`}
                    stroke={palette.dark}
                    strokeWidth="0.7"
                  />
                  <circle cx="23" cy="15.8" r="3.9" fill="#0b0908" />
                  <circle cx="20.2" cy="12.2" r="1.9" fill="#fffdf8" opacity="0.92" />
                  <circle cx="26.8" cy="18.6" r="1" fill="#fffdf8" opacity="0.55" />
                </g>

                <path
                  d="M3.4 16.5 C10 8.6 20.4 5.6 29.5 6.8 C35 7.5 39.2 11 41.6 15.7 C35.5 10.8 28 8.8 20.2 9.3 C12.8 9.8 7 12.2 3.4 16.5 Z"
                  fill="#3a2b21"
                  opacity="0.14"
                />
              </g>

              <path
                d="M3 16.8 C10 7.6 21 4.6 30.5 6.2 C35.5 7 39.5 11 42 16.2"
                fill="none"
                stroke="#241c17"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <path
                d="M40.2 13.8 C41.8 11.6 43 9.9 43.6 8.2"
                fill="none"
                stroke="#241c17"
                strokeWidth="1.6"
                strokeLinecap="round"
              />
              <path
                d="M5.2 19.5 C11.5 24.6 23 26.1 33 22.9"
                fill="none"
                stroke="#3a3028"
                strokeWidth="0.8"
                strokeLinecap="round"
                opacity="0.45"
              />

              <path
                d="M31.6 6.8 L30.4 4.1 M36 7.8 L35.6 5.1 M40 10.2 L40.6 7.7"
                fill="none"
                stroke="#241c17"
                strokeWidth="1"
                strokeLinecap="round"
              />
            </g>
          </svg>
        </span>
      ))}
    </span>
  )
}
