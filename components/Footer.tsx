'use client'

import { useEffect, useRef, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { profileUrl } from '@/data/projects'
import { revision } from '@/data/colophon'
import { EGG_INDEX_EVENT, eggs, useFoundEggs } from '@/lib/eggs'
import { bindingLabel } from '@/lib/keys'
import { useLocalTime } from '@/lib/localTime'
import { openKeys } from '@/lib/secrets'

const buildStack = 'Next.js 15 · React 18 · Tailwind CSS 3 · TypeScript 5'
const hostedOn = 'Vercel'

/** The colophon: how the site is built, what changed when, and what is hidden. */
export default function Footer() {
  const { t } = useLanguage()
  const time = useLocalTime()
  const currentYear = new Date().getFullYear()

  const found = useFoundEggs()
  const [indexOpen, setIndexOpen] = useState(false)
  const sectionRef = useRef<HTMLElement>(null)
  const scrollOnOpen = useRef(false)

  // The command palette opens the index from anywhere on the page.
  useEffect(() => {
    const onOpen = () => {
      scrollOnOpen.current = true
      setIndexOpen(true)
    }

    window.addEventListener(EGG_INDEX_EVENT, onOpen)
    return () => window.removeEventListener(EGG_INDEX_EVENT, onOpen)
  }, [])

  useEffect(() => {
    if (!indexOpen || !scrollOnOpen.current) return
    scrollOnOpen.current = false
    // A frame's delay: the palette releases the body scroll lock on close, and
    // scrolling before it does is ignored.
    requestAnimationFrame(() =>
      sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    )
  }, [indexOpen])

  // The index is earned: it appears once one of the eggs has been opened.
  const hasSecret = found.length > 0

  const rows: { label: string; value: string; href?: string }[] = [
    { label: t('colophon.built'), value: buildStack },
    { label: t('colophon.host'), value: hostedOn },
    { label: t('colophon.source'), value: 'github.com/ashutosh250604', href: profileUrl },
    { label: t('colophon.updated'), value: revision },
    { label: t('contact.localTime'), value: time ?? '--:--' },
  ]

  return (
    <footer className="border-t border-rule/15">
      <div className="mx-auto max-w-6xl border-x border-rule/15 px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex items-center gap-3 sm:gap-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
            {t('colophon.title')}
          </span>
          <span aria-hidden className="h-px flex-1 bg-rule/20" />
          <span className="hidden font-mono text-[10px] uppercase tracking-[0.18em] text-muted sm:block">
            {t('colophon.note')}
          </span>
        </div>

        <div className="mt-8 grid gap-10 md:grid-cols-12 md:gap-12">
          <dl className="divide-y divide-rule/15 border-y border-rule/15 font-mono text-xs md:col-span-6">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
              >
                <dt className="uppercase tracking-[0.18em] text-muted">{row.label}</dt>
                <dd className="tabular sm:text-right">
                  {row.href ? (
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline-offset-4 hover:text-accent hover:underline"
                    >
                      {row.value}
                    </a>
                  ) : (
                    row.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          <div className="md:col-span-6">
            <h3 className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted">{t('colophon.changelog')}</h3>
            <ul className="mt-3 space-y-2.5">
              {[3, 2, 1].map((entry) => (
                <li key={entry} className="flex gap-3 font-mono text-xs leading-relaxed">
                  <span aria-hidden className="text-accent">
                    ›
                  </span>
                  <span className="text-ink/85">{t(`colophon.change${entry}`)}</span>
                </li>
              ))}
            </ul>

            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-1.5 font-mono text-xs underline-offset-4 hover:text-accent hover:underline"
            >
              {t('projects.moreCta')}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        {hasSecret ? (
          <section ref={sectionRef} className="mt-10 border-t border-rule/15 pt-6">
            <button
              type="button"
              onClick={() => setIndexOpen((open) => !open)}
              aria-expanded={indexOpen}
              className="group flex w-full items-center gap-3 text-left"
            >
              <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-accent">
                {t('colophon.secrets')}
              </span>
              <span aria-hidden className="h-px flex-1 bg-rule/20" />
              <span className="tabular font-mono text-[10px] text-muted">
                {found.length}/{eggs.length}
              </span>
            </button>

            {indexOpen ? (
              <div className="mt-5">
                <p className="max-w-2xl font-mono text-xs leading-relaxed text-muted">
                  {t('secrets.note')}
                </p>

                <ul className="mt-4 divide-y divide-rule/15 border-y border-rule/15 font-mono text-xs">
                  {eggs.map((egg) => {
                    const isFound = found.includes(egg.id)
                    return (
                      <li
                        key={egg.id}
                        className="flex flex-wrap items-baseline gap-x-4 gap-y-1 py-3 sm:flex-nowrap"
                      >
                        <span className="flex flex-1 items-baseline gap-2">
                          <span aria-hidden className={isFound ? 'text-accent' : 'text-muted'}>
                            {isFound ? '●' : '○'}
                          </span>
                          <span className={isFound ? 'text-ink/90' : 'text-muted'}>{t(egg.labelKey)}</span>
                        </span>
                        <span className="tabular text-ink/85">{bindingLabel(egg.binding)}</span>
                        <span className="w-full text-[10px] uppercase tracking-[0.14em] text-muted sm:w-24 sm:text-right">
                          {isFound ? t('secrets.found') : t('secrets.unfound')}
                        </span>
                      </li>
                    )
                  })}
                </ul>

                <p className="mt-4 font-mono text-xs text-muted">{t('secrets.hunt')}</p>
              </div>
            ) : null}
          </section>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 border-t border-rule/15 pt-6 font-mono text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="tabular">© {currentYear} - {t('footer.builtBy')}</span>
          <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
            {/* The one visible way into the key sheet. Quiet, but a visitor who
                reads the bottom of a page can find it without being told. */}
            <button
              type="button"
              onClick={openKeys}
              aria-label={t('keys.palette')}
              title={t('keys.palette')}
              className="group inline-flex items-center gap-1.5 transition-colors hover:text-accent"
            >
              <kbd className="rounded-sm border border-rule/25 px-1 py-0.5 font-mono text-[10px] leading-none text-muted transition-colors group-hover:border-accent/50 group-hover:text-accent">
                ?
              </kbd>
              <span className="underline-offset-4 group-hover:underline">{t('keys.palette')}</span>
            </button>
            <span>{t('colophon.nojs')}</span>
          </span>
        </div>
      </div>
    </footer>
  )
}
