'use client'

import { Github, ExternalLink } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface ProjectCardProps {
  project: {
    id: string
    title: string
    description: string
    tech: string[]
    github?: string
    live?: string
    featured?: boolean
  }
  index: number
}

export default function ProjectCard({ project, index }: ProjectCardProps) {
  const { t } = useLanguage()
  
  // Get translated title and description, fallback to original if not found
  const translatedTitle = t(`project.${project.id}.title`) !== `project.${project.id}.title` 
    ? t(`project.${project.id}.title`) 
    : project.title
  const translatedDescription = t(`project.${project.id}.description`) !== `project.${project.id}.description`
    ? t(`project.${project.id}.description`)
    : project.description

  return (
    <div
      className="group relative glass rounded-xl p-4 sm:p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up overflow-hidden"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3 sm:mb-4">
        <div className="p-2 sm:p-3 bg-primary-500/10 rounded-lg">
          <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded" />
        </div>
        
        <div className="flex gap-1 sm:gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="View source code"
            >
              <Github className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="p-1.5 sm:p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="View live demo"
            >
              <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-3 sm:space-y-4">
        <div>
          <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors">
            {translatedTitle}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm leading-relaxed">
            {translatedDescription}
          </p>
        </div>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Hover overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary-500/0 to-purple-500/0 group-hover:from-primary-500/5 group-hover:to-purple-500/5 rounded-xl transition-all duration-300 pointer-events-none" />
    </div>
  )
}