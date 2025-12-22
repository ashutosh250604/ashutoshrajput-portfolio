'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function About() {
  const { t } = useLanguage()

  return (
    <section id="about" className="py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8 animate-slide-up">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold">
              {t('about.title')} <span className="gradient-text">{t('about.title.highlight')}</span>
            </h2>
            <div className="w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
          </div>

          <div className="glass rounded-2xl p-8 md:p-12 space-y-6 hover:shadow-2xl transition-all duration-300">
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('about.paragraph1')}
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('about.paragraph2')}
            </p>

            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              {t('about.paragraph3')}
            </p>

            <div className="grid md:grid-cols-3 gap-6 pt-6">
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold gradient-text">7+</p>
                <p className="text-gray-600 dark:text-gray-400">{t('about.stats.projects')}</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold gradient-text">1.5+</p>
                <p className="text-gray-600 dark:text-gray-400">{t('about.stats.experience')}</p>
              </div>
              <div className="text-center space-y-2">
                <p className="text-4xl font-bold gradient-text">10+</p>
                <p className="text-gray-600 dark:text-gray-400">{t('about.stats.technologies')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}