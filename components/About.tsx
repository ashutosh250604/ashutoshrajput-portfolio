'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function About() {
  const { t } = useLanguage()

  return (
    <section id="about" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-6 sm:space-y-8 animate-slide-up">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              {t('about.title')} <span className="gradient-text">{t('about.title.highlight')}</span>
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          </div>

          <div className="glass rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 lg:p-12 space-y-3 sm:space-y-4 md:space-y-6 hover:shadow-2xl transition-all duration-300">
            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('about.paragraph1')}
            </p>

            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('about.paragraph2')}
            </p>

            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('about.paragraph3')}
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-4 md:gap-6 pt-4 sm:pt-6">
              <div className="text-center space-y-1 sm:space-y-2">
                <p className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">7+</p>
                <p className="text-gray-600 dark:text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base">{t('about.stats.projects')}</p>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <p className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">1.5+</p>
                <p className="text-gray-600 dark:text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base">{t('about.stats.experience')}</p>
              </div>
              <div className="text-center space-y-1 sm:space-y-2">
                <p className="text-xl xs:text-2xl sm:text-3xl md:text-4xl font-bold gradient-text">10+</p>
                <p className="text-gray-600 dark:text-gray-400 text-[10px] xs:text-xs sm:text-sm md:text-base">{t('about.stats.technologies')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}