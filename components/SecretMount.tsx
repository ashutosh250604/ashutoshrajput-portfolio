'use client'

import dynamic from 'next/dynamic'

/**
 * Blueprint, Signal, Press proof, Ink, the visitor's slip and the key sheet, in
 * a chunk of their own.
 *
 * Same reasoning as MiniOSMount: they are hidden, so the page's own weight must
 * not grow for them, and nothing about them belongs in the static export's
 * server render. They still mount on load, so every chord works as soon as the
 * page is interactive - the chunk arrives just after the rest of the JavaScript
 * rather than with it.
 */
const SecretToys = dynamic(() => import('./SecretToys'), { ssr: false })

export default function SecretMount() {
  return <SecretToys />
}
