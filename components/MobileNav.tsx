'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { X } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
  navLinks: { name: string; href: string }[]
  activeSection: string
}

export default function MobileNav({ isOpen, onClose, navLinks, activeSection }: MobileNavProps) {
  const { t } = useLanguage()

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      
      {/* Menu Panel */}
      <div className="absolute right-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-900 shadow-2xl animate-slide-in-right p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          aria-label="Close menu"
        >
          <X className="w-6 h-6" />
        </button>

        <nav className="mt-12 flex flex-col space-y-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={onClose}
              className={`px-4 py-3 rounded-lg transition-all duration-200 ${
                activeSection === link.href.replace('#', '')
                  ? 'text-primary-500 bg-primary-500/10 font-semibold'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              {link.name}
            </Link>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <a
            href="/resume.pdf"
            download
            className="block w-full px-4 py-3 text-center bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-semibold"
          >
            {t('mobileNav.downloadResume')}
          </a>
        </div>
      </div>
    </div>
  )
}