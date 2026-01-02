'use client'

import ProjectCard from './ProjectCard'
import projects from '@/data/projects'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ProjectsGrid() {
  const { t } = useLanguage()
  // Showing only featured projects (first 6)
  const featuredProjects = projects.slice(0, 6)

  return (
    <section id="projects" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-8 sm:space-y-10 md:space-y-12 animate-slide-up">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              {t('projects.title')} <span className="gradient-text">{t('projects.title.highlight')}</span>
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
            <p className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              {t('projects.subtitle')}
            </p>
          </div>

          <div className="grid xs:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
            {featuredProjects.map((project, index) => (
              <ProjectCard key={project.id} project={project} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}