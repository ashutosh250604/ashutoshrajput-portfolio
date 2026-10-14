'use client'

import { useCallback, useEffect, useState } from 'react'
import SectionHeader from './SectionHeader'
import SocialLinks from './SocialLinks'
import { emailAddress } from '@/data/socials'
import { useLanguage } from '@/contexts/LanguageContext'

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    // navigator.clipboard needs a secure context; fall back for plain http
    try {
      const field = document.createElement('textarea')
      field.value = value
      field.setAttribute('readonly', '')
      field.style.position = 'fixed'
      field.style.opacity = '0'
      document.body.appendChild(field)
      field.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(field)
      return ok
    } catch {
      return false
    }
  }
}

export default function ContactSection() {
  const { t } = useLanguage()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = setTimeout(() => setCopied(false), 2000)
    return () => clearTimeout(timer)
  }, [copied])

  const handleCopy = useCallback(async () => {
    const ok = await copyText(emailAddress)
    if (ok) setCopied(true)
  }, [])

  return (
    <section id="contact" className="border-t border-rule/15">
      <div className="mx-auto max-w-6xl border-x border-rule/15 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeader
          index="05"
          note={t('contact.connect')}
          title={
            <>
              {t('contact.title')}{' '}
              <span className="text-accent">{t('contact.title.highlight')}</span>
            </>
          }
          subtitle={t('contact.subtitle')}
        />

        <div className="mt-10 grid gap-10 sm:mt-12 md:grid-cols-12 md:gap-12">
          <div className="space-y-6 md:col-span-7">
            <div>
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('contact.email')}</p>
              <a
                href={`mailto:${emailAddress}`}
                className="mt-2 inline-block break-all font-mono text-base underline-offset-4 hover:text-accent hover:underline hover:text-accent sm:text-xl"
              >
                {emailAddress}
              </a>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={`mailto:${emailAddress}`}
                className="rounded-sm bg-ink px-4 py-2 font-mono text-xs text-paper transition-opacity hover:opacity-85"
              >
                {t('contact.sendEmail')}
              </a>
              <button
                type="button"
                onClick={handleCopy}
                aria-label={t('a11y.copyEmail')}
                className="tabular rounded-sm border border-rule/20 px-4 py-2 font-mono text-xs transition-colors hover:border-accent hover:text-accent"
              >
                {copied ? t('contact.copied') : t('contact.copy')}
              </button>
              <a
                href="/resume.pdf"
                download
                className="rounded-sm border border-rule/20 px-4 py-2 font-mono text-xs transition-colors hover:border-accent hover:text-accent"
              >
                {t('mobileNav.downloadResume')}
              </a>
            </div>

            <dl className="divide-y divide-rule/15 border-y border-rule/15 font-mono text-xs">
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <dt className="uppercase tracking-[0.18em] text-muted">{t('contact.location')}</dt>
                <dd className="sm:text-right">{t('contact.locationValue')}</dd>
              </div>
              <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                <dt className="uppercase tracking-[0.18em] text-muted">{t('contact.availability')}</dt>
                <dd className="sm:text-right">{t('hero.openToWork')}</dd>
              </div>
            </dl>
          </div>

          <div className="space-y-5 md:col-span-5 md:pl-6">
            <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{t('contact.cta')}</h3>
            <p className="text-sm leading-relaxed text-muted sm:text-base">{t('contact.ctaDescription')}</p>

            <div className="space-y-3 border-t border-rule/15 pt-5">
              <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('contact.social')}</p>
              <SocialLinks />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
