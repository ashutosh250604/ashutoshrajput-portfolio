'use client'

import experience from '@/data/experience'
import { Briefcase, Calendar } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ExperienceList() {
  const { t } = useLanguage()

  // Helper to get translated experience content
  const getTranslatedExp = (exp: typeof experience[0], index: number) => {
    const companyKey = exp.company.toLowerCase().replace(/\s+/g, '')
    return {
      role: t(`experience.${companyKey}.role`) !== `experience.${companyKey}.role` 
        ? t(`experience.${companyKey}.role`) 
        : exp.role,
      company: t(`experience.${companyKey}.company`) !== `experience.${companyKey}.company`
        ? t(`experience.${companyKey}.company`)
        : exp.company,
      description: t(`experience.${companyKey}.description`) !== `experience.${companyKey}.description`
        ? t(`experience.${companyKey}.description`)
        : exp.description,
      achievements: exp.achievements?.map((_, i) => {
        const key = `experience.${companyKey}.achievement${i + 1}`
        return t(key) !== key ? t(key) : exp.achievements![i]
      })
    }
  }

  return (
    <section id="experience" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8 sm:space-y-10 md:space-y-12 animate-slide-up">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              {t('experience.title')} <span className="gradient-text\">{t('experience.title.highlight')}</span>
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          </div>

          <div className="space-y-4 sm:space-y-6">
            {experience.map((exp, index) => {
              const translated = getTranslatedExp(exp, index)
              return (
                <div
                  key={index}
                  className="glass rounded-xl p-3 xs:p-4 sm:p-6 md:p-8 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="flex flex-col md:flex-row md:items-start gap-3 xs:gap-4 sm:gap-6">
                    {/* Company Logo/Icon */}
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 bg-gradient-to-br from-primary-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <Briefcase className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-white" />
                      </div>
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-3 sm:space-y-4 min-w-0">
                      <div>
                        <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">{translated.role}</h3>
                        <a
                          href={exp.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-500 hover:underline font-semibold text-sm sm:text-base"
                        >
                          {translated.company}
                        </a>
                        <div className="flex items-center gap-2 mt-2 text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4" />
                          <span className="text-sm">
                            {exp.start} - {exp.end}
                          </span>
                        </div>
                      </div>

                      <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                        {translated.description}
                      </p>

                      {translated.achievements && (
                        <ul className="space-y-2">
                          {translated.achievements.map((achievement, i) => (
                            <li
                              key={i}
                              className="flex items-start gap-2 text-gray-600 dark:text-gray-400"
                            >
                              <span className="text-primary-500 mt-1">▹</span>
                              <span>{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}