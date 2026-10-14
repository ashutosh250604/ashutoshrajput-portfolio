'use client'

import Link from 'next/link'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * The mark, drawn in the same language as the rest of the page: a hairline
 * square, a two-letter monogram, one accent dot on the corner, and the name
 * set small beside it. No gradient, no image, nothing to load.
 */
export default function Logo({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage()

  return (
    <Link href="/" className="group flex items-center gap-2.5" aria-label="Ashutosh Rajput">
      <span
        aria-hidden
        className="relative grid h-8 w-8 shrink-0 place-items-center rounded-[3px] border border-rule/30 font-mono text-[11px] font-medium tracking-[0.06em] transition-colors duration-200 group-hover:border-accent/70 group-hover:text-accent"
      >
        AR
        <span className="absolute right-0 top-0 h-1.5 w-1.5 -translate-y-1/2 translate-x-1/2 rounded-full bg-accent" />
      </span>

      {compact ? null : (
        <span className="hidden flex-col leading-none sm:flex">
          <span className="text-[13px] font-semibold tracking-tight">Ashutosh Rajput</span>
          <span className="mt-1 font-mono text-[9px] uppercase tracking-[0.16em] text-muted">
            {t('hero.role.backend')}
          </span>
        </span>
      )}
    </Link>
  )
}
