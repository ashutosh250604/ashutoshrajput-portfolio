'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
// Imported as a namespace for its event and style types; the DOM's own event
// types are used unqualified alongside them.
import type * as React from 'react'
import {
  FileText,
  Folder,
  Info,
  Maximize2,
  Minimize2,
  Minus,
  Power,
  RotateCcw,
  Terminal as TerminalIcon,
  Trash2,
  X,
} from 'lucide-react'
import { lockScroll, unlockScroll } from '@/lib/scrollLock'
import { useShortcuts } from '@/lib/shortcuts'
import { bindingOf, markEggFound } from '@/lib/eggs'
import { useLocalTime } from '@/lib/localTime'
import { OS_CLOSE_EVENT, OS_EVENT, type OsAppId } from '@/lib/os'
import { useLanguage } from '@/contexts/LanguageContext'
import { AboutApp, ProjectsApp, ResumeApp, TerminalApp, TrashApp } from './MiniOSApps'

type PowerState = 'booting' | 'running' | 'off'

interface OsWindow {
  id: number
  app: OsAppId
  /** Position and size of the window, inside the desktop area. */
  x: number
  y: number
  width: number
  height: number
  z: number
  zoomed: boolean
  minimised: boolean
}

interface AppMeta {
  id: OsAppId
  labelKey: string
  icon: typeof Folder
  width: number
  height: number
  minWidth: number
  minHeight: number
}

/** Menu bar and dock reserve their own space; windows live between them. */
const BAR = 34
const DOCK = 76
/** Long enough to read the word "starting", short enough not to be a wait. */
const BOOT_MS = 1600
/** Arrow keys move a window by this much, four times that with shift. */
const NUDGE = 16
/** Below this width the desktop fills the screen instead of floating windows. */
const COMPACT = 640

const APPS: AppMeta[] = [
  { id: 'projects', labelKey: 'nav.projects', icon: Folder, width: 440, height: 400, minWidth: 300, minHeight: 240 },
  { id: 'terminal', labelKey: 'os.terminal', icon: TerminalIcon, width: 560, height: 380, minWidth: 340, minHeight: 240 },
  { id: 'about', labelKey: 'about.title', icon: Info, width: 430, height: 420, minWidth: 300, minHeight: 260 },
  { id: 'resume', labelKey: 'hero.resume', icon: FileText, width: 400, height: 300, minWidth: 300, minHeight: 220 },
  { id: 'trash', labelKey: 'os.trash', icon: Trash2, width: 380, height: 260, minWidth: 280, minHeight: 200 },
]

const APP_IDS = APPS.map((entry) => entry.id)

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), Math.max(low, high))

/** The space between the menu bar and the dock, in viewport coordinates. */
function desktopArea() {
  return {
    width: window.innerWidth,
    height: Math.max(200, window.innerHeight - BAR - DOCK),
  }
}

/**
 * One screen at a time: a phone in either orientation, or a browser window too
 * short for two floating plates to tell each other apart.
 */
function isCompact() {
  return window.innerWidth < COMPACT || desktopArea().height < 420
}

/**
 * A desktop, hidden behind ⇧⌘O.
 *
 * It is built from the site's own parts rather than as a macOS imitation: the
 * windows are hairline-ruled plates, the labels are monospace metadata, and
 * every app reads data/projects.ts, data/skills.ts and data/socials.ts - the
 * same files the sections and the resume read. The screen is dark in both
 * themes on purpose: it is a screen, and one fixed palette keeps the window
 * chrome measurable instead of doubling the contrast surface.
 *
 * It is a modal toy, so it gives three ways out (Escape, the menu bar's power
 * button, and the launcher's own item) and it hands the page back exactly as it
 * found it.
 */
export default function MiniOS() {
  const { t } = useLanguage()
  const clock = useLocalTime({ hour: '2-digit', minute: '2-digit' })
  const today = useLocalTime({ weekday: 'short', day: '2-digit', month: 'short' })

  const [open, setOpen] = useState(false)
  const [power, setPower] = useState<PowerState>('booting')
  const [windows, setWindows] = useState<OsWindow[]>([])
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [compact, setCompact] = useState(() =>
    typeof window === 'undefined' ? false : isCompact()
  )

  const nextId = useRef(1)
  const topZ = useRef(10)
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null)
  const resizeRef = useRef<{ id: number; startX: number; startY: number; width: number; height: number } | null>(
    null
  )
  const shellRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const leave = useCallback(() => {
    setLauncherOpen(false)
    setOpen(false)
  }, [])

  const enter = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement | null
    setWindows([])
    setLauncherOpen(false)
    setPower('booting')
    setOpen(true)
    markEggFound('os')
  }, [])

  /**
   * A power change starts from a clean machine. Windows otherwise outlive
   * `setPower` entirely, so a restart brought the previous session back - the
   * one thing a restart is supposed to clear.
   */
  const powerTo = useCallback((next: PowerState) => {
    setLauncherOpen(false)
    setWindows([])
    setPower(next)
  }, [])

  // The back door: ⇧⌘O anywhere on the page. Pressing it again while the
  // desktop is up should not restart the session.
  useShortcuts([
    {
      ...bindingOf('os'),
      run: () => {
        if (!open) enter()
      },
    },
  ])

  useEffect(() => {
    const onOpen = () => {
      // The event is the palette's door, and the palette already closed itself.
      // Ringing it while the desktop is up must not restart the session.
      if (!open) enter()
    }
    window.addEventListener(OS_EVENT, onOpen)
    window.addEventListener(OS_CLOSE_EVENT, leave)
    return () => {
      window.removeEventListener(OS_EVENT, onOpen)
      window.removeEventListener(OS_CLOSE_EVENT, leave)
    }
  }, [enter, leave, open])

  useEffect(() => {
    if (!open || power !== 'booting') return
    const timer = setTimeout(() => setPower('running'), BOOT_MS)
    return () => clearTimeout(timer)
  }, [open, power])

  // Monopolise the page while the desktop is up, then hand it back.
  useEffect(() => {
    if (!open) return

    lockScroll()
    shellRef.current?.focus()

    return () => {
      unlockScroll()
      previousFocus.current?.focus()
    }
  }, [open])

  // The desktop is a screen, not a layer: the page's own shortcuts stay quiet
  // while it is up (see lib/shortcuts.ts), and they come back on the way out.
  useEffect(() => {
    if (!open) return
    document.body.dataset.desktop = 'open'
    return () => {
      delete document.body.dataset.desktop
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return

      // The command palette can sit above the desktop. If it holds the
      // keyboard, Escape belongs to it, not to us.
      const focused = document.activeElement as HTMLElement | null
      if (focused && !shellRef.current?.contains(focused) && focused.closest('[role="dialog"]')) {
        return
      }

      // The launcher closes first: it is the most recent thing opened.
      if (launcherOpen) setLauncherOpen(false)
      else leave()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, launcherOpen, leave])

  // A desktop is a resizable thing too: keep every window inside the screen
  // when the visitor turns a phone or drags the browser narrower.
  useEffect(() => {
    if (!open) return

    const fit = () => {
      const area = desktopArea()
      setCompact(isCompact())

      setWindows((previous) =>
        previous.map((entry) => {
          const width = Math.min(entry.width, area.width - 16)
          const height = Math.min(entry.height, area.height - 16)
          return {
            ...entry,
            width,
            height,
            x: clamp(entry.x, -width + 160, area.width - 80),
            y: clamp(entry.y, 0, area.height - 40),
          }
        })
      )
    }

    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [open])

  const focusWindow = useCallback((id: number) => {
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, z: (topZ.current += 1) } : entry))
    )
  }, [])

  const openApp = useCallback((app: OsAppId) => {
    setLauncherOpen(false)

    // A phone has one screen, so the desktop does too: opening another app
    // replaces the one in front rather than stacking an identical full-screen
    // window behind it, where it looks like the tap did nothing.
    const single = isCompact()

    setWindows((previous) => {
      const existing = previous.find((entry) => entry.app === app)
      if (existing) {
        const kept = single ? previous.filter((entry) => entry.app === app) : previous
        return kept.map((entry) =>
          entry.id === existing.id
            ? { ...entry, minimised: false, z: (topZ.current += 1) }
            : entry
        )
      }

      const meta = APPS.find((entry) => entry.id === app)!
      const area = desktopArea()
      const small = single
      const width = small ? area.width - 16 : Math.min(meta.width, area.width - 40)
      const height = small ? area.height - 16 : Math.min(meta.height, area.height - 32)
      const base = single ? [] : previous
      // Cascade, so a second window never lands exactly on the first.
      const step = (base.length % 5) * 24
      // Keep the floating windows clear of the shortcut column on the left.
      const preferredX = Math.round((area.width - width) / 2) - 60 + step
      const maxX = Math.max(12, area.width - width - 12)
      const minX = Math.min(96, maxX)

      return [
        ...base,
        {
          id: (nextId.current += 1),
          app,
          x: small ? 8 : clamp(preferredX, minX, maxX),
          y: small ? 8 : clamp(Math.round((area.height - height) / 2) + step, 10, area.height - height - 10),
          width,
          height,
          z: (topZ.current += 1),
          zoomed: small,
          minimised: false,
        },
      ]
    })
  }, [])

  const closeWindow = useCallback((id: number) => {
    setWindows((previous) => previous.filter((entry) => entry.id !== id))
    // The focused control may have been inside the window that just went away.
    shellRef.current?.focus()
  }, [])

  const minimiseWindow = (id: number) => {
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, minimised: true } : entry))
    )
    // The button that was pressed has just left the screen; without this the
    // caret falls to the document body and Tab can walk into the page behind.
    shellRef.current?.focus()
  }

  const zoomWindow = (id: number) =>
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, zoomed: !entry.zoomed } : entry))
    )

  const moveWindow = (id: number, x: number, y: number) =>
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, x, y } : entry))
    )

  /** The dock's behaviour: restore, raise, or put away what is already in front. */
  const pressDock = (app: OsAppId) => {
    const entry = windows.find((item) => item.app === app)
    if (!entry) return openApp(app)
    if (entry.minimised) return openApp(app)

    const front = windows
      .filter((item) => !item.minimised)
      .reduce<OsWindow | null>((top, item) => (!top || item.z > top.z ? item : top), null)
    if (front?.id === entry.id) return minimiseWindow(entry.id)
    openApp(app)
  }

  const onTitlePointerDown = (event: React.PointerEvent<HTMLDivElement>, entry: OsWindow) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    // The traffic lights are controls, not a drag handle.
    if ((event.target as HTMLElement).closest('button')) return
    if (entry.zoomed || compact) return

    dragRef.current = { id: entry.id, dx: event.clientX - entry.x, dy: event.clientY - entry.y }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Needs a live pointer; a synthesised event has none.
    }
    focusWindow(entry.id)
  }

  const onTitlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current
    if (!drag) return

    setWindows((previous) =>
      previous.map((entry) => {
        if (entry.id !== drag.id) return entry
        const area = desktopArea()
        return {
          ...entry,
          // Never fully off-screen: the title bar has to stay grabbable.
          x: clamp(event.clientX - drag.dx, -entry.width + 160, area.width - 80),
          y: clamp(event.clientY - drag.dy, 0, area.height - 40),
        }
      })
    )
  }

  const onTitlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = null
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      // Already released, or never captured.
    }
  }

  /** Same movement, from the keyboard, on the title bar itself. */
  const onTitleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, entry: OsWindow) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      zoomWindow(entry.id)
      return
    }

    const distance = event.shiftKey ? NUDGE * 4 : NUDGE
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-distance, 0],
      ArrowRight: [distance, 0],
      ArrowUp: [0, -distance],
      ArrowDown: [0, distance],
    }
    const move = moves[event.key]
    if (!move) return

    event.preventDefault()
    focusWindow(entry.id)
    const area = desktopArea()
    moveWindow(
      entry.id,
      clamp(entry.x + move[0], -entry.width + 160, area.width - 80),
      clamp(entry.y + move[1], 0, area.height - 40)
    )
  }

  const onResizePointerDown = (event: React.PointerEvent<HTMLSpanElement>, entry: OsWindow) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    event.preventDefault()
    resizeRef.current = {
      id: entry.id,
      startX: event.clientX,
      startY: event.clientY,
      width: entry.width,
      height: entry.height,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Tracking still works through the element's own move events.
    }
    focusWindow(entry.id)
  }

  const onResizePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    const resize = resizeRef.current
    if (!resize) return

    const area = desktopArea()
    setWindows((previous) =>
      previous.map((entry) => {
        if (entry.id !== resize.id) return entry
        const meta = APPS.find((app) => app.id === entry.app)!
        return {
          ...entry,
          width: clamp(resize.width + (event.clientX - resize.startX), meta.minWidth, area.width - entry.x - 8),
          height: clamp(resize.height + (event.clientY - resize.startY), meta.minHeight, area.height - entry.y - 8),
        }
      })
    )
  }

  if (!open) return null

  const focused = windows
    .filter((entry) => !entry.minimised)
    .reduce<OsWindow | null>((top, entry) => (!top || entry.z > top.z ? entry : top), null)
  const focusedLabel = focused ? t(APPS.find((entry) => entry.id === focused.app)!.labelKey) : t('os.palette')
  const frontId = focused?.id
  const runningApps = new Set(windows.map((entry) => entry.app))

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t('os.palette')}
      ref={shellRef}
      tabIndex={-1}
      onKeyDown={(event) => {
        // Keep Tab inside: the page behind the desktop is still in the DOM.
        if (event.key !== 'Tab') return
        const focusable = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button, a[href], input, [tabindex]:not([tabindex="-1"])'
          )
        ).filter((element) => element.offsetParent !== null)
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
      }}
      className="fixed inset-0 z-[88] overflow-hidden bg-[#0a0a0b] outline-none"
      style={{ '--os-accent': '#58a6ff' } as React.CSSProperties}
    >
      {power === 'booting' ? (
        <div className="flex h-full flex-col items-center justify-center gap-7 px-6">
          <span
            aria-hidden
            className="grid h-14 w-14 place-items-center rounded-[4px] border border-white/25 font-mono text-base tracking-[0.08em] text-white/85"
          >
            AR
          </span>
          <div className="w-44">
            <div aria-hidden className="h-[3px] w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full animate-os-boot rounded-full bg-white/80" />
            </div>
            <p className="mt-3 text-center font-mono text-[10px] uppercase tracking-[0.2em] text-white/55">
              {t('os.booting')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPower('running')}
            className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/55 underline-offset-4 hover:text-white/80 hover:underline"
          >
            {t('os.powerOn')}
          </button>
        </div>
      ) : power === 'off' ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 px-6">
          <button
            type="button"
            onClick={() => powerTo('booting')}
            aria-label={t('os.powerOn')}
            title={t('os.powerOn')}
            className="grid h-16 w-16 place-items-center rounded-full border border-white/25 text-white/70 transition-colors hover:border-white/60 hover:text-white/95"
          >
            <Power className="h-6 w-6" />
          </button>
          <div className="text-center">
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/70">{t('os.off')}</p>
            <button
              type="button"
              onClick={leave}
              className="mt-3 font-mono text-[10px] uppercase tracking-[0.16em] text-white/55 underline-offset-4 hover:text-white/80 hover:underline"
            >
              {t('os.menu.logout')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* the screen the desktop is drawn on */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 85% at 18% -10%, #1b2532 0%, #0e1116 45%, #08080a 100%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-70"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)',
              backgroundSize: '46px 46px',
            }}
          />

          {/* ---- menu bar ---- */}
          <div className="relative z-[3] flex h-[34px] items-center justify-between gap-3 border-b border-white/10 bg-black/35 px-2 backdrop-blur-sm sm:px-3">
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setLauncherOpen((open) => !open)}
                aria-expanded={launcherOpen}
                aria-haspopup="dialog"
                aria-label={t('os.menu')}
                title={t('os.menu')}
                className={`flex items-center gap-2 rounded-sm px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] transition-colors ${
                  launcherOpen
                    ? 'bg-white/15 text-white'
                    : 'text-white/75 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span
                  aria-hidden
                  className="grid h-4 w-4 place-items-center rounded-[2px] border border-white/30 text-[7px]"
                >
                  AR
                </span>
                <span className="max-w-[7.5rem] truncate">{focusedLabel}</span>
              </button>
              <span aria-hidden className="hidden h-3 w-px bg-white/15 sm:block" />
              <span className="hidden font-mono text-[10px] uppercase tracking-[0.14em] text-white/50 sm:block">
                {today ?? ''}
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <span className="tabular font-mono text-[11px] text-white/75">{clock ?? '--:--'}</span>
              <button
                type="button"
                onClick={leave}
                aria-label={t('os.menu.logout')}
                title={t('os.menu.logout')}
                className="rounded-sm p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Power className="h-3.5 w-3.5" />
              </button>
            </div>

            {launcherOpen ? (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setLauncherOpen(false)}
                  className="fixed inset-0 z-[1] cursor-default"
                />
                <div
                  role="dialog"
                  aria-label={t('os.menu')}
                  className="absolute left-1.5 top-[calc(100%+4px)] z-[2] max-h-[calc(100dvh-44px)] w-[17rem] animate-slide-down overflow-y-auto rounded-[6px] border border-white/15 bg-[#151517]/97 p-2 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.9)] backdrop-blur sm:left-3"
                >
                  <p className="px-1 pb-2 font-mono text-[9px] uppercase tracking-[0.2em] text-white/45">
                    {t('os.palette')}
                  </p>

                  <div className="grid grid-cols-3 gap-1">
                    {APPS.map((meta) => {
                      const Icon = meta.icon
                      return (
                        <button
                          key={meta.id}
                          type="button"
                          onClick={() => openApp(meta.id)}
                          className="flex flex-col items-center gap-1.5 rounded-sm px-1 py-2.5 transition-colors hover:bg-white/10"
                        >
                          <Icon className="h-5 w-5 text-white/80" />
                          <span className="max-w-full truncate font-mono text-[9px] text-white/70">
                            {t(meta.labelKey)}
                          </span>
                        </button>
                      )
                    })}
                  </div>

                  <span aria-hidden className="my-2 block h-px bg-white/10" />

                  <button
                    type="button"
                    onClick={() => openApp('about')}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {t('os.menu.about')}
                  </button>
                  <button
                    type="button"
                    onClick={() => powerTo('booting')}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t('os.menu.restart')}
                  </button>
                  <button
                    type="button"
                    onClick={() => powerTo('off')}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Power className="h-3.5 w-3.5" />
                    {t('os.menu.shutdown')}
                  </button>
                  <button
                    type="button"
                    onClick={leave}
                    className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                    {t('os.menu.logout')}
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {/*
            * ---- desktop ----
            *
            * `z-0` is load-bearing: without a z-index here this element creates no
            * stacking context, so the windows' inline `zIndex` (they stack in tens)
            * would resolve against the root and paint over the menu bar's launcher
            * and the dock - the items behind a window stop being clickable.
            * Containing them keeps the chrome on top of the screen, which is the
            * only order that works.
            */}
          <div className="absolute inset-x-0 bottom-[76px] top-[34px] z-0">
            {/* Desktop shortcuts: the same apps the dock carries, for a hand
                that reaches for the screen first. */}
            <div
              className={`absolute left-2 top-2 flex-col gap-2 sm:left-3 sm:top-3 sm:gap-3 ${
                compact && windows.length > 0 ? 'hidden' : 'flex'
              }`}
            >
              {(['projects', 'resume', 'terminal'] as OsAppId[]).map((app) => {
                const meta = APPS.find((entry) => entry.id === app)!
                const Icon = meta.icon
                const isRunning = windows.some((entry) => entry.app === app)
                return (
                  <button
                    key={app}
                    type="button"
                    onClick={() => openApp(app)}
                    className="group flex w-[76px] flex-col items-center gap-1.5 rounded-sm p-1.5 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                  >
                    <Icon
                      className={`h-7 w-7 transition-colors ${
                        isRunning ? 'text-white/90' : 'text-white/65 group-hover:text-[color:var(--os-accent)]'
                      }`}
                    />
                    <span className="max-w-full truncate font-mono text-[9px] text-white/70">
                      {app === 'resume' ? 'resume.pdf' : t(meta.labelKey)}
                    </span>
                  </button>
                )
              })}
            </div>

            {windows.map((entry) => {
              const meta = APPS.find((app) => app.id === entry.app)!
              const label = t(meta.labelKey)
              const filled = entry.zoomed || compact
              const isFront = entry.id === frontId

              return (
                <div
                  key={entry.id}
                  role="group"
                  aria-label={label}
                  aria-hidden={entry.minimised || undefined}
                  data-front={isFront ? 'true' : undefined}
                  // Kept mounted while minimised: a terminal that forgets its
                  // scrollback when it is put away is not a terminal.
                  onPointerDown={() => focusWindow(entry.id)}
                  className={`absolute ${entry.minimised ? 'hidden' : 'flex'} animate-os-open flex-col overflow-hidden rounded-[6px] bg-[#151517]/97 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.95)] ${
                    isFront ? 'border border-white/30' : 'border border-white/12'
                  } ${filled ? '' : 'backdrop-blur-sm'}`}
                  style={
                    filled
                      ? { left: 8, top: 8, right: 8, bottom: 8, zIndex: entry.z }
                      : {
                          left: entry.x,
                          top: entry.y,
                          width: entry.width,
                          height: entry.height,
                          zIndex: entry.z,
                        }
                  }
                >
                  <div
                    tabIndex={0}
                    onPointerDown={(event) => onTitlePointerDown(event, entry)}
                    onPointerMove={onTitlePointerMove}
                    onPointerUp={onTitlePointerUp}
                    onPointerCancel={onTitlePointerUp}
                    onLostPointerCapture={() => {
                      dragRef.current = null
                    }}
                    onKeyDown={(event) => onTitleKeyDown(event, entry)}
                    onDoubleClick={(event) => {
                      if ((event.target as HTMLElement).closest('button')) return
                      zoomWindow(entry.id)
                    }}
                    className={`flex shrink-0 touch-none select-none items-center gap-2.5 border-b px-2.5 py-2 outline-offset-[-2px] ${
                      isFront
                        ? 'border-white/15 bg-white/[0.07]'
                        : 'border-white/10 bg-white/[0.03]'
                    } ${filled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    {/* the three dots: close, minimise, fill. The hit area is
                        a few pixels larger than the dot so a thumb can find
                        it; the gap between them is wide enough that the three
                        targets do not overlap. */}
                    <span className="flex shrink-0 items-center gap-2">
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => closeWindow(entry.id)}
                        aria-label={t('os.window.close')}
                        title={t('os.window.close')}
                        className="relative grid h-3.5 w-3.5 place-items-center rounded-full bg-[#ff5f57]/85 text-black/60 transition-colors after:absolute after:-inset-1 after:rounded-full after:content-[''] hover:bg-[#ff5f57]"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => minimiseWindow(entry.id)}
                        aria-label={t('os.window.minimise')}
                        title={t('os.window.minimise')}
                        className="relative grid h-3.5 w-3.5 place-items-center rounded-full bg-[#febc2e]/85 text-black/60 transition-colors after:absolute after:-inset-1 after:rounded-full after:content-[''] hover:bg-[#febc2e]"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      {compact ? null : (
                        <button
                          type="button"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={() => zoomWindow(entry.id)}
                          aria-label={entry.zoomed ? t('os.window.restore') : t('os.window.zoom')}
                          title={entry.zoomed ? t('os.window.restore') : t('os.window.zoom')}
                          className="relative grid h-3.5 w-3.5 place-items-center rounded-full bg-[#28c840]/85 text-black/60 transition-colors after:absolute after:-inset-1 after:rounded-full after:content-[''] hover:bg-[#28c840]"
                        >
                          {entry.zoomed ? (
                            <Minimize2 className="h-2.5 w-2.5" />
                          ) : (
                            <Maximize2 className="h-2 w-2" />
                          )}
                        </button>
                      )}
                    </span>

                    <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/65">
                      {label}
                    </span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-4">
                    {entry.app === 'projects' ? <ProjectsApp /> : null}
                    {entry.app === 'terminal' ? <TerminalApp onExit={leave} onOpenApp={openApp} /> : null}
                    {entry.app === 'about' ? <AboutApp /> : null}
                    {entry.app === 'resume' ? <ResumeApp /> : null}
                    {entry.app === 'trash' ? <TrashApp /> : null}
                  </div>

                  {filled ? null : (
                    <span
                      aria-hidden
                      onPointerDown={(event) => onResizePointerDown(event, entry)}
                      onPointerMove={onResizePointerMove}
                      onPointerUp={(event) => {
                        resizeRef.current = null
                        try {
                          event.currentTarget.releasePointerCapture(event.pointerId)
                        } catch {
                          // Already released.
                        }
                      }}
                      onPointerCancel={() => {
                        resizeRef.current = null
                      }}
                      onLostPointerCapture={() => {
                        resizeRef.current = null
                      }}
                      className="absolute bottom-0 right-0 grid h-4 w-4 cursor-nwse-resize touch-none place-items-center text-white/25 transition-colors hover:text-white/60"
                    >
                      <svg viewBox="0 0 10 10" className="h-2.5 w-2.5" fill="none" stroke="currentColor">
                        <path d="M9 3 3 9M9 6.5 6.5 9" strokeWidth="1" />
                      </svg>
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* ---- dock ---- */}
          <div
            aria-label={t('os.dock')}
            role="toolbar"
            className="absolute inset-x-0 bottom-0 z-[2] flex h-[76px] items-center justify-center gap-0.5 border-t border-white/10 bg-black/35 px-2 backdrop-blur-sm sm:gap-1.5 sm:px-3"
          >
            {APP_IDS.map((app) => {
              const meta = APPS.find((entry) => entry.id === app)!
              const Icon = meta.icon
              const entry = windows.find((item) => item.app === app)
              const isRunning = Boolean(entry)
              const isFront = isRunning && !entry!.minimised && entry!.id === frontId
              return (
                <button
                  key={app}
                  type="button"
                  onClick={() => pressDock(app)}
                  title={t(meta.labelKey)}
                  aria-label={t(meta.labelKey)}
                  aria-pressed={isFront}
                  className="group flex min-w-0 flex-1 flex-col items-center gap-1 rounded-[4px] px-1 py-2 transition-colors hover:bg-white/10 sm:w-[74px] sm:flex-none"
                >
                  <Icon
                    className={`h-6 w-6 shrink-0 transition-colors ${
                      isRunning ? 'text-[color:var(--os-accent)]' : 'text-white/70 group-hover:text-white/95'
                    }`}
                  />
                  <span className="hidden max-w-full truncate font-mono text-[9px] text-white/70 sm:block">
                    {t(meta.labelKey)}
                  </span>
                  <span
                    aria-hidden
                    className={`h-1 w-1 shrink-0 rounded-full transition-colors ${
                      isRunning ? 'bg-white/70' : 'bg-transparent'
                    }`}
                  />
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
