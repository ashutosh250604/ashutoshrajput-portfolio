'use client'

import SectionHeader from './SectionHeader'
import { useLanguage } from '@/contexts/LanguageContext'

export default function About() {
  const { t } = useLanguage()

  const specs = [
    { label: t('about.spec.role'), value: t('hero.role.backend') },
    { label: t('about.spec.location'), value: t('contact.locationValue') },
    { label: t('about.spec.education'), value: t('about.education') },
    { label: t('about.spec.focus'), value: t('about.focus') },
    { label: t('about.spec.status'), value: t('hero.openToWork') },
    { label: t('about.spec.stack'), value: t('about.spec.stackValue') },
  ]

  const stats = [
    { value: '07+', label: t('about.stats.projects') },
    { value: '1.5', label: t('about.stats.experience') },
    { value: '10+', label: t('about.stats.technologies') },
  ]

  return (
    <section id="about" className="border-t border-rule/15">
      <div className="mx-auto max-w-6xl border-x border-rule/15 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeader
          index="01"
          title={
            <>
              {t('about.title')}{' '}
              <span className="text-accent">{t('about.title.highlight')}</span>
            </>
          }
        />

        <div className="mt-10 grid gap-10 sm:mt-12 md:grid-cols-12 md:gap-12">
          <div className="space-y-5 text-sm leading-relaxed text-ink/90 sm:text-base md:col-span-7">
            <p>{t('about.paragraph1')}</p>
            <p>{t('about.paragraph2')}</p>
            <p>{t('about.paragraph3')}</p>
          </div>

          <div className="space-y-8 md:col-span-5">
            <dl className="grid grid-cols-3 gap-4 border-y border-rule/15 py-4">
              {stats.map((stat) => (
                <div key={stat.label} className="space-y-1">
                  <dd className="tabular font-mono text-lg sm:text-2xl">{stat.value}</dd>
                  <dt className="font-mono text-[10px] uppercase leading-tight tracking-[0.18em] text-muted">
                    {stat.label}
                  </dt>
                </div>
              ))}
            </dl>

            <dl className="divide-y divide-rule/15 border-b border-rule/15 font-mono text-xs">
              {specs.map((spec) => (
                <div
                  key={spec.label}
                  className="flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6"
                >
                  <dt className="uppercase tracking-[0.18em] text-muted">{spec.label}</dt>
                  <dd className="sm:text-right">{spec.value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
