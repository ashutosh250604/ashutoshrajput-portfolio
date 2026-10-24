import type { Metadata } from 'next'
import LostPage from '@/components/LostPage'

/**
 * The page for an address that is not in the export.
 *
 * A custom not-found does two things the built-in one could not: it drops
 * Next's bare "404: This page could not be found" card, whose own <title> was
 * being printed alongside the layout's, and it lets the 404 speak in the site's
 * voice. The status still comes from the host, which serves this file as a real
 * 404 rather than a soft landing at 200.
 */
export const metadata: Metadata = {
  title: '404 - this page is out of print | Ashutosh Rajput',
  description: 'The address you followed is not part of this edition of the portfolio.',
}

export default function NotFound() {
  return <LostPage />
}
