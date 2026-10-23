'use client'

import { ArrowUpRight } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import type { Project } from '@/data/projects'

/**
 * One project, set as a catalogue entry: index in the left margin, the story in
 * the middle, facts and links in the right column.
 */
export default function ProjectEntry({ project, position }: { project: Project; position: number }) {
  const { t } = useLanguage()

  // `t()` returns the key when a translation is missing; hide those keys.
  const highlights = Array.from({ length: project.highlights }, (_, i) => {
    const key = `project.${project.id}.highlight${i + 1}`
    return { key, value: t(key) }
  }).filter((item) => item.value !== item.key)

  return (
    <article id={project.id} className="grid gap-4 border-t border-rule/15 py-8 sm:gap-6 sm:py-10 md:grid-cols-12">
      <div className="tabular font-mono text-xs text-accent md:col-span-1">
        {String(position + 1).padStart(2, '0')}
      </div>

      <div className="space-y-4 md:col-span-7">
        <h3 className="text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">
          {t(`project.${project.id}.title`)}
        </h3>

        <p className="max-w-2xl text-sm leading-relaxed text-muted sm:text-base">
          {t(`project.${project.id}.description`)}
        </p>

        {highlights.length > 0 ? (
          <ul className="space-y-1.5">
            {highlights.map((item) => (
              <li key={item.key} className="flex gap-3 text-sm leading-relaxed">
                <span aria-hidden className="font-mono text-accent">
                  -
                </span>
                <span>{item.value}</span>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="space-y-4 md:col-span-4 md:pl-6">
        <div className="tabular flex items-center gap-3 font-mono text-[11px] uppercase tracking-[0.18em] text-muted">
          <span>{project.year}</span>
          <span aria-hidden className="h-px w-4 bg-rule/30" />
          <span>{t(`projects.status.${project.status}`)}</span>
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">{t('projects.tech')}</p>
          <ul className="mt-2 flex flex-wrap gap-x-2 gap-y-1.5">
            {project.tech.map((item) => (
              <li key={item} className="font-mono text-xs text-ink/80">
                [{item}]
              </li>
            ))}
          </ul>
        </div>

        {(project.github || project.live) && (
          <div className="flex flex-wrap gap-4 pt-1">
            {project.github ? (
              <a
                href={project.github}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 font-mono text-xs underline-offset-4 hover:text-accent hover:underline hover:text-accent"
              >
                {t('projects.viewCode')}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ) : null}
            {project.live ? (
              <a
                href={project.live}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-1.5 font-mono text-xs underline-offset-4 hover:text-accent hover:underline hover:text-accent"
              >
                {t('projects.viewLive')}
                <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            ) : null}
          </div>
        )}
      </div>
    </article>
  )
}
