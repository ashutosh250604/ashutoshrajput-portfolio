'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react'
import englishCopy from '@/public/translations/en.json'

export type Language = 'en' | 'ja' | 'zh' | 'es' | 'de' | 'ru' | 'hi' | 'gu'

interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
  translations: Record<string, string>
  isLoaded: boolean
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export const languages: { code: Language; name: string; nativeName: string }[] = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語' },
  { code: 'zh', name: 'Chinese', nativeName: '中文' },
  { code: 'es', name: 'Spanish', nativeName: 'Español' },
  { code: 'de', name: 'German', nativeName: 'Deutsch' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
]

/**
 * English prose lives in exactly one place: public/translations/en.json.
 *
 * It is the same file the /resume route prints from and the same file the other
 * seven locales are checked against, so there is no second copy that can fall
 * out of step with it. Importing it is a bundled module rather than a fetch,
 * which keeps the original guarantee: the English strings are in the
 * prerendered HTML before any JavaScript runs. Only the other languages are
 * fetched, at /translations/<code>.json.
 */
const defaultTranslations: Record<string, string> = englishCopy

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en')
  const [translations, setTranslations] = useState<Record<string, string>>(defaultTranslations)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    try {
      const saved = localStorage.getItem('language') as Language | null
      if (saved && languages.some((entry) => entry.code === saved)) setLanguageState(saved)
    } catch {
      // Storage can be unavailable (private windows, blocked cookies); the
      // page still reads, it just does not remember the choice.
    }
  }, [])

  useEffect(() => {
    // English is embedded, so it needs no fetch and no loading state.
    if (language === 'en') {
      setTranslations(defaultTranslations)
      setIsLoaded(true)
      document.documentElement.lang = 'en'
      return
    }

    let cancelled = false

    const loadTranslations = async () => {
      try {
        const response = await fetch(`/translations/${language}.json`)
        if (!response.ok) throw new Error(`HTTP ${response.status}`)
        const data = await response.json()
        if (cancelled) return
        setTranslations({ ...defaultTranslations, ...data })
        document.documentElement.lang = language
      } catch (error) {
        console.error('Failed to load translations:', error)
        if (cancelled) return
        setTranslations(defaultTranslations)
      } finally {
        if (!cancelled) setIsLoaded(true)
      }
    }

    loadTranslations()

    return () => {
      cancelled = true
    }
  }, [language])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    try {
      localStorage.setItem('language', lang)
    } catch {
      // Same as above: the visit works without being remembered.
    }
  }, [])

  const t = useCallback(
    (key: string): string => translations[key] || defaultTranslations[key] || key,
    [translations]
  )

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, translations, isLoaded }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
