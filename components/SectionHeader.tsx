import { ReactNode } from 'react'

export interface SectionHeaderProps {
  /** Two-digit section number, language neutral by design. */
  index: string
  title: ReactNode
  subtitle?: string
  /** Right-aligned monospace metadata, e.g. "04 projects · 2025 - 2026". */
  note?: string
}

/**
 * The one repeated furniture of the site: an index number, a rule running to
 * the right margin, an optional metadata note, then the heading.
 */
export default function SectionHeader({ index, title, subtitle, note }: SectionHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <span className="tabular font-mono text-xs text-accent">{index}</span>
        <span aria-hidden className="h-px flex-1 bg-rule/20" />
        {note ? (
          <span className="tabular font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:text-[11px]">
            {note}
          </span>
        ) : null}
      </div>

      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl md:text-4xl">{title}</h2>

      {subtitle ? <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">{subtitle}</p> : null}
    </header>
  )
}
