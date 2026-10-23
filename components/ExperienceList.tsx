'use client'

import SectionHeader from './SectionHeader'
import experience from '@/data/experience'
import { useLanguage } from '@/contexts/LanguageContext'

/** "September 2023" -> "2023.09" so the gutter stays monospace and locale-neutral. */
function toStamp(value: string): string {
  const parsed = new Date(`1 ${value}`)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.getFullYear()}.${String(parsed.getMonth() + 1).padStart(2, '0')}`
}

export default function ExperienceList() {
  const { t } = useLanguage()

  return (
    <section id="experience" className="border-t border-rule/15">
      <div className="mx-auto max-w-6xl border-x border-rule/15 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeader
          index="03"
          title={
            <>
              {t('experience.title')}{' '}
              <span className="text-accent">{t('experience.title.highlight')}</span>
            </>
          }
        />

        <div className="mt-10 sm:mt-12">
          {experience.map((job) => {
            const slug = job.company.toLowerCase().replace(/\s+/g, '')
            const read = (key: string, fallback: string) => {
              const full = `experience.${slug}.${key}`
              const value = t(full)
              return value === full ? fallback : value
            }

            const achievements = (job.achievements ?? [])
              .map((achievement, index) => read(`achievement${index + 1}`, achievement))
              .filter(Boolean)

            return (
              <article
                key={job.company}
                className="grid gap-4 border-t border-rule/15 py-8 sm:py-10 md:grid-cols-12 md:gap-6"
              >
                <p className="tabular font-mono text-xs text-muted md:col-span-3">
                  {toStamp(job.start)} - {toStamp(job.end)}
                </p>

                <div className="space-y-4 md:col-span-9">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold tracking-tight sm:text-xl">{read('role', job.role)}</h3>
                    <a
                      href={job.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-accent underline-offset-4 hover:underline text-accent"
                    >
                      {read('company', job.company)}
                    </a>
                  </div>

                  <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
                    {read('description', job.description)}
                  </p>

                  {achievements.length > 0 ? (
                    <ol className="space-y-3">
                      {achievements.map((achievement, index) => (
                        <li key={index} className="flex gap-3 text-sm leading-relaxed">
                          <span className="tabular font-mono text-[11px] text-muted">
                            {String(index + 1).padStart(2, '0')}
                          </span>
                          <span className="max-w-2xl">{achievement}</span>
                        </li>
                      ))}
                    </ol>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </section>
  )
}
