'use client'

import { useEffect, useState } from 'react'
import { ArrowUp } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ScrollTop() {
  const { t } = useLanguage()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const toggleVisibility = () => setIsVisible(window.scrollY > 300)
    toggleVisibility()
    window.addEventListener('scroll', toggleVisibility, { passive: true })
    return () => window.removeEventListener('scroll', toggleVisibility)
  }, [])

  if (!isVisible) return null

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      aria-label={t('a11y.scrollToTop')}
      title={t('a11y.scrollToTop')}
      className="fixed bottom-6 right-6 z-40 animate-fade-in rounded-sm border border-rule/20 bg-paper p-3 transition-colors hover:border-accent hover:text-accent"
    >
      <ArrowUp className="h-4 w-4" />
    </button>
  )
}
