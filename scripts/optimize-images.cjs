#!/usr/bin/env node
/**
 * Sizes the artwork the way the page actually uses it.
 *
 * The hero plate is at most 232px wide, so the 2x file is 512px — the original
 * avatar.jpg the site shipped was 573 KB, which is more than every other asset
 * on the page put together. Run this again after replacing public/avatar.jpg;
 * the page then serves avatar.webp with avatar.jpg as the fallback.
 *
 * Usage: npm run images
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const jpg = path.join(__dirname, '..', 'public', 'avatar.jpg')
const webp = jpg.replace(/\.jpg$/, '.webp')
const SIZE = 512

const kb = (bytes) => `${(bytes / 1024).toFixed(0)} KB`

async function main() {
  const input = fs.readFileSync(jpg)
  const before = await sharp(input).metadata()
  console.log(`source  ${before.width}x${before.height}, ${kb(input.length)}`)

  // `.rotate()` applies any EXIF orientation and drops the tag, so the resized
  // files face the same way the browser was already drawing the original.
  const base = sharp(input).rotate().resize(SIZE, SIZE, { fit: 'cover', position: 'centre' })

  const webpBuffer = await base.clone().webp({ quality: 80, effort: 5 }).toBuffer()
  const jpgBuffer = await base.clone().jpeg({ quality: 85, mozjpeg: true }).toBuffer()

  fs.writeFileSync(webp, webpBuffer)
  fs.writeFileSync(jpg, jpgBuffer)

  console.log(`avatar.webp  ${SIZE}x${SIZE}, ${kb(webpBuffer.length)}`)
  console.log(`avatar.jpg   ${SIZE}x${SIZE}, ${kb(jpgBuffer.length)} (fallback)`)
  console.log(`saved ${kb(input.length - Math.min(webpBuffer.length, jpgBuffer.length))} on the wire`)
}

main().catch((error) => {
  console.error(`image optimisation failed: ${error.message}`)
  process.exit(1)
})
