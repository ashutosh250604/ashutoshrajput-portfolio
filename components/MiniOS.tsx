'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
// Imported as a namespace for its event and style types; the DOM's own event
// types are used unqualified alongside them.
import type * as React from 'react'
import { Info, LogOut, Maximize2, Minimize2, Minus, Power, RotateCcw, Search, Wifi, X } from 'lucide-react'
import { lockScroll, unlockScroll } from '@/lib/scrollLock'
import { useShortcuts } from '@/lib/shortcuts'
import { bindingOf, markEggFound } from '@/lib/eggs'
import { useLocalTime } from '@/lib/localTime'
import { OS_CLOSE_EVENT, OS_EVENT, type OsAppId } from '@/lib/os'
import { useLanguage } from '@/contexts/LanguageContext'
import { openPalette } from './CommandPalette'
import { AppIcon, BatteryGlyph } from './MiniOSIcons'
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
  width: number
  height: number
  minWidth: number
  minHeight: number
}

/** Menu bar and dock reserve their own space; windows live between them. */
const BAR = 30
const DOCK = 78
/** Long enough to read the word "starting", short enough not to be a wait. */
const BOOT_MS = 1600
/** Arrow keys move a window by this much, four times that with shift. */
const NUDGE = 16
/** Below this width the desktop fills the screen instead of floating windows. */
const COMPACT = 640

const APPS: AppMeta[] = [
  { id: 'projects', labelKey: 'nav.projects', width: 460, height: 400, minWidth: 300, minHeight: 240 },
  { id: 'terminal', labelKey: 'os.terminal', width: 560, height: 380, minWidth: 340, minHeight: 240 },
  { id: 'about', labelKey: 'about.title', width: 430, height: 440, minWidth: 300, minHeight: 260 },
  { id: 'resume', labelKey: 'hero.resume', width: 430, height: 320, minWidth: 300, minHeight: 240 },
  { id: 'trash', labelKey: 'os.trash', width: 380, height: 280, minWidth: 280, minHeight: 200 },
]

const APP_IDS = APPS.map((entry) => entry.id)
const DOCK_MAIN = APP_IDS.filter((id) => id !== 'trash')

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
 * It is a Mac made of the site's own data. The chrome is the part that has to
 * be convincing - a menu bar that reports the front app, a system menu, a
 * floating Dock and windows with centred titles and traffic lights - while
 * every app inside still reads data/projects.ts, data/skills.ts and
 * data/socials.ts, the same files the sections and the resume read.
 *
 * The screen stays dark in both themes on purpose: it is a screen, and one
 * fixed palette keeps the chrome measurable instead of doubling the contrast
 * surface. The wallpaper is drawn in CSS, so there is nothing to download.
 *
 * It is a modal toy, so it gives three ways out (Escape, the menu bar's power
 * button, and the system menu's log out) and it hands the page back exactly as
 * it found it.
 */
export default function MiniOS() {
  const { t } = useLanguage()
  const clock = useLocalTime({ hour: '2-digit', minute: '2-digit' })
  const today = useLocalTime({ weekday: 'short', day: '2-digit', month: 'short' })

  const [open, setOpen] = useState(false)
  const [power, setPower] = useState<PowerState>('booting')
  const [windows, setWindows] = useState<OsWindow[]>([])
  const [launcherOpen, setLauncherOpen] = useState(false)
  const [focusRequest, setFocusRequest] = useState<{ app: OsAppId; nonce: number } | null>(null)
  const [compact, setCompact] = useState(() =>
    typeof window === 'undefined' ? false : isCompact()
  )

  const nextId = useRef(1)
  const topZ = useRef(10)
  const focusNonce = useRef(0)
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null)
  const resizeRef = useRef<{ id: number; startX: number; startY: number; width: number; height: number } | null>(
    null
  )
  const shellRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const leave = useCallback(() => {
    setLauncherOpen(false)
    setFocusRequest(null)
    setOpen(false)
  }, [])

  const enter = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement | null
    setWindows([])
    setLauncherOpen(false)
    setFocusRequest(null)
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
    setFocusRequest(null)
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

      // The system menu closes first: it is the most recent thing opened.
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

  // A window is a keyboard destination, not just a layer. Opening or raising
  // one moves focus into it (the terminal gets its prompt); otherwise focus
  // stays in the app that is now behind and keystrokes go to the wrong window.
  useEffect(() => {
    if (!open || !focusRequest) return
    const root = shellRef.current
    if (!root) return

    const selector =
      focusRequest.app === 'terminal'
        ? '[data-terminal-input]'
        : `[data-window-app="${focusRequest.app}"] [data-window-title]`
    root.querySelector<HTMLElement>(selector)?.focus({ preventScroll: true })
  }, [open, focusRequest])

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

    // The effect above runs after the new front window has painted, so the
    // title bar or terminal prompt exists when it asks for focus.
    setFocusRequest({ app, nonce: (focusNonce.current += 1) })
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
      className="fixed inset-0 z-[88] select-none overflow-hidden bg-[#050609] text-white outline-none"
      style={{ '--os-accent': '#0a84ff' } as React.CSSProperties}
    >
      {power === 'booting' ? (
        <div className="flex h-full flex-col items-center justify-center gap-8 px-6">
          <span
            aria-hidden
            className="grid h-16 w-16 place-items-center rounded-[14px] border border-white/20 bg-white/[0.07] font-mono text-[17px] tracking-[0.06em] text-white/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.18)]"
          >
            AR
          </span>
          <div className="w-52">
            <div aria-hidden className="h-[3px] w-full overflow-hidden rounded-full bg-white/15">
              <div className="h-full animate-os-boot rounded-full bg-white/80" />
            </div>
            <p className="mt-3 text-center text-[11px] text-white/55">
              {t('os.booting')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPower('running')}
            className="text-[10.5px] text-white/60 underline-offset-4 hover:text-white/80 hover:underline"
          >
            {t('os.powerOn')}
          </button>
        </div>
      ) : power === 'off' ? (
        <div className="flex h-full flex-col items-center justify-center gap-6 bg-black px-6">
          <button
            type="button"
            onClick={() => powerTo('booting')}
            aria-label={t('os.powerOn')}
            title={t('os.powerOn')}
            className="grid h-16 w-16 place-items-center rounded-full border border-white/20 text-white/65 transition-colors hover:border-white/50 hover:text-white"
          >
            <Power className="h-6 w-6" />
          </button>
          <div className="text-center">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">{t('os.off')}</p>
            <button
              type="button"
              onClick={leave}
              className="mt-3 text-[10.5px] text-white/60 underline-offset-4 hover:text-white/80 hover:underline"
            >
              {t('os.menu.logout')}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* ---- wallpaper ---- */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(125% 100% at 12% 8%, #23496f 0%, #142c45 34%, #0b1622 64%, #05070a 100%)',
            }}
          />
          <div aria-hidden className="absolute -left-[14%] top-[4%] h-[58vh] w-[64vw] rounded-full bg-[#3d8fc7]/30 blur-[130px]" />
          <div aria-hidden className="absolute -right-[10%] -top-[14%] h-[56vh] w-[50vw] rounded-full bg-[#705aa0]/25 blur-[140px]" />
          <div aria-hidden className="absolute bottom-[-20%] left-[16%] h-[58vh] w-[58vw] rounded-full bg-[#1c7472]/25 blur-[150px]" />
          <div aria-hidden className="absolute bottom-[2%] right-[4%] h-[38vh] w-[34vw] rounded-full bg-[#d69a58]/[0.12] blur-[120px]" />
          <div
            aria-hidden
            className="absolute inset-0"
            style={{
              background:
                'radial-gradient(120% 110% at 50% 42%, transparent 42%, rgba(0,0,0,0.42) 100%)',
            }}
          />
          <div
            aria-hidden
            className="absolute inset-0 opacity-[0.05] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.65'/%3E%3C/svg%3E\")",
            }}
          />

          {/* ---- menu bar ---- */}
          <div className="relative z-[3] flex h-[30px] items-center justify-between gap-2 border-b border-black/25 bg-[#0a0b0e]/45 px-2 text-[12px] text-white/90 shadow-[inset_0_-1px_0_rgba(255,255,255,0.05)] backdrop-blur-2xl">
            <div className="flex min-w-0 items-center gap-1">
              <button
                type="button"
                onClick={() => setLauncherOpen((open) => !open)}
                aria-expanded={launcherOpen}
                aria-haspopup="menu"
                aria-label={`${focusedLabel}, ${t('os.menu')}`}
                title={t('os.menu')}
                className={`flex h-[23px] min-w-0 items-center gap-1.5 rounded-[4px] px-1.5 transition-colors ${
                  launcherOpen ? 'bg-white/15 text-white' : 'hover:bg-white/10'
                }`}
              >
                <span
                  aria-hidden
                  className="grid h-[15px] w-[15px] shrink-0 place-items-center rounded-[3px] border border-white/30 text-[7px] font-semibold leading-none"
                >
                  AR
                </span>
                <span className="truncate font-semibold text-white/95">{focusedLabel}</span>
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-0.5 text-white/80">
              <button
                type="button"
                onClick={() => {
                  setLauncherOpen(false)
                  openPalette()
                }}
                aria-label={t('a11y.openPalette')}
                title={t('a11y.openPalette')}
                className="grid h-[23px] w-[26px] place-items-center rounded-[4px] transition-colors hover:bg-white/10 hover:text-white"
              >
                <Search className="h-[14px] w-[14px]" />
              </button>
              <span aria-hidden className="hidden items-center gap-2.5 px-1.5 sm:flex">
                <Wifi className="h-[15px] w-[15px]" />
                <BatteryGlyph />
              </span>
              <span className="hidden px-1.5 md:block">{today ?? ''}</span>
              <span className="tabular px-1 text-white/85">{clock ?? '--:--'}</span>
              <button
                type="button"
                onClick={leave}
                aria-label={t('os.menu.logout')}
                title={t('os.menu.logout')}
                className="grid h-[23px] w-[26px] place-items-center rounded-[4px] text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <Power className="h-[13px] w-[13px]" />
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
                  role="menu"
                  aria-label={t('os.menu')}
                  className="absolute left-1 top-[calc(100%+5px)] z-[2] max-h-[calc(100dvh-44px)] w-[264px] animate-slide-down overflow-y-auto rounded-[10px] border border-white/15 bg-[#1c1c1f]/85 p-1.5 text-[12.5px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.9)] backdrop-blur-2xl"
                >
                  <div role="presentation" className="flex items-center gap-2.5 px-2 pb-2 pt-1.5">
                    <span
                      aria-hidden
                      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-white/20 bg-gradient-to-b from-white/20 to-white/5 text-[10px] font-semibold tracking-[0.04em] text-white/90"
                    >
                      AR
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-[12.5px] font-semibold text-white/95">{t('hero.name')}</p>
                      <p className="truncate text-[10.5px] text-white/50">{t('os.palette')}</p>
                    </div>
                  </div>

                  <div role="separator" aria-hidden className="my-1 h-px bg-white/10" />

                  {APPS.filter((meta) => meta.id !== 'about').map((meta) => (
                    <button
                      key={meta.id}
                      type="button"
                      role="menuitem"
                      onClick={() => openApp(meta.id)}
                      className="group flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-left text-white/90 transition-colors hover:bg-[#0a6fd8] hover:text-white"
                    >
                      <AppIcon app={meta.id} size={19} />
                      <span className="truncate">{t(meta.labelKey)}</span>
                    </button>
                  ))}

                  <div role="separator" aria-hidden className="my-1 h-px bg-white/10" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openApp('about')}
                    className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-left text-white/90 transition-colors hover:bg-[#0a6fd8] hover:text-white"
                  >
                    <Info className="h-[15px] w-[15px] shrink-0 opacity-80" />
                    {t('os.menu.about')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => powerTo('booting')}
                    className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-left text-white/90 transition-colors hover:bg-[#0a6fd8] hover:text-white"
                  >
                    <RotateCcw className="h-[15px] w-[15px] shrink-0 opacity-80" />
                    {t('os.menu.restart')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => powerTo('off')}
                    className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-left text-white/90 transition-colors hover:bg-[#0a6fd8] hover:text-white"
                  >
                    <Power className="h-[15px] w-[15px] shrink-0 opacity-80" />
                    {t('os.menu.shutdown')}
                  </button>

                  <div role="separator" aria-hidden className="my-1 h-px bg-white/10" />

                  <button
                    type="button"
                    role="menuitem"
                    onClick={leave}
                    className="flex w-full items-center gap-2.5 rounded-[5px] px-2 py-[5px] text-left text-white/90 transition-colors hover:bg-[#0a6fd8] hover:text-white"
                  >
                    <LogOut className="h-[15px] w-[15px] shrink-0 opacity-80" />
                    {t('os.menu.logout')}
                  </button>
                </div>
              </>
            ) : null}
          </div>

          {/* ---- desktop ---- */}
          <div className="absolute inset-x-0 bottom-[78px] top-[30px] z-0">
            {/* Desktop icons live on the right, where a Mac keeps them. */}
            {compact ? null : (
              <div className="absolute right-3 top-3 flex flex-col gap-4">
                {(['projects', 'resume', 'terminal'] as OsAppId[]).map((app) => {
                  const meta = APPS.find((entry) => entry.id === app)!
                  const isRunning = windows.some((entry) => entry.app === app)
                  return (
                    <button
                      key={app}
                      type="button"
                      onClick={() => openApp(app)}
                      className="group flex w-[88px] flex-col items-center gap-1.5 rounded-[8px] p-1.5 transition-colors hover:bg-white/10 focus-visible:bg-white/10"
                    >
                      <span className="relative">
                        <AppIcon app={app} size={54} className="transition-transform duration-150 group-hover:-translate-y-0.5" />
                        {isRunning ? (
                          <span
                            aria-hidden
                            className="absolute -right-1 -top-1 h-2 w-2 rounded-full border border-white/40 bg-[#0a84ff]"
                          />
                        ) : null}
                      </span>
                      <span className="max-w-full truncate text-[11px] font-medium text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]">
                        {app === 'resume' ? 'resume.pdf' : t(meta.labelKey)}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}

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
                  data-window-app={entry.app}
                  // Kept mounted while minimised: a terminal that forgets its
                  // scrollback when it is put away is not a terminal.
                  onPointerDown={(event) => {
                    focusWindow(entry.id)
                    // A click on empty window chrome should put the caret in
                    // this window. Links, buttons and fields keep their own
                    // focus, and the title bar handles itself.
                    const target = event.target as HTMLElement
                    if (
                      target.closest(
                        'a, button, input, select, textarea, [contenteditable="true"], [tabindex]:not([tabindex="-1"])'
                      )
                    ) {
                      return
                    }
                    const focusTarget =
                      entry.app === 'terminal'
                        ? event.currentTarget.querySelector<HTMLElement>('[data-terminal-input]')
                        : event.currentTarget.querySelector<HTMLElement>('[data-window-title]')
                    focusTarget?.focus({ preventScroll: true })
                  }}
                  // Opaque, not frosted: a translucent window stacked over a
                  // second window lets its text bleed through and makes both
                  // read as blurred. The blur belongs to the chrome behind the
                  // windows, not to the windows themselves.
                  className={`absolute ${entry.minimised ? 'hidden' : 'flex'} animate-os-open flex-col overflow-hidden rounded-[10px] border ${
                    isFront
                      ? 'border-white/25 bg-[#1f1f23] shadow-[0_36px_80px_-18px_rgba(0,0,0,0.95),0_0_0_1px_rgba(0,0,0,0.55)]'
                      : 'border-white/10 bg-[#19191c] shadow-[0_20px_50px_-20px_rgba(0,0,0,0.9)]'
                  }`}
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
                    data-window-title
                    tabIndex={0}
                    onPointerDown={(event) => {
                      onTitlePointerDown(event, entry)
                      if (!(event.target as HTMLElement).closest('button')) {
                        event.currentTarget.focus({ preventScroll: true })
                      }
                    }}
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
                    className={`relative flex h-[38px] shrink-0 touch-none items-center gap-2 border-b px-3 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-[color:var(--os-accent)] ${
                      isFront
                        ? 'border-white/10 bg-white/[0.055]'
                        : 'border-white/5 bg-white/[0.02]'
                    } ${filled ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}`}
                  >
                    {/* traffic lights. The glyphs stay hidden until the group
                        is hovered, the way a Mac shows them. */}
                    <span
                      className={`group/lights relative z-10 flex shrink-0 items-center gap-[8px] transition-opacity ${
                        isFront ? '' : 'opacity-60'
                      }`}
                    >
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => closeWindow(entry.id)}
                        aria-label={t('os.window.close')}
                        title={t('os.window.close')}
                        className="relative grid h-[12px] w-[12px] place-items-center rounded-full bg-[#ff5f57] after:absolute after:-inset-[5px] after:rounded-full after:content-['']"
                      >
                        <X
                          className="h-[8px] w-[8px] text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
                          strokeWidth={3}
                        />
                      </button>
                      <button
                        type="button"
                        onPointerDown={(event) => event.stopPropagation()}
                        onClick={() => minimiseWindow(entry.id)}
                        aria-label={t('os.window.minimise')}
                        title={t('os.window.minimise')}
                        className="relative grid h-[12px] w-[12px] place-items-center rounded-full bg-[#febc2e] after:absolute after:-inset-[5px] after:rounded-full after:content-['']"
                      >
                        <Minus
                          className="h-[8px] w-[8px] text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
                          strokeWidth={3}
                        />
                      </button>
                      {compact ? null : (
                        <button
                          type="button"
                          onPointerDown={(event) => event.stopPropagation()}
                          onClick={() => zoomWindow(entry.id)}
                          aria-label={entry.zoomed ? t('os.window.restore') : t('os.window.zoom')}
                          title={entry.zoomed ? t('os.window.restore') : t('os.window.zoom')}
                          className="relative grid h-[12px] w-[12px] place-items-center rounded-full bg-[#28c840] after:absolute after:-inset-[5px] after:rounded-full after:content-['']"
                        >
                          {entry.zoomed ? (
                            <Minimize2
                              className="h-[8px] w-[8px] text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
                              strokeWidth={3}
                            />
                          ) : (
                            <Maximize2
                              className="h-[7px] w-[7px] text-black/55 opacity-0 transition-opacity group-hover/lights:opacity-100"
                              strokeWidth={3}
                            />
                          )}
                        </button>
                      )}
                    </span>

                    <span
                      className={`pointer-events-none absolute inset-x-[84px] truncate text-center text-[12.5px] font-medium ${
                        isFront ? 'text-white/85' : 'text-white/55'
                      }`}
                    >
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
                      className="absolute bottom-0 right-0 grid h-4 w-4 cursor-nwse-resize touch-none place-items-center text-white/20 transition-colors hover:text-white/55"
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
          <div className="absolute inset-x-0 bottom-2 z-[2] flex justify-center px-3">
            <div
              aria-label={t('os.dock')}
              role="toolbar"
              className="flex items-end gap-1.5 rounded-[20px] border border-white/20 bg-white/[0.13] p-2 shadow-[0_24px_60px_-14px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl"
            >
              {DOCK_MAIN.map((app) => {
                const meta = APPS.find((entry) => entry.id === app)!
                const entry = windows.find((item) => item.app === app)
                const isRunning = Boolean(entry)
                const isFront = isRunning && !entry!.minimised && entry!.id === frontId
                return (
                  <DockItem
                    key={app}
                    app={app}
                    label={t(meta.labelKey)}
                    running={isRunning}
                    front={isFront}
                    onPress={() => pressDock(app)}
                  />
                )
              })}

              <span aria-hidden className="mx-1 h-9 w-px self-center bg-white/20" />

              {APP_IDS.filter((app) => app === 'trash').map((app) => {
                const meta = APPS.find((entry) => entry.id === app)!
                const entry = windows.find((item) => item.app === app)
                const isRunning = Boolean(entry)
                const isFront = isRunning && !entry!.minimised && entry!.id === frontId
                return (
                  <DockItem
                    key={app}
                    app={app}
                    label={t(meta.labelKey)}
                    running={isRunning}
                    front={isFront}
                    onPress={() => pressDock(app)}
                  />
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

/** One icon in the Dock: magnify on hover, label above, running dot below. */
function DockItem({
  app,
  label,
  running,
  front,
  onPress,
}: {
  app: OsAppId
  label: string
  running: boolean
  front: boolean
  onPress: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={label}
      aria-pressed={front}
      title={label}
      className="group relative flex w-[48px] shrink-0 flex-col items-center justify-end rounded-[10px] outline-offset-4"
    >
      <span aria-hidden className="pointer-events-none absolute -top-8 whitespace-nowrap rounded-[5px] border border-white/15 bg-[#1b1b1e]/90 px-2 py-1 text-[10.5px] text-white/90 opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100">
        {label}
      </span>
      <span className="transition-transform duration-150 ease-out group-hover:-translate-y-1 group-hover:scale-110 group-active:scale-100">
        <AppIcon app={app} size={44} />
      </span>
      <span
        aria-hidden
        className={`mt-1.5 h-1 w-1 rounded-full transition-colors ${
          running ? 'bg-white/85' : 'bg-transparent'
        }`}
      />
    </button>
  )
}
