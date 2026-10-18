/**
 * One source of truth for the project blurbs, and a check that proves it.
 *
 * The blurbs used to exist in three places that could not see each other:
 *
 *   the site        contexts/LanguageContext.tsx carried its own copy of the
 *                   English strings, and rendered from those
 *   the resume      app/resume/page.tsx read public/translations/en.json, and
 *                   scripts/make-resume.cjs printed it to public/resume.pdf
 *   the README      the GitHub profile README paraphrased each project by hand
 *
 * All three now read one file — public/translations/en.json, which the site
 * imports as its English defaults and the resume route prints from — plus the
 * project facts in data/projects.ts. This script is what keeps the third one
 * honest, and it is also the thing that writes it:
 *
 *   node scripts/project-blurbs.cjs            check, exit 1 on drift
 *   node scripts/project-blurbs.cjs --write    regenerate the README's table
 *
 * What it compares:
 *
 *   1. that the facts and the English copy agree at all — every project in
 *      data/projects.ts has a title, a description and its declared number of
 *      highlights, and none of them is blank
 *   2. that the README's generated block is byte-identical to what the blurbs
 *      would produce right now
 *   3. that public/resume.pdf — a build artifact, easy to forget — still
 *      contains each project's current title and the two highlights the sheet
 *      prints, so an edited blurb cannot sit in the repo while the PDF on the
 *      site still says the old thing
 *
 * The README lives in its own repository one directory up, so it can be absent;
 * that is reported as a skip, never as a pass. PROFILE_README points elsewhere.
 *
 * Usage: node scripts/project-blurbs.cjs [--write]
 *        PROFILE_README=/path/to/README.md node scripts/project-blurbs.cjs
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const write = process.argv.includes('--write')

/** Delimiters in the README; everything between them is generated. */
const START = '<!-- projects:start -->'
const END = '<!-- projects:end -->'

/** The resume prints the title plus the first two highlights, to fit one page. */
const RESUME_HIGHLIGHTS = 2

// ------------------------------------------------------------------ reading

/**
 * data/projects.ts is TypeScript, so it is read as text — the same approach
 * scripts/check-keys.cjs takes. Each entry runs from `id:` to its closing
 * brace; the fields are pulled out of that window.
 */
function readProjects() {
  const source = fs.readFileSync(path.join(root, 'data', 'projects.ts'), 'utf8')
  const arrayStart = source.indexOf('const projects')
  const arrayEnd = source.indexOf('export const profileUrl')
  if (arrayStart === -1 || arrayEnd === -1) {
    throw new Error('could not locate the projects array in data/projects.ts')
  }

  const body = source.slice(arrayStart, arrayEnd)
  const entries = []
  const entryPattern = /id: '([^']+)',([\s\S]*?)\n  \},/g

  let match
  while ((match = entryPattern.exec(body))) {
    const [, id, fields] = match
    const pick = (field) => {
      const found = fields.match(new RegExp(`${field}: '([^']*)'`))
      return found ? found[1] : undefined
    }
    const techMatch = fields.match(/tech: \[([^\]]*)\]/)
    const tech = techMatch
      ? techMatch[1]
          .split(',')
          .map((item) => item.trim().replace(/^'|'$/g, ''))
          .filter(Boolean)
      : []
    const highlightsMatch = fields.match(/highlights: (\d+)/)

    entries.push({
      id,
      name: pick('name'),
      year: pick('year'),
      status: pick('status'),
      tech,
      github: pick('github'),
      live: pick('live'),
      highlights: highlightsMatch ? Number(highlightsMatch[1]) : 0,
    })
  }

  if (entries.length === 0) throw new Error('parsed no projects out of data/projects.ts')
  return entries
}

/** The English copy: the one file all three surfaces read. */
function readEnglish() {
  return JSON.parse(fs.readFileSync(path.join(root, 'public', 'translations', 'en.json'), 'utf8'))
}

function profileReadmePath() {
  return process.env.PROFILE_README
    ? path.resolve(process.env.PROFILE_README)
    : path.join(root, '..', 'ashutosh250604', 'README.md')
}

// ------------------------------------------------------------------ shaping

/**
 * The canonical blurb for one project: the facts from data/projects.ts joined
 * to the copy from en.json. Everything downstream is built from this and
 * nothing else.
 */
function blurbs(projects, english) {
  const problems = []

  const shaped = projects.map((project) => {
    const read = (key) => {
      const value = english[key]
      if (typeof value !== 'string' || !value.trim()) problems.push(`${key} is missing or blank`)
      return value ?? ''
    }

    const title = read(`project.${project.id}.title`)
    const description = read(`project.${project.id}.description`)
    const highlights = []
    for (let i = 1; i <= project.highlights; i += 1) {
      highlights.push(read(`project.${project.id}.highlight${i}`))
    }

    if (!project.name) problems.push(`project.${project.id} has no name in data/projects.ts`)
    if (project.tech.length === 0) problems.push(`project.${project.id} lists no tech`)

    return { ...project, title, description, highlights }
  })

  return { shaped, problems }
}

/** Pipes would end the markdown cell early. */
const cell = (text) => text.replace(/\|/g, '\\|')

/**
 * The README's "Selected work" table, rendered from the blurbs. The prose is
 * the site's own description, verbatim: that is the whole point, and it is why
 * the README reads the way the site does rather than in a second voice.
 */
function renderTable(entries) {
  const rows = entries.map((entry) => {
    const label = entry.github ? `**[${entry.name}](${entry.github})**` : `**${entry.name}**`
    const suffix = entry.live
      ? ` · [live](${entry.live})`
      : entry.github
        ? ''
        : ' · *private*'

    return `| ${label}${suffix} | ${cell(entry.description)} | ${cell(entry.tech.join(' · '))} |`
  })

  return [
    '| Project | What it is | Built with |',
    '| :--- | :--- | :--- |',
    ...rows,
  ].join('\n')
}

/**
 * Rendered with the README's own line endings. A Windows checkout holds CRLF,
 * and a block written with LF would compare unequal on every run — the check
 * would report drift against a file that is in fact correct.
 */
function renderBlock(entries, newline = '\n') {
  return [START, ...renderTable(entries).split('\n'), END].join(newline)
}

// ----------------------------------------------------------------- checking

/** Plain text of a PDF, lowercased and flattened, for word-level comparison. */
function resumeText() {
  const file = path.join(root, 'public', 'resume.pdf')
  if (!fs.existsSync(file)) return null
  const { extractText } = require('./pdf-text.cjs')
  return extractText(file).text.replace(/\s+/g, ' ').toLowerCase()
}

function main() {
  const projects = readProjects()
  const english = readEnglish()
  const { shaped, problems } = blurbs(projects, english)

  let failures = problems.length

  console.log(`Projects: ${shaped.length}`)
  for (const entry of shaped) {
    console.log(
      `  ${entry.id.padEnd(12)} ${entry.name.padEnd(20)} ` +
        `${entry.highlights.length} highlight(s), ${entry.tech.length} technologies`
    )
  }

  if (problems.length) {
    console.log('\nFAIL  the blurbs do not agree with themselves:')
    for (const problem of problems) console.log(`  ${problem}`)
    console.log('      Fix data/projects.ts or public/translations/en.json.')
  } else {
    console.log('\nPASS  every project has a title, a description and its declared highlights')
  }

  // ---- the README
  const readme = profileReadmePath()
  const label = path.relative(root, readme).split(path.sep).join('/')
  let readmeState = 'SKIP'

  if (fs.existsSync(readme)) {
    const source = fs.readFileSync(readme, 'utf8')
    const newline = source.includes('\r\n') ? '\r\n' : '\n'
    const generated = renderBlock(shaped, newline)
    const start = source.indexOf(START)
    const end = source.indexOf(END)

    if (start === -1 || end === -1) {
      readmeState = 'FAIL'
      failures += 1
      console.log(
        `\nFAIL  ${label} has no generated block.\n` +
          `      Wrap the table in ${START} and ${END}, then run:\n` +
          `      node scripts/project-blurbs.cjs --write`
      )
    } else {
      const current = source.slice(start, end + END.length)

      if (current === generated) {
        readmeState = 'PASS'
        console.log(`\nPASS  ${label}'s project table matches the blurbs`)
      } else if (write) {
        fs.writeFileSync(readme, source.slice(0, start) + generated + source.slice(end + END.length))
        readmeState = 'WROTE'
        console.log(`\nWROTE ${label}'s project table from the blurbs`)
      } else {
        readmeState = 'FAIL'
        failures += 1
        console.log(`\nFAIL  ${label}'s project table has drifted from the blurbs`)
        for (const line of firstDifference(current, generated)) console.log(`      ${line}`)
        console.log('      Regenerate it with: node scripts/project-blurbs.cjs --write')
      }
    }
  } else {
    console.log(`\nSKIP  no README at ${label} — set PROFILE_README to check one.`)
  }

  // ---- the generated resume
  const flat = resumeText()
  let resumeState = 'SKIP'

  if (flat === null) {
    console.log('SKIP  public/resume.pdf is absent — run `npm run resume` to build it.')
  } else {
    const missing = []
    for (const entry of shaped) {
      const wanted = [entry.title, ...entry.highlights.slice(0, RESUME_HIGHLIGHTS)]
      for (const text of wanted) {
        if (!flat.includes(text.replace(/\s+/g, ' ').toLowerCase())) {
          missing.push(`${entry.id}: "${text.slice(0, 58)}${text.length > 58 ? '…' : ''}"`)
        }
      }
    }

    if (missing.length === 0) {
      resumeState = 'PASS'
      console.log('PASS  public/resume.pdf prints the current blurbs')
    } else {
      resumeState = 'FAIL'
      failures += 1
      console.log(`\nFAIL  public/resume.pdf is out of date — ${missing.length} line(s) no longer match:`)
      for (const item of missing) console.log(`      ${item}`)
      console.log('      Regenerate it with: npm run resume')
    }
  }

  console.log(
    `\n${shaped.length} project(s) — blurbs ${problems.length ? 'FAIL' : 'ok'}, ` +
      `README ${readmeState}, resume ${resumeState}`
  )

  if (failures === 0) {
    console.log('The site, the resume and the README all say the same thing about every project.')
  } else {
    console.log(`\n${failures} drift(s) found. The one source is public/translations/en.json; fix it there.`)
  }

  process.exit(failures === 0 ? 0 : 1)
}

/** The first line that differs, so the report points at something specific. */
function firstDifference(current, generated) {
  const a = current.split('\n')
  const b = generated.split('\n')
  for (let i = 0; i < Math.max(a.length, b.length); i += 1) {
    if (a[i] !== b[i]) {
      return [`line ${i + 1}:`, `  README:    ${(a[i] ?? '(nothing)').slice(0, 150)}`, `  generated: ${(b[i] ?? '(nothing)').slice(0, 150)}`]
    }
  }
  return ['(the blocks differ only in trailing whitespace)']
}

main()
