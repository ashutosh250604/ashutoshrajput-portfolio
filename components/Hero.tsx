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
    <section id="home" className="min-h-screen flex items-center justify-center pt-20 px-4">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-6 animate-slide-up">
            <div className="space-y-2">
              <p className="text-lg text-gray-600 dark:text-gray-400">{t('hero.greeting')}</p>
              <h1 className="text-5xl md:text-6xl font-bold">
                <span className="">Ashutosh Rajput</span>
              </h1>
              <div className="h-12 flex items-center">
                <p className="text-2xl md:text-3xl font-semibold text-primary-500">
                  {displayedText}
                  <span className="animate-pulse">|</span>
                </p>
              </div>
            </div>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-xl">
              {t('hero.description')}
            </p>

            <div className="flex flex-wrap gap-4">
              <a
                href="#contact"
                className="px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-all hover:shadow-lg hover:scale-105 font-semibold"
              >
                {t('hero.cta')}
              </a>
              <a
                href="/resume.pdf"
                download
                className="px-8 py-3 glass rounded-lg hover:shadow-lg transition-all hover:scale-105 font-semibold flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                {t('hero.resume')}
              </a>
            </div>

            <SocialBar />
          </div>

          {/* Right Content - Avatar Card */}
          <div className="flex justify-center animate-fade-in">
            <div className="relative group">
              {/* Decorative elements */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500 to-purple-500 rounded-full blur-2xl opacity-20 group-hover:opacity-30 transition-opacity" />
              
              <div className="relative glass rounded-full p-2 hover:shadow-2xl transition-all duration-300">
                <div className="relative w-72 h-72 md:w-96 md:h-96 rounded-full overflow-hidden border-4 border-white/20">
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
              <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 glass px-6 py-3 rounded-full backdrop-blur-xl">
                <p className="font-semibold whitespace-nowrap">{t('hero.openToWork')}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <a href="#about" aria-label="Scroll to about section">
            <ArrowDown className="w-6 h-6 text-gray-400" />
          </a>
        </div>
      </div>
    </section>
  )
}