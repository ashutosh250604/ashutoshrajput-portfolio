'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import Logo from './Logo'
import ThemeToggle from './ThemeToggle'
import LanguageToggle from './LanguageToggle'
import MobileNav from './MobileNav'
import { openPalette } from './CommandPalette'
import { Menu, Search } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

const navItems = [
  { key: 'nav.home', href: '#home', index: '' },
  { key: 'nav.about', href: '#about', index: '01' },
  { key: 'nav.projects', href: '#projects', index: '02' },
  { key: 'nav.experience', href: '#experience', index: '03' },
  { key: 'nav.skills', href: '#skills', index: '04' },
  { key: 'nav.contact', href: '#contact', index: '05' },
]

export default function Navbar() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [activeSection, setActiveSection] = useState('home')
  const menuButtonRef = useRef<HTMLButtonElement>(null)
  const { t } = useLanguage()

  const navLinks = navItems.map((item) => ({
    name: t(item.key),
    href: item.href,
    index: item.index,
  }))

  useEffect(() => {
    const targets = navItems
      .map((item) => document.getElementById(item.href.slice(1)))
      .filter((element): element is HTMLElement => Boolean(element))

    // One observer instead of reading layout on every scroll event.
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        if (visible) setActiveSection(visible.target.id)
      },
      { rootMargin: '-45% 0px -50% 0px', threshold: 0 }
    )

    targets.forEach((target) => observer.observe(target))

    const onScroll = () => setIsScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [])

  return (
    <>
      <nav
        className={`fixed inset-x-0 top-0 z-50 border-b transition-colors duration-300 ${
          isScrolled ? 'border-rule/15 bg-paper/85 backdrop-blur-sm' : 'border-transparent bg-transparent'
        }`}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 border-x border-rule/15 px-5 sm:h-16 sm:px-8">
          <Logo />

          <div className="hidden items-center gap-0.5 md:flex">
            {navLinks.map((link) => {
              const isActive = activeSection === link.href.slice(1)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive ? 'true' : undefined}
                  className={`flex items-baseline gap-1.5 rounded-sm px-3 py-2 font-mono text-[11px] uppercase tracking-[0.14em] transition-colors ${
                    isActive ? 'text-accent' : 'text-muted hover:text-ink'
                  }`}
                >
                  {/* No extra opacity: muted is already 5:1 on the paper, and
                      dimming it further took these numbers to 2.4:1. */}
                  {link.index ? <span className="tabular text-[9px] text-muted">{link.index}</span> : null}
                  {link.name}
                </Link>
              )
            })}
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={openPalette}
              aria-label={t('a11y.openPalette')}
              className="hidden items-center gap-2 rounded-sm border border-rule/20 px-2.5 py-1.5 font-mono text-[11px] text-muted transition-colors hover:border-accent hover:text-accent sm:flex"
            >
              <Search className="h-3.5 w-3.5" />
              <span className="tabular">⌘K</span>
            </button>
            <ThemeToggle />
            <LanguageToggle />
            <button
              ref={menuButtonRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="rounded-sm p-2 transition-colors hover:text-accent md:hidden"
              aria-label={t('a11y.openMenu')}
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      <MobileNav
        isOpen={isMobileMenuOpen}
        // Send focus back to the hamburger, where it came from.
        onClose={() => {
          setIsMobileMenuOpen(false)
          menuButtonRef.current?.focus()
        }}
        navLinks={navLinks}
        activeSection={activeSection}
      />
    </>
  )
}
