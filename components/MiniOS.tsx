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
import { OS_EVENT } from '@/lib/os'
import { useLanguage } from '@/contexts/LanguageContext'
import { AboutApp, ProjectsApp, ResumeApp, TerminalApp, TrashApp } from './MiniOSApps'

type PowerState = 'booting' | 'running' | 'off'
type AppId = 'projects' | 'terminal' | 'about' | 'resume' | 'trash'

interface OsWindow {
  id: number
  app: AppId
  x: number
  y: number
  width: number
  height: number
  z: number
  zoomed: boolean
  minimised: boolean
}

/** Menu bar and dock reserve their own space; windows live between them. */
const BAR = 30
const DOCK = 78
/** Long enough to read the word "starting", short enough not to be a wait. */
const BOOT_MS = 1600
/** Arrow keys move a window by this much, four times that with shift. */
const NUDGE = 16

const APPS: { id: AppId; labelKey: string; icon: typeof Folder; width: number; height: number }[] = [
  { id: 'projects', labelKey: 'nav.projects', icon: Folder, width: 430, height: 390 },
  { id: 'terminal', labelKey: 'os.terminal', icon: TerminalIcon, width: 540, height: 370 },
  { id: 'about', labelKey: 'about.title', icon: Info, width: 420, height: 410 },
  { id: 'resume', labelKey: 'hero.resume', icon: FileText, width: 400, height: 300 },
  { id: 'trash', labelKey: 'os.trash', icon: Trash2, width: 380, height: 240 },
]

const clamp = (value: number, low: number, high: number) => Math.min(Math.max(value, low), high)

/**
 * A desktop, hidden behind ⇧⌘O.
 *
 * It is built from the site's own parts rather than as a macOS imitation: the
 * windows are hairline-ruled plates, the labels are monospace metadata, and
 * every app reads data/projects.ts, data/skills.ts and data/socials.ts — the
 * same files the sections and the resume read. The screen is dark in both
 * themes on purpose: it is a screen, and one fixed palette keeps the window
 * chrome measurable instead of doubling the contrast surface.
 *
 * It is a modal toy, so it gives three ways out (Escape, the menu bar's power
 * button, and the menu's own item) and it hands the page back exactly as it
 * found it.
 */
export default function MiniOS() {
  const { t } = useLanguage()
  const clock = useLocalTime({ hour: '2-digit', minute: '2-digit' })

  const [open, setOpen] = useState(false)
  const [power, setPower] = useState<PowerState>('booting')
  const [windows, setWindows] = useState<OsWindow[]>([])
  const [menuOpen, setMenuOpen] = useState(false)

  const nextId = useRef(1)
  const topZ = useRef(10)
  const dragRef = useRef<{ id: number; dx: number; dy: number } | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)

  const leave = useCallback(() => {
    setMenuOpen(false)
    setOpen(false)
  }, [])

  const enter = useCallback(() => {
    previousFocus.current = document.activeElement as HTMLElement | null
    setWindows([])
    setPower('booting')
    setOpen(true)
    markEggFound('os')
  }, [])

  /**
   * A power change starts from a clean machine. Windows otherwise outlive
   * `setPower` entirely, so a restart brought the previous session back — the
   * one thing a restart is supposed to clear.
   */
  const powerTo = useCallback((next: PowerState) => {
    setMenuOpen(false)
    setWindows([])
    setPower(next)
  }, [])

  // The back door: ⇧⌘O anywhere on the page.
  useShortcuts([{ ...bindingOf('os'), run: enter }])

  useEffect(() => {
    window.addEventListener(OS_EVENT, enter)
    return () => window.removeEventListener(OS_EVENT, enter)
  }, [enter])

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

  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      // The menu closes first: it is the most recent thing opened.
      if (menuOpen) setMenuOpen(false)
      else leave()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, menuOpen, leave])

  const focusWindow = useCallback((id: number) => {
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, z: (topZ.current += 1) } : entry))
    )
  }, [])

  const openApp = useCallback((app: AppId) => {
    setMenuOpen(false)

    setWindows((previous) => {
      const existing = previous.find((entry) => entry.app === app)
      if (existing) {
        return previous.map((entry) =>
          entry.id === existing.id
            ? { ...entry, minimised: false, z: (topZ.current += 1) }
            : entry
        )
      }

      const meta = APPS.find((entry) => entry.id === app)!
      const viewportWidth = window.innerWidth
      const viewportHeight = window.innerHeight
      const width = Math.min(meta.width, viewportWidth - 24)
      const height = Math.min(meta.height, viewportHeight - BAR - DOCK - 24)
      // Cascade, so a second window never lands exactly on the first.
      const step = (previous.length % 5) * 26

      return [
        ...previous,
        {
          id: (nextId.current += 1),
          app,
          x: Math.max(12, Math.round((viewportWidth - width) / 2) - 70 + step),
          y: Math.max(BAR + 10, Math.round((viewportHeight - BAR - DOCK - height) / 2) + BAR + step * 0.7),
          width,
          height,
          z: (topZ.current += 1),
          zoomed: false,
          minimised: false,
        },
      ]
    })
  }, [])

  const closeWindow = (id: number) =>
    setWindows((previous) => previous.filter((entry) => entry.id !== id))

  const minimiseWindow = (id: number) =>
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, minimised: true } : entry))
    )

  const zoomWindow = (id: number) =>
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, zoomed: !entry.zoomed } : entry))
    )

  const moveWindow = (id: number, x: number, y: number) =>
    setWindows((previous) =>
      previous.map((entry) => (entry.id === id ? { ...entry, x, y } : entry))
    )

  const onTitlePointerDown = (event: React.PointerEvent<HTMLDivElement>, entry: OsWindow) => {
    if (event.pointerType === 'mouse' && event.button !== 0) return
    if (entry.zoomed) return

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
        return {
          ...entry,
          // Never fully off-screen: the title bar has to stay grabbable.
          x: clamp(event.clientX - drag.dx, -entry.width + 140, window.innerWidth - 80),
          y: clamp(event.clientY - drag.dy, BAR, window.innerHeight - DOCK - 30),
        }
      })
    )
  }

  const onTitlePointerUp = () => {
    dragRef.current = null
  }

  /** Same movement, from the keyboard, on the title bar itself. */
  const onTitleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, entry: OsWindow) => {
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
    moveWindow(
      entry.id,
      clamp(entry.x + move[0], -entry.width + 140, window.innerWidth - 80),
      clamp(entry.y + move[1], BAR, window.innerHeight - DOCK - 30)
    )
  }

  if (!open) return null

  const focused = windows.filter((entry) => !entry.minimised).at(-1)
  const focusedLabel = focused ? t(APPS.find((entry) => entry.id === focused.app)!.labelKey) : t('os.palette')

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
      className="fixed inset-0 z-[75] overflow-hidden bg-[#0a0a0b] outline-none"
      style={{ '--os-accent': '#58a6ff' } as React.CSSProperties}
    >
      {power === 'booting' ? (
        <div className="flex h-full flex-col items-center justify-center gap-7">
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
        <div className="flex h-full flex-col items-center justify-center gap-6">
          <button
            type="button"
            onClick={() => powerTo('booting')}
            aria-label={t('os.powerOn')}
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
          <div className="relative z-[3] flex h-[30px] items-center justify-between gap-3 border-b border-white/10 bg-black/35 px-3 backdrop-blur-sm">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen((open) => !open)}
                aria-expanded={menuOpen}
                aria-haspopup="menu"
                aria-label={t('os.menu')}
                className="flex items-center gap-2 rounded-sm px-1.5 py-1 font-mono text-[10px] uppercase tracking-[0.16em] text-white/75 transition-colors hover:bg-white/10 hover:text-white"
              >
                <span aria-hidden className="grid h-4 w-4 place-items-center rounded-[2px] border border-white/30 text-[7px]">
                  AR
                </span>
                {focusedLabel}
              </button>
              <span className="hidden font-mono text-[10px] text-white/55 sm:block">{t('os.palette')}</span>
            </div>

            <div className="flex items-center gap-2">
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

            {menuOpen ? (
              <>
                <button
                  type="button"
                  aria-hidden
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  className="fixed inset-0 z-[1] cursor-default"
                />
                <div
                  role="menu"
                  className="absolute left-3 top-[32px] z-[2] w-56 animate-slide-down rounded-[6px] border border-white/15 bg-[#151517]/97 p-1 shadow-[0_20px_50px_-16px_rgba(0,0,0,0.9)] backdrop-blur"
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => openApp('about')}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Info className="h-3.5 w-3.5" />
                    {t('os.menu.about')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => powerTo('booting')}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    {t('os.menu.restart')}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => powerTo('off')}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                  >
                    <Power className="h-3.5 w-3.5" />
                    {t('os.menu.shutdown')}
                  </button>
                  <span aria-hidden className="my-1 block h-px bg-white/10" />
                  <button
                    type="button"
                    role="menuitem"
                    onClick={leave}
                    className="flex w-full items-center gap-2 rounded-sm px-2.5 py-2 text-left font-mono text-[11px] text-white/80 transition-colors hover:bg-white/10 hover:text-white"
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
            * would resolve against the root and paint over the menu bar's dropdown
            * and the dock — the menu items behind a window stop being clickable.
            * Containing them keeps the chrome on top of the screen, which is the
            * only order that works.
            */}
          <div className="absolute inset-x-0 top-[30px] bottom-[78px] z-0">
            {/* Two things on the desktop, so it does not read as an empty page. */}
            <div className="absolute left-4 top-4 flex flex-col gap-4">
              {(['projects', 'resume'] as AppId[]).map((app) => {
                const meta = APPS.find((entry) => entry.id === app)!
                const Icon = meta.icon
                return (
                  <button
                    key={app}
                    type="button"
                    onClick={() => openApp(app)}
                    className="group flex w-20 flex-col items-center gap-1.5 rounded-sm p-2 transition-colors hover:bg-white/10"
                  >
                    <Icon className="h-8 w-8 text-white/70 group-hover:text-[color:var(--os-accent)]" />
                    <span className="max-w-full truncate font-mono text-[9.5px] text-white/75">
                      {app === 'resume' ? 'resume.pdf' : t(meta.labelKey)}
                    </span>
                  </button>
                )
              })}
            </div>

            {windows.map((entry) => {
              if (entry.minimised) return null
              const meta = APPS.find((app) => app.id === entry.app)!
              const label = t(meta.labelKey)

              return (
                <div
                  key={entry.id}
                  role="group"
                  aria-label={label}
                  onPointerDown={() => focusWindow(entry.id)}
                  className={`absolute flex animate-os-open flex-col overflow-hidden rounded-[6px] border border-white/15 bg-[#151517]/97 shadow-[0_28px_70px_-24px_rgba(0,0,0,0.95)] ${
                    entry.zoomed ? '' : 'backdrop-blur-sm'
                  }`}
                  style={
                    entry.zoomed
                      ? { left: 8, top: 8, right: 8, bottom: 8, zIndex: entry.z }
                      : { left: entry.x, top: entry.y, width: entry.width, height: entry.height, zIndex: entry.z }
                  }
                >
                  <div
                    tabIndex={0}
                    onPointerDown={(event) => onTitlePointerDown(event, entry)}
                    onPointerMove={onTitlePointerMove}
                    onPointerUp={onTitlePointerUp}
                    onPointerCancel={onTitlePointerUp}
                    onKeyDown={(event) => onTitleKeyDown(event, entry)}
                    onDoubleClick={() => zoomWindow(entry.id)}
                    className={`flex shrink-0 items-center gap-3 border-b border-white/10 bg-white/[0.04] px-3 py-2 ${
                      entry.zoomed ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'
                    }`}
                  >
                    {/* the three dots: close, minimise, fill */}
                    <span className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => closeWindow(entry.id)}
                        aria-label={t('os.window.close')}
                        title={t('os.window.close')}
                        className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#ff5f57]/85 text-black/60 transition-colors hover:bg-[#ff5f57]"
                      >
                        <X className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => minimiseWindow(entry.id)}
                        aria-label={t('os.window.minimise')}
                        title={t('os.window.minimise')}
                        className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#febc2e]/85 text-black/60 transition-colors hover:bg-[#febc2e]"
                      >
                        <Minus className="h-2.5 w-2.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => zoomWindow(entry.id)}
                        aria-label={t('os.window.zoom')}
                        title={t('os.window.zoom')}
                        className="grid h-3.5 w-3.5 place-items-center rounded-full bg-[#28c840]/85 text-black/60 transition-colors hover:bg-[#28c840]"
                      >
                        <Maximize2 className="h-2 w-2" />
                      </button>
                    </span>

                    <span className="truncate font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/65">
                      {label}
                    </span>
                  </div>

                  <div className="min-h-0 flex-1 overflow-y-auto p-4">
                    {entry.app === 'projects' ? <ProjectsApp /> : null}
                    {entry.app === 'terminal' ? <TerminalApp onExit={leave} /> : null}
                    {entry.app === 'about' ? <AboutApp /> : null}
                    {entry.app === 'resume' ? <ResumeApp /> : null}
                    {entry.app === 'trash' ? <TrashApp /> : null}
                  </div>
                </div>
              )
            })}
          </div>

          {/* ---- dock ---- */}
          <div
            aria-label={t('os.dock')}
            role="toolbar"
            className="absolute inset-x-0 bottom-0 z-[2] flex h-[78px] items-center justify-center gap-1.5 border-t border-white/10 bg-black/35 px-3 backdrop-blur-sm"
          >
            {APPS.map((meta) => {
              const Icon = meta.icon
              const isOpen = windows.some((entry) => entry.app === meta.id && !entry.minimised)
              return (
                <button
                  key={meta.id}
                  type="button"
                  onClick={() => openApp(meta.id)}
                  title={t(meta.labelKey)}
                  className="group flex w-[74px] flex-col items-center gap-1 rounded-[4px] px-1.5 py-2 transition-colors hover:bg-white/10"
                >
                  <Icon
                    className={`h-6 w-6 transition-colors ${
                      isOpen ? 'text-[color:var(--os-accent)]' : 'text-white/70 group-hover:text-white/95'
                    }`}
                  />
                  <span className="max-w-full truncate font-mono text-[9px] text-white/70">
                    {t(meta.labelKey)}
                  </span>
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
