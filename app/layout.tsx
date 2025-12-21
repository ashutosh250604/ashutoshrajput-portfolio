import type { Metadata } from 'next'
import './globals.css'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import ScrollTop from '@/components/ScrollTop'

export const metadata: Metadata = {
  title: 'Ashutosh Rajput | Full Stack Developer',
  description: 'Portfolio of Ashutosh Rajput - Full Stack Developer specializing in React, Node.js, and modern web technologies. Explore my projects and experience.',
  keywords: ['Ashutosh Rajput', 'Full Stack Developer', 'Web Developer', 'React', 'Node.js', 'Portfolio'],
  authors: [{ name: 'Ashutosh Rajput' }],
  openGraph: {
    title: 'Ashutosh Rajput | Full Stack Developer',
    description: 'Full Stack Developer specializing in React, Node.js, and modern web technologies',
    type: 'website',
    url: 'https://ashutoshrajput.vercel.app',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className="antialiased">
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <Footer />
        <ScrollTop />
      </body>
    </html>
  )
}