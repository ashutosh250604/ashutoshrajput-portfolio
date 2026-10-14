'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import projects, { profileUrl } from '@/data/projects'
import { emailAddress, socials } from '@/data/socials'
import { lockScroll, unlockScroll } from '@/lib/scrollLock'
import { dealDeck } from './CardDeckEgg'
import { useLanguage } from '@/contexts/LanguageContext'

const OPEN_EVENT = 'portfolio:open-palette'

/** Lets any other component open the palette without prop drilling. */
export function openPalette() {
  window.dispatchEvent(new Event(OPEN_EVENT))
}

interface PaletteItem {
  id: string
  label: string
  hint?: string
  group: string
  href: string
  external?: boolean
  /** Internal actions instead of navigation. */
  action?: 'deck'
}

export default function CommandPalette() {
  const { t } = useLanguage()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const pendingRef = useRef<PaletteItem | null>(null)

  const items: PaletteItem[] = useMemo(() => {
    const sections: { key: string; href: string; index: string }[] = [
      { key: 'nav.home', href: '#home', index: '00' },
      { key: 'nav.about', href: '#about', index: '01' },
      { key: 'nav.projects', href: '#projects', index: '02' },
      { key: 'nav.experience', href: '#experience', index: '03' },
      { key: 'nav.skills', href: '#skills', index: '04' },
      { key: 'nav.contact', href: '#contact', index: '05' },
    ]

    return [
      ...sections.map((section) => ({
        id: `section-${section.href.slice(1)}`,
        label: t(section.key),
        hint: section.index,
        group: t('palette.sections'),
        href: section.href,
      })),
      ...projects.map((project) => ({
        id: `project-${project.id}`,
        label: t(`project.${project.id}.title`),
        hint: project.year,
        group: t('palette.projects'),
        href: `#${project.id}`,
      })),
      {
        id: 'link-github',
        label: 'GitHub',
        hint: '↗',
        group: t('palette.links'),
        href: profileUrl,
        external: true,
      },
      ...socials
        .filter((social) => social.name !== 'GitHub')
        .map((social) => ({
          id: `link-${social.name.toLowerCase()}`,
          label: social.name === 'Email' ? emailAddress : social.name,
          hint: '↗',
          group: t('palette.links'),
          href: social.url,
          external: true,
        })),
      {
        id: 'link-resume',
        label: t('hero.resume'),
        hint: 'PDF',
        group: t('palette.links'),
        href: '/resume.pdf',
        external: true,
      },
      {
        id: 'action-deck',
        label: t('egg.palette'),
        hint: '↑↑↓↓←→←→BA',
        group: t('palette.secret'),
        href: '',
        action: 'deck',
      },
    ]
  }, [t])

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return items
    return items.filter((item) => `${item.label} ${item.group} ${item.hint ?? ''}`.toLowerCase().includes(needle))
  }, [items, query])

  const groups = useMemo(() => {
    const order: string[] = []
    matches.forEach((item) => {
      if (!order.includes(item.group)) order.push(item.group)
    })
    return order.map((name) => ({ name, items: matches.filter((item) => item.group === name) }))
  }, [matches])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen((previous) => !previous)
        return
      }
      if (event.key === 'Escape') setOpen(false)
    }

    const onOpen = () => setOpen(true)

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener(OPEN_EVENT, onOpen)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener(OPEN_EVENT, onOpen)
    }
  }, [])

  useEffect(() => {
    if (!open) return

    setQuery('')
    setActive(0)
    lockScroll()
    inputRef.current?.focus()

    return () => unlockScroll()
  }, [open])

  useEffect(() => {
    listRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' })
  }, [active, matches])

  // Navigating is deferred until after the palette has closed and released the
  // body scroll lock, otherwise the scroll target is ignored.
  useEffect(() => {
    const item = pendingRef.current
    if (open || !item) return

    pendingRef.current = null
    document.getElementById(item.href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', item.href)
  }, [open])

  const go = (item: PaletteItem) => {
    if (item.action === 'deck') {
      setOpen(false)
      dealDeck()
      return
    }
    if (item.external) {
      setOpen(false)
      window.open(item.href, '_blank', 'noopener,noreferrer')
      return
    }
    pendingRef.current = item
    setOpen(false)
  }

  if (!open) return null

  const activeItem = matches[active]

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center px-4 pt-[12vh]">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={() => setOpen(false)} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('palette.hint')}
        onKeyDown={(event) => {
          // Keep Tab inside the dialog.
          if (event.key !== 'Tab') return
          const focusable = Array.from(event.currentTarget.querySelectorAll<HTMLElement>('input, button'))
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
        className="relative w-full max-w-lg animate-slide-down rounded-sm border border-rule/20 bg-paper shadow-2xl"
      >
        <div className="flex items-center gap-3 border-b border-rule/15 px-4">
          <Search className="h-4 w-4 shrink-0 text-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActive(0)
            }}
            onKeyDown={(event) => {
              if (event.key === 'ArrowDown') {
                event.preventDefault()
                setActive((index) => Math.min(index + 1, matches.length - 1))
              } else if (event.key === 'ArrowUp') {
                event.preventDefault()
                setActive((index) => Math.max(index - 1, 0))
              } else if (event.key === 'Enter' && activeItem) {
                event.preventDefault()
                go(activeItem)
              }
            }}
            role="combobox"
            aria-expanded="true"
            aria-controls="palette-list"
            aria-activedescendant={activeItem ? `palette-item-${activeItem.id}` : undefined}
            placeholder={t('palette.placeholder')}
            autoComplete="off"
            spellCheck={false}
            className="w-full bg-transparent py-3.5 font-mono text-sm outline-none placeholder:text-muted"
          />
          <kbd className="hidden shrink-0 rounded-sm border border-rule/20 px-1.5 py-0.5 font-mono text-[10px] text-muted sm:block">
            esc
          </kbd>
        </div>

        <div
          ref={listRef}
          id="palette-list"
          role="listbox"
          aria-label={t('palette.placeholder')}
          className="max-h-80 overflow-y-auto py-2"
        >
          {matches.length === 0 ? (
            <p className="px-4 py-6 font-mono text-xs text-muted">{t('palette.empty')}</p>
          ) : (
            groups.map((group) => (
              <div key={group.name}>
                <p className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{group.name}</p>
                {group.items.map((item) => {
                  const position = matches.indexOf(item)
                  const isActive = position === active
                  return (
                    <button
                      key={item.id}
                      id={`palette-item-${item.id}`}
                      type="button"
                      role="option"
                      aria-selected={isActive}
                      data-active={isActive}
                      onMouseEnter={() => setActive(position)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center justify-between gap-3 px-4 py-2 text-left font-mono text-xs transition-colors ${
                        isActive ? 'bg-accent/10 text-accent' : 'text-ink/85'
                      }`}
                    >
                      <span className="truncate">{item.label}</span>
                      {/* The hint darkens with the row: muted on the active
                          tint measured 4.38:1, just under AA. */}
                      {item.hint ? (
                        <span
                          className={`tabular shrink-0 text-[10px] ${
                            isActive ? 'text-ink/70' : 'text-muted'
                          }`}
                        >
                          {item.hint}
                        </span>
                      ) : null}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
