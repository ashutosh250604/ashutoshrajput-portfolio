/**
 * Static key audit: every translation key the components ask for must exist in
 * the English source, including the keys the code assembles at runtime (project
 * ids, experience slugs, changelog numbers).
 *
 * check-translations.cjs proves the files agree with each other; this proves
 * they agree with the code. A missing key renders as the raw key on the page.
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const readFile = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8')

const contextSource = readFile('contexts', 'LanguageContext.tsx')

/** Keys the code asks for. */
const used = new Set()

// 1. Literal t('some.key') calls.
// 2. Keys named as such in a data table, e.g. { key: 'nav.home' } in the nav
//    or { labelKey: 'egg.title' } in the egg registry. Deliberately narrow: a
//    quoted string that merely looks like a key is not one — the desktop's
//    terminal lists 'about.txt' and 'resume.pdf', and neither is a string.
const sourceFiles = []
for (const dir of ['components', 'app', 'lib']) {
  for (const file of fs.readdirSync(path.join(root, dir))) {
    if (/\.tsx?$/.test(file)) sourceFiles.push(path.join(dir, file))
  }
}

for (const file of sourceFiles) {
  const source = readFile(file)
  for (const match of source.matchAll(/\bt\(\s*'([^']+)'\s*\)/g)) used.add(match[1])
  for (const match of source.matchAll(/\b(?:key|labelKey|titleKey)\s*:\s*['"]([a-z][a-zA-Z]*\.[a-zA-Z0-9.]+)['"]/g)) {
    used.add(match[1])
  }
}

// The language context itself names every locale it can load.
for (const match of contextSource.matchAll(/'([a-z]{2})'/g)) used.delete(match[1])

// 3. Families assembled from data files, expanded with the real counts.
const projectsSource = readFile('data', 'projects.ts')
for (const match of projectsSource.matchAll(/\{\s*id: '([^']+)'[\s\S]*?highlights: (\d+)/g)) {
  const [, id, highlightCount] = match
  used.add(`project.${id}.title`)
  used.add(`project.${id}.description`)
  for (let i = 1; i <= Number(highlightCount); i += 1) used.add(`project.${id}.highlight${i}`)
}

const experienceSource = readFile('data', 'experience.ts')
for (const match of experienceSource.matchAll(/\{\s*company: '([^']+)'[\s\S]*?achievements: \[([\s\S]*?)\]/g)) {
  const slug = match[1].toLowerCase().replace(/\s+/g, '')
  const achievements = (match[2].match(/'[^']*'/g) || []).length
  used.add(`experience.${slug}.role`)
  used.add(`experience.${slug}.company`)
  used.add(`experience.${slug}.description`)
  for (let i = 1; i <= achievements; i += 1) used.add(`experience.${slug}.achievement${i}`)
}

const statusIds = ['live', 'running', 'shipped', 'private']
for (const status of statusIds) used.add(`projects.status.${status}`)

const changelogNumbers = readFile('components', 'Footer.tsx').match(/\[([0-9,\s]+)\]\.map\(/)
if (changelogNumbers) {
  for (const number of changelogNumbers[1].split(',').map((value) => value.trim())) {
    used.add(`colophon.change${number}`)
  }
}

// data/skills.ts is TypeScript, so read its category names as text.
for (const match of readFile('data', 'skills.ts').matchAll(/^\s{2}([a-zA-Z]+):\s*\[/gm)) {
  used.add(`skills.${match[1]}`)
}

/** Keys defined in the English source. */
const known = new Set(Object.keys(JSON.parse(readFile('public', 'translations', 'en.json'))))

const missing = [...used].filter((key) => !known.has(key)).sort()
const unused = [...known].filter((key) => !used.has(key)).sort()

console.log(`keys the code asks for:   ${used.size}`)
console.log(`keys in the English source: ${known.size}\n`)

if (missing.length) {
  console.log(`FAIL  ${missing.length} key(s) used but not defined:\n  ${missing.join('\n  ')}`)
} else {
  console.log('PASS  every key the code asks for exists in the defaults')
}

if (unused.length) {
  console.log(`\nDefined but never referenced (expected for keys only reached at runtime):\n  ${unused.join('\n  ')}`)
}

process.exit(missing.length ? 1 : 0)
