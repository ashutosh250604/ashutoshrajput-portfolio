'use client'

import { Mail, MapPin, Phone } from 'lucide-react'
import SocialBar from './SocialBar'
import { useLanguage } from '@/contexts/LanguageContext'

export default function ContactSection() {
  const { t } = useLanguage()

  return (
    <section id="contact" className="py-12 sm:py-16 md:py-20 px-3 sm:px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="space-y-8 sm:space-y-10 md:space-y-12 animate-slide-up">
          <div className="text-center space-y-3 sm:space-y-4">
            <h2 className="text-xl xs:text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold">
              {t('contact.title')} <span className="gradient-text">{t('contact.title.highlight')}</span>
            </h2>
            <div className="w-16 sm:w-20 h-1 bg-gradient-to-r from-primary-500 to-purple-500 mx-auto rounded-full" />
            <p className="text-xs xs:text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto px-2">
              {t('contact.subtitle')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Contact Info */}
            <div className="space-y-4 sm:space-y-6">
              <div className="glass rounded-xl p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6 hover:shadow-xl transition-all">
                <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-3 sm:mb-4">{t('contact.connect')}</h3>
                
                <a
                  href="mailto:ashutoshrajput2506@gmail.com"
                  className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors group"
                >
                  <div className="p-2 sm:p-3 bg-primary-500/10 rounded-lg group-hover:bg-primary-500/20 transition-colors flex-shrink-0">
                    <Mail className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold mb-1 text-sm sm:text-base">{t('contact.email')}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 break-all">
                      ashutoshrajput2506atgmaildotcom
                    </p>
                  </div>
                </a>

                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg">
                  <div className="p-2 sm:p-3 bg-primary-500/10 rounded-lg flex-shrink-0">
                    <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-primary-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold mb-1 text-sm sm:text-base">{t('contact.location')}</p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      {t('contact.locationValue')}
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    {t('contact.social')}
                  </p>
                  <SocialBar />
                </div>
              </div>
            </div>

            {/* Quick Message CTA */}
            <div className="glass rounded-xl p-4 sm:p-6 md:p-8 flex flex-col justify-center hover:shadow-xl transition-all">
              <div className="space-y-4 sm:space-y-6 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full flex items-center justify-center mx-auto">
                  <Phone className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                
                <div>
                  <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">{t('contact.cta')}</h3>
                  <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
                    {t('contact.ctaDescription')}
                  </p>
                </div>

                <a
                  href="mailto:ashutoshrajput2506@gmail.com?subject=Let's%20Connect"
                  className="inline-block w-full xs:w-auto px-5 py-2.5 sm:px-6 sm:py-3 md:px-8 md:py-4 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:shadow-lg hover:scale-105 font-semibold text-xs sm:text-sm md:text-base"
                >
                  {t('contact.sendEmail')}
                </a>

                <a
                  href="/resume.pdf"
                  download
                  className="inline-block w-full xs:w-auto px-5 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 glass rounded-lg hover:shadow-lg transition-all hover:scale-105 font-semibold text-xs sm:text-sm md:text-base"
                >
                  {t('mobileNav.downloadResume')}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}