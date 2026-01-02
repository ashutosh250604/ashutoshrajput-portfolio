'use client'

import { useLanguage } from '@/contexts/LanguageContext'

export default function Footer() {
  const currentYear = new Date().getFullYear()
  const { t } = useLanguage()

  return (
    <footer className="bg-gray-50 dark:bg-gray-900/50 py-6 sm:py-8 px-4 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3 sm:gap-4">
          <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm text-center md:text-left">
            © {currentYear} | {t('footer.builtWith')}
          </p>
          
          <div className="flex gap-4 sm:gap-6">
            <a
              href="https://github.com/ashutosh250604"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-xs sm:text-sm"
            >
              GitHub
            </a>
            <a
              href="https://www.linkedin.com/in/ashutosh-rajput-67326b2b3/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-xs sm:text-sm"
            >
              LinkedIn
            </a>
            <a
              href="/resume.pdf"
              download
              className="text-gray-600 dark:text-gray-400 hover:text-primary-500 transition-colors text-xs sm:text-sm"
            >
              {t('hero.resume')}
            </a>
          </div>
        </div>

        <div className="mt-3 sm:mt-4 text-center">
          <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-500">
            {t('footer.builtBy')}
          </p>
        </div>
      </div>
    </footer>
  )
}