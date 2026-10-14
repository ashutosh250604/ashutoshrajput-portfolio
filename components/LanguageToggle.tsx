'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import { useLanguage, languages } from '@/contexts/LanguageContext'

export default function LanguageToggle() {
  const [isOpen, setIsOpen] = useState(false)
  const { language, setLanguage, t } = useLanguage()
  const containerRef = useRef<HTMLDivElement>(null)
  const optionsRef = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  const focusOption = (index: number) => {
    const count = languages.length
    optionsRef.current[((index % count) + count) % count]?.focus()
  }

  const handleListKeys = (event: React.KeyboardEvent) => {
    const current = optionsRef.current.findIndex((element) => element === document.activeElement)

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      focusOption(current + 1)
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      focusOption(current - 1)
    } else if (event.key === 'Home') {
      event.preventDefault()
      focusOption(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      focusOption(languages.length - 1)
    }
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' && !isOpen) {
            event.preventDefault()
            setIsOpen(true)
            requestAnimationFrame(() => focusOption(0))
          }
        }}
        className="flex items-center gap-1.5 rounded-sm border border-rule/20 px-2 py-2 font-mono text-[11px] uppercase text-muted transition-colors hover:border-accent hover:text-accent"
        aria-label={t('a11y.selectLanguage')}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className="tabular">{language}</span>
        <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div
          role="listbox"
          aria-label={t('a11y.selectLanguage')}
          onKeyDown={handleListKeys}
          className="absolute right-0 z-50 mt-2 w-56 animate-slide-down rounded-sm border border-rule/20 bg-paper py-1 shadow-xl"
        >
          {languages.map((lang, index) => (
            <button
              key={lang.code}
              ref={(element) => {
                optionsRef.current[index] = element
              }}
              type="button"
              role="option"
              aria-selected={language === lang.code}
              onClick={() => {
                setLanguage(lang.code)
                setIsOpen(false)
              }}
              className={`group flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left font-mono text-xs transition-colors hover:bg-accent/10 ${
                language === lang.code ? 'text-accent' : 'text-ink/85'
              }`}
            >
              <span>{lang.nativeName}</span>
              {/* Muted on the hover tint is only 4.4:1, so it darkens with it. */}
              <span className="text-[10px] text-muted group-hover:text-ink/70">{lang.name}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
