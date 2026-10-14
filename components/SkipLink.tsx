'use client'

import { useLanguage } from '@/contexts/LanguageContext'

/**
 * The first thing a keyboard reaches: one tab lands here, the next one is past
 * the navigation. Hidden until focused (see `.skip-link` in app/globals.css).
 */
export default function SkipLink() {
  const { t } = useLanguage()

  return (
    <a href="#main" className="skip-link">
      {t('a11y.skipToContent')}
    </a>
  )
}
