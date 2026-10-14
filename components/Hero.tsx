'use client'

import { useEffect, useState, useMemo } from 'react'
import { Download, ArrowDown } from 'lucide-react'
import { socials } from '@/data/socials'
import { useLanguage } from '@/contexts/LanguageContext'

/**
 * The four buttons sit on the outer ring at the diagonals, clockwise from the
 * top left. 20%/80% of the plate puts each centre on a radius of about 42% of
 * the width — the same radius as the ring they ride on (inset 8%), so they read
 * as nodes on a wire instead of dots floating in the margin.
 */
const orbitPositions = [
  'left-[20%] top-[20%]',
  'left-[80%] top-[20%]',
  'left-[80%] top-[80%]',
  'left-[20%] top-[80%]',
]

/** Labels sit outside the ring: above the top pair, below the bottom pair. */
const labelPositions = [
  'bottom-full mb-1.5',
  'bottom-full mb-1.5',
  'top-full mt-1.5',
  'top-full mt-1.5',
]

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
    <section id="home" className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-3 pb-8 pt-16 sm:px-4 sm:pb-0 sm:pt-20">
      <div className="container mx-auto max-w-6xl">
        <div className="grid items-center gap-8 sm:gap-10 md:grid-cols-2 md:gap-12">
          {/* Left Content */}
          <div className="order-2 space-y-4 text-center animate-slide-up sm:space-y-6 md:order-1 md:text-left">
            <div className="space-y-2">
              <p className="text-sm text-muted sm:text-base md:text-lg">{t('hero.greeting')}</p>
              <h1 className="break-words text-2xl font-bold xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl">
                <span>{t('hero.name')}</span>
              </h1>
              <div className="flex h-8 items-center justify-center sm:h-10 md:h-12 md:justify-start">
                <p className="text-base font-semibold text-accent sm:text-lg md:text-2xl lg:text-3xl">
                  {displayedText}
                  <span className="animate-pulse">|</span>
                </p>
              </div>
            </div>

            <p className="mx-auto max-w-xl text-sm text-ink/80 sm:text-base md:mx-0 md:text-lg">
              {t('hero.description')}
            </p>

            <div className="flex flex-wrap justify-center gap-3 sm:gap-4 md:justify-start">
              <a
                href="#contact"
                className="rounded-sm bg-accent px-4 py-2 text-xs font-semibold text-accent-on transition-all hover:scale-105 hover:bg-accent-strong hover:shadow-lg sm:px-6 sm:py-2.5 sm:text-sm md:px-8 md:py-3 md:text-base"
              >
                {t('hero.cta')}
              </a>
              <a
                href="/resume.pdf"
                download
                className="glass flex items-center gap-1.5 rounded-sm px-4 py-2 text-xs font-semibold transition-all hover:scale-105 hover:shadow-lg sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm md:px-8 md:py-3 md:text-base"
              >
                <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5" />
                {t('hero.resume')}
              </a>
            </div>
          </div>

          {/* Right Content — the portrait, set as a plate with the links on its ring */}
          <div className="order-1 flex flex-col items-center animate-fade-in md:order-2">
            <div className="relative flex h-60 w-60 items-center justify-center xs:h-64 xs:w-64 sm:h-72 sm:w-72 lg:h-[22rem] lg:w-[22rem]">
              {/* halo, barely there */}
              <span aria-hidden className="absolute inset-[16%] rounded-full bg-accent/[0.07] blur-2xl" />

              {/* the ring the buttons ride on */}
              <span
                aria-hidden
                className="absolute inset-[8%] rounded-full border border-dashed border-rule/30"
              />
              {/* hairline just clear of the portrait */}
              <span aria-hidden className="absolute inset-[14%] rounded-full border border-rule/20" />
              {/* one accent tick, slowly circling the portrait */}
              <span aria-hidden className="absolute inset-[8%] animate-orbit">
                <span className="absolute left-1/2 top-0 h-2.5 w-px -translate-x-1/2 -translate-y-1/2 bg-accent" />
              </span>

              {/**
               * The artwork is a dark scene, so a hard circular cut reads as a
               * sticker pasted on the page. Scaling it slightly past the frame
               * crops the illustration's own dark border, and the paper-toned
               * vignette over the rim fades it into the page — in either theme,
               * because it is drawn in the paper token rather than the artwork's
               * black.
               */}
              <div className="relative h-[66%] w-[66%] overflow-hidden rounded-full bg-paper">
                {/*
                 * 512px source for a 232px plate: enough for a 2x screen, small
                 * enough to be a rounding error next to what the page used to
                 * download. WebP first, JPEG for anything that cannot read it.
                 */}
                <picture>
                  <source srcSet="/avatar.webp" type="image/webp" />
                  <img
                    src="/avatar.jpg"
                    alt="Ashutosh Rajput"
                    width={512}
                    height={512}
                    loading="eager"
                    decoding="async"
                    className="absolute inset-0 h-full w-full scale-105 object-cover object-center"
                  />
                </picture>
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 rounded-full"
                  style={{
                    background:
                      'radial-gradient(circle, rgb(var(--paper) / 0) 62%, rgb(var(--paper) / 0.55) 84%, rgb(var(--paper)) 100%)',
                  }}
                />
              </div>

              {socials.map((social, index) => {
                const Icon = social.icon
                const isExternal = social.url.startsWith('http')
                return (
                  <a
                    key={social.name}
                    href={social.url}
                    target={isExternal ? '_blank' : undefined}
                    rel={isExternal ? 'noopener noreferrer' : undefined}
                    aria-label={social.name}
                    title={social.name}
                    className={`group absolute -translate-x-1/2 -translate-y-1/2 ${orbitPositions[index % orbitPositions.length]} grid h-8 w-8 place-items-center rounded-full border border-rule/30 bg-paper text-muted transition-all duration-200 hover:scale-110 hover:border-accent hover:text-accent sm:h-9 sm:w-9`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span
                      className={`pointer-events-none absolute left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-sm border border-rule/20 bg-paper px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.1em] text-muted opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100 sm:block ${labelPositions[index % labelPositions.length]}`}
                    >
                      {social.name}
                    </span>
                  </a>
                )
              })}
            </div>

            {/* the plaque under the plate */}
            <div className="mt-6 flex items-center gap-2 rounded-sm border border-rule/20 bg-paper px-3 py-1.5 sm:mt-8">
              <span aria-hidden className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
              </span>
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-ink/80">
                {t('hero.openToWork')}
              </span>
              <span aria-hidden className="h-3 w-px bg-rule/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                {t('contact.locationValue')}
              </span>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 animate-bounce sm:block">
          <a href="#about" aria-label={t('hero.scroll')}>
            <ArrowDown className="h-6 w-6 text-muted" />
          </a>
        </div>
      </div>
    </section>
  )
}
