/**
 * Key-parity check: every translation file must carry exactly the same keys as
 * the English source.
 *
 * That source is public/translations/en.json, which is also what the site
 * imports as its English defaults and what the /resume route prints from - so
 * this now checks the locales against the one file that matters, rather than
 * against a second copy of the English strings that used to be held inline in
 * contexts/LanguageContext.tsx. The parity test is the same; there is simply
 * only one thing to be in parity with.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const english = JSON.parse(
  fs.readFileSync(path.join(root, 'public', 'translations', 'en.json'), 'utf8')
)

const reference = new Set(Object.keys(english))

console.log(`English source: ${reference.size} keys\n`)

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
