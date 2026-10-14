'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * Both classes, not just `dark`: with no JavaScript the stylesheet falls back to
 * the system preference, so an explicit choice of light on a dark system has to
 * be recorded as a class for it to beat that media query.
 */
function apply(theme: 'light' | 'dark') {
  const classes = document.documentElement.classList
  classes.toggle('dark', theme === 'dark')
  classes.toggle('light', theme === 'light')
}

export default function ThemeToggle() {
  const { t } = useLanguage()
  const [theme, setTheme] = useState<'light' | 'dark'>('light')

  useEffect(() => {
    // The pre-paint script in layout.tsx has already decided the theme, so
    // this only syncs the button's own state with it.
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initial = saved ?? (prefersDark ? 'dark' : 'light')

    apply(initial)
  }, [])

  const label = theme === 'light' ? t('a11y.switchToDark') : t('a11y.switchToLight')

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    localStorage.setItem('theme', next)
    apply(next)
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={label}
      title={label}
      className="rounded-sm border border-rule/20 p-2 transition-colors hover:border-accent hover:text-accent"
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  )
}
