'use client'

import type { ReactNode } from 'react'
import type { OsAppId } from '@/lib/os'

/**
 * The desktop's icon set, drawn inline.
 *
 * A real desktop is read before it is used: the Dock is a row of recognisable
 * pictures, not a row of labels. These are the site's five apps given the
 * shapes a Mac gives them - a blue folder, a terminal pane, a page, a metal
 * bin - without shipping an image or borrowing a system icon. Everything is
 * CSS and SVG, so the desktop still arrives as part of its own chunk.
 */

interface AppIconProps {
  app: OsAppId
  /** Rendered square, in pixels. The corner radius follows the size. */
  size?: number
  className?: string
}

/** The plate every icon but the bin sits on. */
function Plate({
  size,
  background,
  shadow = true,
  className = '',
  children,
}: {
  size: number
  background: string
  shadow?: boolean
  className?: string
  children: ReactNode
}) {
  return (
    <span
      aria-hidden
      className={`relative inline-grid shrink-0 place-items-center overflow-hidden ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: Math.round(size * 0.225),
        background,
        boxShadow: shadow
          ? 'inset 0 1px 0 rgba(255,255,255,0.42), inset 0 -1px 0 rgba(0,0,0,0.28), 0 2px 5px rgba(0,0,0,0.38)'
          : undefined,
      }}
    >
      {/* the glass highlight across the top half, as on a macOS icon */}
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-1/2"
        style={{
          borderRadius: `${Math.round(size * 0.225)}px ${Math.round(size * 0.225)}px 40% 40%`,
          background: 'linear-gradient(to bottom, rgba(255,255,255,0.22), rgba(255,255,255,0))',
        }}
      />
      {children}
    </span>
  )
}

export function AppIcon({ app, size = 46, className = '' }: AppIconProps) {
  if (app === 'trash') {
    return (
      <svg
        aria-hidden
        width={size}
        height={size}
        viewBox="0 0 48 48"
        className={`shrink-0 ${className}`}
      >
        {/* lid */}
        <rect x="10" y="12.5" width="28" height="3.6" rx="1.8" fill="#d9dbe1" />
        <rect x="18" y="8.5" width="12" height="4" rx="2" fill="#c3c6cd" />
        <path d="M11.5 16.5h25l-2.4 23.2a3.6 3.6 0 0 1-3.6 3.3H17.5a3.6 3.6 0 0 1-3.6-3.3L11.5 16.5Z" fill="#c9ccd4" />
        {/* the two darker walls give the bin its depth */}
        <path d="M14 18h3.2l1.6 21.5h-1.6A2.6 2.6 0 0 1 14.6 37L14 18Z" fill="#aeb2bb" opacity="0.75" />
        <path d="M34 18h-3.2l-1.6 21.5h1.6a2.6 2.6 0 0 1 2.6-2.5L34 18Z" fill="#9ea3ad" opacity="0.7" />
        {/* ridges */}
        <g stroke="#8b909a" strokeWidth="1.2" strokeLinecap="round" opacity="0.7">
          <path d="M19 22v14.5M23 22v15.5M27 22v15.5M31 22v14.5" />
        </g>
        <rect x="16.5" y="13.9" width="15" height="1.1" rx="0.55" fill="#eef0f4" opacity="0.7" />
      </svg>
    )
  }

  if (app === 'projects') {
    return (
      <Plate size={size} background="linear-gradient(150deg, #63b5ff 0%, #2589ef 46%, #0a58c2 100%)" className={className}>
        <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
          <path
            d="M3.2 7.6a2.1 2.1 0 0 1 2.1-2.1h3.2l1.7 1.9h7.4a2.1 2.1 0 0 1 2.1 2.1v7.3a2.1 2.1 0 0 1-2.1 2.1H5.3a2.1 2.1 0 0 1-2.1-2.1V7.6Z"
            fill="white"
            fillOpacity="0.94"
          />
          <path d="M3.2 9.8h16.6" stroke="#0b4fa8" strokeOpacity="0.28" strokeWidth="1" />
        </svg>
      </Plate>
    )
  }

  if (app === 'terminal') {
    return (
      <Plate size={size} background="linear-gradient(155deg, #4a4a50 0%, #26262a 48%, #141416 100%)" className={className}>
        <span
          className="font-mono font-semibold text-white/95"
          style={{ fontSize: size * 0.3, letterSpacing: '-0.06em' }}
        >
          &gt;_
        </span>
      </Plate>
    )
  }

  if (app === 'about') {
    return (
      <Plate size={size} background="linear-gradient(155deg, #ffffff 0%, #e9e9ee 55%, #cfd0d6 100%)" className={className}>
        <span
          className="font-semibold text-[#1c1c1e]"
          style={{ fontSize: size * 0.27, letterSpacing: '-0.02em' }}
        >
          AR
        </span>
      </Plate>
    )
  }

  // resume
  return (
    <Plate size={size} background="linear-gradient(155deg, #ffffff 0%, #f1f1f4 55%, #d6d7dd 100%)" className={className}>
      <svg width={size * 0.58} height={size * 0.58} viewBox="0 0 24 24" fill="none">
        <path
          d="M6 3.2h8.1L19 8.1v12.7H6V3.2Z"
          fill="#fbfbfd"
          stroke="#b9bbc3"
          strokeWidth="0.9"
        />
        <path d="M14.1 3.2V8h4.9" fill="#e7e8ec" stroke="#b9bbc3" strokeWidth="0.9" />
        <path d="M8.6 11.4h7.8M8.6 13.8h7.8M8.6 16.2h5.2" stroke="#9599a3" strokeWidth="1" strokeLinecap="round" />
        <rect x="12.6" y="17.6" width="8" height="4" rx="1" fill="#e5484d" />
        <text x="16.6" y="20.6" textAnchor="middle" fontSize="2.7" fontWeight="700" fill="white" fontFamily="monospace">
          PDF
        </text>
      </svg>
    </Plate>
  )
}

/** The menu bar's battery, drawn to the proportions macOS uses. */
export function BatteryGlyph() {
  return (
    <svg aria-hidden width="23" height="11" viewBox="0 0 23 11" fill="none">
      <rect x="0.5" y="0.5" width="19" height="10" rx="2.6" stroke="currentColor" strokeOpacity="0.55" />
      <rect x="2.1" y="2.1" width="14.2" height="6.8" rx="1.4" fill="currentColor" />
      <path d="M21 3.7v3.6a1.8 1.8 0 0 0 0-3.6Z" fill="currentColor" fillOpacity="0.55" />
    </svg>
  )
}
