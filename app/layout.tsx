import type { Metadata, Viewport } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollTop from '@/components/ScrollTop'
import CommandPalette from '@/components/CommandPalette'
import CardDeckEgg from '@/components/CardDeckEgg'
import SkipLink from '@/components/SkipLink'
import { LanguageProvider } from '@/contexts/LanguageContext'

/**
 * Fonts are compiled and served from our own origin instead of pulled in by an
 * `@import` inside the stylesheet: no third-party connection, no second round
 * trip before text can paint, and the preload tags come for free. The families
 * are handed to Tailwind as `--font-sans` / `--font-mono`.
 */
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' })
const mono = JetBrains_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Ashutosh Rajput — Backend Developer',
  description:
    'Ashutosh Rajput, backend developer in Bangalore. Python and Flask with SQL underneath, currently working on GenAI and on data structures and algorithms in Java.',
  keywords: ['Ashutosh Rajput', 'Backend Developer', 'Python', 'Flask', 'SQL', 'Java', 'Bangalore', 'Portfolio'],
  authors: [{ name: 'Ashutosh Rajput' }],
  openGraph: {
    title: 'Ashutosh Rajput — Backend Developer',
    description: 'Python and Flask with SQL underneath; GenAI and DSA in Java on the side.',
    type: 'website',
    url: 'https://ashutoshrajput.vercel.app',
  },
}

/** The colour of the browser's own chrome, per theme. */
export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f7f5ef' },
    { media: '(prefers-color-scheme: dark)', color: '#0b0b0b' },
  ],
}

/**
 * Runs before first paint so a dark-mode visitor never sees a white flash.
 * Kept inline and dependency-free on purpose.
 *
 * It records both states as classes. Without JavaScript the stylesheet falls
 * back to `prefers-color-scheme`, so an explicit choice of light on a dark
 * system has to be written down as a class to win over that media query.
 */
const themeScript = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);}catch(e){}})();`

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${mono.variable}`}
      suppressHydrationWarning
      translate="no"
    >
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="google" content="notranslate" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="notranslate">
        {/*
          * The paper wash is a sibling of the content, not a background on the
          * root or a pseudo-element: either of those becomes the effective
          * background of every text node on the page, and no contrast checker
          * can then say whether a single one of them is legible.
          */}
        <div aria-hidden className="wash" />
        <LanguageProvider>
          <SkipLink />
          <Navbar />
          <main id="main" className="min-h-screen">
            {children}
          </main>
          <Footer />
          <ScrollTop />
          <CommandPalette />
          <CardDeckEgg />
        </LanguageProvider>
      </body>
    </html>
  )
}
