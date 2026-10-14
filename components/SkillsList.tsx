'use client'

import SectionHeader from './SectionHeader'
import skills from '@/data/skills'
import { useLanguage } from '@/contexts/LanguageContext'

const categoryKeys: Record<string, string> = {
  languages: 'skills.languages',
  frontend: 'skills.frontend',
  backend: 'skills.backend',
  database: 'skills.database',
  tools: 'skills.tools',
}

export default function SkillsList() {
  const { t } = useLanguage()

  return (
    <section id="skills" className="border-t border-rule/15">
      <div className="mx-auto max-w-6xl border-x border-rule/15 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeader
          index="04"
          subtitle={t('skills.subtitle')}
          title={
            <>
              {t('skills.title')}{' '}
              <span className="text-accent">{t('skills.title.highlight')}</span>
            </>
          }
        />

        <div className="mt-10 grid gap-8 sm:mt-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-3">
          {Object.entries(skills).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-baseline justify-between gap-4 border-b border-rule/15 pb-2">
                <h3 className="font-mono text-xs uppercase tracking-[0.18em]">
                  {categoryKeys[category] ? t(categoryKeys[category]) : category}
                </h3>
                <span className="tabular font-mono text-[10px] text-muted">
                  {String(items.length).padStart(2, '0')}
                </span>
              </div>

              <ul className="mt-3 flex flex-wrap gap-1.5">
                {items.map((skill) => (
                  <li
                    key={skill}
                    className="rounded-sm border border-rule/15 px-2 py-1 font-mono text-[11px] text-ink/85 transition-colors hover:border-accent hover:text-accent"
                  >
                    {skill}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
