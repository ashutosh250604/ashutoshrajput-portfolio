'use client'

import { useEffect, useState, useMemo } from 'react'
import Image from 'next/image'
import SocialBar from './SocialBar'
import { Download, ArrowDown } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Hero() {
  const { t } = useLanguage()
  const [currentRole, setCurrentRole] = useState(0)
  const [displayedText, setDisplayedText] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  const roles = useMemo(() => [
    t('hero.role.fullstack'),
    t('hero.role.backend'),
    t('hero.role.software'),
    t('hero.role.web')
  ], [t])

  useEffect(() => {
    const timeout = setTimeout(() => {
      const currentFullText = roles[currentRole]
      
      if (!isDeleting) {
        if (displayedText.length < currentFullText.length) {
          setDisplayedText(currentFullText.slice(0, displayedText.length + 1))
        } else {
          setTimeout(() => setIsDeleting(true), 2000)
        }
      } else {
        if (displayedText.length === 0) {
          setIsDeleting(false)
          setCurrentRole((prev) => (prev + 1) % roles.length)
        } else {
          setDisplayedText(displayedText.slice(0, -1))
        }
      }
    }, isDeleting ? 50 : 100)

    return () => clearTimeout(timeout)
  }, [displayedText, isDeleting, currentRole, roles])

  return (
    <section id="home" className="min-h-[100dvh] flex items-center justify-center pt-16 pb-8 sm:pt-20 sm:pb-0 px-3 sm:px-4 overflow-hidden relative">
      <div className="container mx-auto max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6 sm:gap-8 md:gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-4 sm:space-y-6 animate-slide-up order-2 md:order-1 text-center md:text-left">
            <div className="space-y-2">
              <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-400">{t('hero.greeting')}</p>
              <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold break-words">
                <span className="">Ashutosh Rajput</span>
              </h1>
              <div className="h-8 sm:h-10 md:h-12 flex items-center justify-center md:justify-start">
                <p className="text-base sm:text-lg md:text-2xl lg:text-3xl font-semibold text-primary-500">
                  {displayedText}
                  <span className="animate-pulse">|</span>
                </p>
              </div>
            </div>

            <p className="text-sm sm:text-base md:text-lg text-gray-600 dark:text-gray-300 max-w-xl mx-auto md:mx-0">
              {t('hero.description')}
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center md:justify-start">
              <a
                href="#contact"
                className="px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:shadow-lg hover:scale-105 font-semibold text-xs sm:text-sm md:text-base"
              >
                {t('hero.cta')}
              </a>
              <a
                href="/resume.pdf"
                download
                className="px-4 py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3 glass rounded-lg hover:shadow-lg transition-all hover:scale-105 font-semibold flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm md:text-base"
              >
                <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 md:w-5 md:h-5" />
                {t('hero.resume')}
              </a>
            </div>

            <div className="flex justify-center md:justify-start">
              <SocialBar />
            </div>
          </div>

          {/* Right Content - Avatar Card */}
          <div className="flex justify-center animate-fade-in order-1 md:order-2">
            <div className="relative group">
              {/* Decorative elements */}
              <div className="absolute -inset-2 sm:-inset-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full blur-xl sm:blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              
              <div className="relative glass rounded-full p-1.5 sm:p-2 hover:shadow-2xl transition-all duration-300">
                <div className="relative w-32 h-32 xs:w-40 xs:h-40 sm:w-56 sm:h-56 md:w-64 md:h-64 lg:w-80 lg:h-80 xl:w-96 xl:h-96 rounded-full overflow-hidden border-2 sm:border-4 border-white/20">
                  <Image
                    src="/avatar.jpg"
                    alt="Ashutosh Rajput"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Floating badge */}
              <div className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 left-1/2 -translate-x-1/2 glass px-3 py-1.5 sm:px-4 sm:py-2 md:px-6 md:py-3 rounded-full backdrop-blur-xl">
                <p className="font-medium sm:font-semibold whitespace-nowrap text-xs sm:text-sm md:text-base">{t('hero.openToWork')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hidden sm:block absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#about" aria-label="Scroll to about section">
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </a>
        </div>
      </div>
    </section>
  )
}