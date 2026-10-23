/**
 * Just enough PDF to answer one question: which words does this file contain?
 *
 * Chrome prints with subset Identity-H fonts, so the visible text sits in
 * `<hex> Tj` runs that only make sense mapped back through each font's
 * ToUnicode CMap. This exists so `make-resume.cjs` can prove the finished PDF
 * really contains the resume - it is a check, not a general text extractor.
 */
const fs = require('fs')
const zlib = require('zlib')

/** The stream body of an object, decompressed when it is a Flate stream. */
function streamBody(objectBody) {
  const marker = /stream\r?\n/.exec(objectBody)
  if (!marker) return ''
  const start = marker.index + marker[0].length
  const end = objectBody.indexOf('endstream', start)
  if (end < 0) return ''
  const bytes = Buffer.from(objectBody.slice(start, end), 'latin1')
  try {
    return zlib.inflateSync(bytes).toString('latin1')
  } catch (error) {
    return bytes.toString('latin1')
  }
}

function readObjects(raw) {
  const objects = new Map()
  const re = /(\d+)\s+0\s+obj([\s\S]*?)endobj/g
  let match
  while ((match = re.exec(raw))) objects.set(Number(match[1]), match[2])
  return objects
}

function hexToText(hex) {
  const padded = hex.length % 4 === 0 ? hex : '0'.repeat(4 - (hex.length % 4)) + hex
  let out = ''
  for (let i = 0; i < padded.length; i += 4) out += String.fromCharCode(parseInt(padded.slice(i, i + 4), 16))
  return out
}

/** code (hex string, upper case) -> character */
function parseCmap(text) {
  const map = new Map()

  for (const block of text.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const pair of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>/g)) {
      map.set(pair[1].toUpperCase(), hexToText(pair[2]))
    }
  }

  for (const block of text.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const row of block[1].matchAll(/<([0-9A-Fa-f]+)>\s*<([0-9A-Fa-f]+)>\s*(?:<([0-9A-Fa-f]+)>|\[([^\]]*)\])/g)) {
      const first = parseInt(row[1], 16)
      const last = parseInt(row[2], 16)
      const width = row[1].length

      if (row[3]) {
        const base = parseInt(row[3], 16)
        for (let code = first; code <= last; code += 1) {
          map.set(code.toString(16).toUpperCase().padStart(width, '0'), String.fromCharCode(base + (code - first)))
        }
      } else if (row[4]) {
        const items = [...row[4].matchAll(/<([0-9A-Fa-f]+)>/g)].map((m) => m[1])
        items.forEach((item, index) => {
          map.set((first + index).toString(16).toUpperCase().padStart(width, '0'), hexToText(item))
        })
      }
    }
  }

  return map
}

/** Content stream + the fonts it references, as names map to CMaps. */
function pageFonts(objects, pageBody) {
  const fonts = new Map()
  const names = /\/Font\s*<<([\s\S]*?)>>/.exec(pageBody)
  if (!names) return fonts

  for (const entry of names[1].matchAll(/\/([A-Za-z0-9#+._-]+)\s+(\d+)\s+0\s+R/g)) {
    const name = entry[1]
    const font = objects.get(Number(entry[2]))
    if (!font) continue
    const toUnicode = /\/ToUnicode\s+(\d+)\s+0\s+R/.exec(font)
    if (!toUnicode) continue
    const cmapObject = objects.get(Number(toUnicode[1]))
    if (!cmapObject) continue
    fonts.set(name, parseCmap(streamBody(cmapObject)))
  }

  return fonts
}

function decodeRun(hex, cmap) {
  const clean = hex.replace(/\s+/g, '').toUpperCase()
  if (!cmap || cmap.size === 0) return ''
  const wide = [...cmap.keys()].every((key) => key.length >= 4)
  const width = wide ? 4 : 2
  let out = ''

  for (let i = 0; i + width <= clean.length; i += width) {
    const code = clean.slice(i, i + width)
    out += cmap.has(code) ? cmap.get(code) : ''
  }

  return out
}

/** Readable text of the whole document, page by page. */
function extractText(file) {
  const raw = fs.readFileSync(file).toString('latin1')
  const objects = readObjects(raw)
  const pages = []

  for (const [number, body] of objects) {
    if (!/\/Type\s*\/Page[^s]/.test(body)) continue
    const content = /\/Contents\s+(\d+)\s+0\s+R/.exec(body)
    if (!content) continue

    const stream = streamBody(objects.get(Number(content[1])) || '')
    const fonts = pageFonts(objects, body)

    let text = ''
    let cmap = null
    const tokens =
      /<([0-9A-Fa-f\s]+)>|\(((?:[^()\\]|\\.)*)\)|\/([A-Za-z0-9#+._-]+)\s+[\d.-]+\s+Tf|\b(TJ|Tj|Tm|TD|Td|T\*|ET|BT)\b/g
    let token
    while ((token = tokens.exec(stream))) {
      if (token[1]) text += decodeRun(token[1], cmap)
      else if (token[2]) text += token[2]
      else if (token[3]) cmap = fonts.get(token[3]) || null
      // Chrome advances before every single glyph with `Td`, and emits real
      // spaces as glyphs, so advances contribute nothing and `Tm` starts a line.
      else if (token[4] === 'Tm' || token[4] === 'ET') text += '\n'
    }

    pages.push({ number, text })
  }

  pages.sort((a, b) => a.number - b.number)

  const mediaBox = /\/MediaBox\s*\[\s*([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s+([\d.-]+)\s*\]/.exec(raw)
  const counts = [...raw.matchAll(/\/Count\s+(\d+)/g)].map((m) => Number(m[1]))

  return {
    text: pages.map((page) => page.text).join('\n'),
    pageCount: counts.length ? Math.max(...counts) : pages.length,
    width: mediaBox ? Number(mediaBox[3]) : 0,
    height: mediaBox ? Number(mediaBox[4]) : 0,
  }
}

module.exports = { extractText }
