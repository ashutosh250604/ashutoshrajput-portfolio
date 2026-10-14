'use client'

import { ArrowUpRight } from 'lucide-react'
import SectionHeader from './SectionHeader'
import ProjectEntry from './ProjectEntry'
import projects, { profileUrl } from '@/data/projects'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ProjectsList() {
  const { t } = useLanguage()

  return (
    <section id="projects" className="border-t border-rule/15">
      <div className="mx-auto max-w-6xl border-x border-rule/15 px-5 py-16 sm:px-8 sm:py-24">
        <SectionHeader
          index="02"
          note={t('projects.note')}
          title={
            <>
              {t('projects.title')}{' '}
              <span className="text-accent">{t('projects.title.highlight')}</span>
            </>
          }
          subtitle={t('projects.subtitle')}
        />

        <div className="mt-10 sm:mt-12">
          {projects.map((project, index) => (
            <ProjectEntry key={project.id} project={project} position={index} />
          ))}

          <div className="flex flex-wrap items-baseline justify-between gap-3 border-t border-rule/15 pt-6">
            <p className="font-mono text-xs text-muted">{t('projects.more')}</p>
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-1.5 font-mono text-xs underline-offset-4 hover:text-accent hover:underline hover:text-accent"
            >
              {t('projects.moreCta')}
              <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
