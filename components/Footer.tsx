'use client'

import { useEffect, useState } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { profileUrl } from '@/data/projects'

const buildStack = 'Next.js 15 · React 18 · Tailwind CSS 3 · TypeScript 5'
const hostedOn = 'Vercel'

function useLocalTime(): string | null {
  const [time, setTime] = useState<string | null>(null)

  useEffect(() => {
    const tick = () => {
      setTime(
        new Intl.DateTimeFormat(undefined, {
          hour: '2-digit',
          minute: '2-digit',
          timeZone: 'Asia/Kolkata',
        }).format(new Date())
      )
    }

    tick()
    const timer = setInterval(tick, 30_000)
    return () => clearInterval(timer)
  }, [])

  return time
}

/** The colophon: how the site is built, and what changed when. */
export default function Footer() {
  const { t } = useLanguage()
  const time = useLocalTime()
  const currentYear = new Date().getFullYear()

  const rows: { label: string; value: string; href?: string }[] = [
    { label: t('colophon.built'), value: buildStack },
    { label: t('colophon.host'), value: hostedOn },
    { label: t('colophon.source'), value: 'github.com/ashutosh250604', href: profileUrl },
    { label: t('colophon.updated'), value: '2026.10' },
    { label: t('contact.localTime'), value: time ?? '— —' },
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
                      className="underline-offset-4 hover:text-accent hover:underline hover:text-accent"
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
              className="group mt-6 inline-flex items-center gap-1.5 font-mono text-xs underline-offset-4 hover:text-accent hover:underline hover:text-accent"
            >
              {t('projects.moreCta')}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-rule/15 pt-6 font-mono text-[11px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <span className="tabular">© {currentYear} — {t('footer.builtBy')}</span>
          <span>{t('colophon.nojs')}</span>
        </div>
      </div>
    </footer>
  )
}
