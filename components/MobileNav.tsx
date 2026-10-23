'use client'

import { useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import Link from 'next/link'
import Logo from './Logo'
import { X } from 'lucide-react'
import { lockScroll, unlockScroll } from '@/lib/scrollLock'
import { useLanguage } from '@/contexts/LanguageContext'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navLinks: { name: string; href: string; index: string }[]
  activeSection: string
}

export default function MobileNav({ isOpen, onClose, navLinks, activeSection }: MobileNavProps) {
  const { t } = useLanguage()
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isOpen) return

    lockScroll()
    closeRef.current?.focus()

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      unlockScroll()
    }
  }, [isOpen, onClose])

  // The panel is the only thing on screen; Tab must not walk into the page
  // behind it.
  const trapTab = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab') return
    const focusable = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>('a[href], button')
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
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[70] md:hidden">
      <div className="absolute inset-0 bg-black/50 animate-fade-in" onClick={onClose} />

      <div
        id="mobile-nav"
        role="dialog"
        aria-modal="true"
        aria-label={t('a11y.openMenu')}
        onKeyDown={trapTab}
        className="absolute inset-y-0 right-0 flex w-72 max-w-[85vw] animate-slide-in-right flex-col border-l border-rule/15 bg-paper px-5 py-5"
      >
        <div className="flex items-center justify-between gap-4">
          <Logo compact />
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="rounded-sm p-2 transition-colors hover:text-accent"
            aria-label={t('a11y.closeMenu')}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="mt-8 flex flex-col">
          {navLinks.map((link) => {
            const isActive = activeSection === link.href.slice(1)
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={onClose}
                aria-current={isActive ? 'true' : undefined}
                className={`flex items-baseline gap-3 border-b border-rule/15 py-3 font-mono text-xs uppercase tracking-[0.14em] transition-colors ${
                  isActive ? 'text-accent' : 'text-muted hover:text-ink'
                }`}
              >
                <span className="tabular text-[9px] text-muted">{link.index || '00'}</span>
                {link.name}
              </Link>
            )
          })}
        </nav>

        <a
          href="/resume.pdf"
          download
          className="mt-auto block rounded-sm bg-ink px-4 py-2.5 text-center font-mono text-xs text-paper transition-opacity hover:opacity-85"
        >
          {t('mobileNav.downloadResume')}
        </a>
      </div>
    </div>
  )
}
