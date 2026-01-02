'use client'

import skills from '@/data/skills'
import { useLanguage } from '@/contexts/LanguageContext'

export default function SkillsList() {
  const { t } = useLanguage()

  const categoryTranslations: Record<string, string> = {
    languages: t('skills.languages'),
    frontend: t('skills.frontend'),
    backend: t('skills.backend'),
    database: t('skills.database'),
    tools: t('skills.tools'),
  }

  return (
    <section id="skills" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="container mx-auto max-w-6xl">
        <div className="space-y-8 sm:space-y-10 md:space-y-12 animate-slide-up">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              {t('skills.title')} <span className="gradient-text">{t('skills.title.highlight')}</span>
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
            <p className="text-xs xs:text-sm sm:text-base text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              {t('skills.subtitle')}
            </p>
          </div>

          <div className="grid gap-4 sm:gap-6 md:gap-8">
            {Object.entries(skills).map(([category, items], index) => (
              <div
                key={category}
                className="glass rounded-xl p-3 xs:p-4 sm:p-6 md:p-8 hover:shadow-xl transition-all duration-300 animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <h3 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold mb-3 xs:mb-4 sm:mb-6 capitalize">
                  {categoryTranslations[category] || category}
                </h3>
                <div className="flex flex-wrap gap-2 sm:gap-3">
                  {items.map((skill) => (
                    <span
                      key={skill}
                      className="px-3 py-1.5 sm:px-4 sm:py-2 text-sm sm:text-base bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:shadow-lg transition-all duration-200 cursor-default font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}