'use client'

import Blueprint from './Blueprint'
import Signal from './Signal'
import PressProof from './PressProof'
import Ink from './Ink'
import Receipt from './Receipt'
import KeySheet from './KeySheet'

/**
 * The instrument secrets, gathered so they share one chunk.
 *
 * They are grouped rather than mounted directly from the layout for the same
 * reason the desktop is (see MiniOSMount): each is a few hundred lines that
 * renders nothing until it is asked for, and six separate dynamic imports would
 * be six extra requests. One file, one chunk, one request — after the page is
 * interactive, and only for the visitors who go looking.
 */
export default function SecretToys() {
  return (
    <>
      <Blueprint />
      <Signal />
      <PressProof />
      <Ink />
      <Receipt />
      <KeySheet />
    </>
  )
}
