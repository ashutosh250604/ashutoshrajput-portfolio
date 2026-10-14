/**
 * Key-parity check: every translation file must carry exactly the same keys as
 * the English defaults embedded in contexts/LanguageContext.tsx.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const source = fs.readFileSync(path.join(root, 'contexts', 'LanguageContext.tsx'), 'utf8')

const start = source.indexOf('const defaultTranslations')
const end = source.indexOf('export function LanguageProvider')
if (start === -1 || end === -1) {
  console.error('Could not locate defaultTranslations in LanguageContext.tsx')
  process.exit(1)
}

const reference = new Set()
for (const line of source.slice(start, end).split('\n')) {
  const match = line.match(/^\s*"([^"]+)":\s*"/)
  if (match) reference.add(match[1])
}

console.log(`English defaults: ${reference.size} keys\n`)

let failures = 0
for (const file of fs.readdirSync(path.join(root, 'public', 'translations')).sort()) {
  const data = JSON.parse(fs.readFileSync(path.join(root, 'public', 'translations', file), 'utf8'))
  const keys = Object.keys(data)
  const missing = [...reference].filter((key) => !(key in data))
  const extra = keys.filter((key) => !reference.has(key))
  const empty = keys.filter((key) => !String(data[key]).trim())

  const ok = missing.length === 0 && extra.length === 0 && empty.length === 0
  if (!ok) failures++

  console.log(
    `${ok ? 'PASS' : 'FAIL'}  ${file.padEnd(9)} keys=${String(keys.length).padEnd(4)}` +
      (missing.length ? ` missing=${missing.join(', ')}` : '') +
      (extra.length ? ` extra=${extra.join(', ')}` : '') +
      (empty.length ? ` empty=${empty.join(', ')}` : '')
  )
}

console.log(failures === 0 ? '\nAll translation files match the English defaults.' : `\n${failures} file(s) out of sync.`)
process.exit(failures === 0 ? 0 : 1)
