'use client'

import { Github, ExternalLink } from 'lucide-react'

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
  return (
    <div
      className="group glass rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-slide-up"
      style={{ animationDelay: `${index * 100}ms` }}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-primary-500/10 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-purple-500 rounded" />
        </div>
        
        <div className="flex gap-2">
          {project.github && (
            <a
              href={project.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="View source code"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
          {project.live && (
            <a
              href={project.live}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
              aria-label="View live demo"
            >
              <ExternalLink className="w-5 h-5" />
            </a>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="space-y-4">
        <div>
          <h3 className="text-xl font-bold mb-2 group-hover:text-primary-500 transition-colors">
            {project.title}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
            {project.description}
          </p>
        </div>

        {/* Tech Stack */}
        <div className="flex flex-wrap gap-2">
          {project.tech.map((tech) => (
            <span
              key={tech}
              className="px-3 py-1 text-xs font-medium bg-primary-500/10 text-primary-600 dark:text-primary-400 rounded-full"
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