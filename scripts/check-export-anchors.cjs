#!/usr/bin/env node
/**
 * The section links on the 404 and the resume have to leave the page.
 *
 * The nav is one component on every route, but its links point at sections that
 * only the front page renders. On a route without them, `#about` scrolls
 * nowhere: the browser finds no target and the URL changes to nothing. Written
 * `/#about` the link crosses to the page that has the section, which works
 * whether or not JavaScript ever runs - and with JavaScript off there is no
 * router left to quietly fix it up after the fact.
 *
 * That is a property of the exported HTML, not of the components, so it is
 * checked the way a visitor and a crawler meet the site: by reading the files
 * the build wrote. `html okay` in a browser proves nothing here, because the
 * browser is the half that would have corrected it.
 *
 * The rule is read off the export rather than from a list kept beside it: an
 * anchor is stranded when the file it is written in does not render that id,
 * but the front page does. `#main` is the exception the rule finds on its own -
 * every route renders its own `<main id="main">`, so the skip link stays a
 * same-page anchor on all of them.
 *
 * Reads out/, so it needs a build. Without one it says so and passes rather
 * than failing on an absent directory, the way the link audit treats a missing
 * profile README.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const OUT = path.join(ROOT, 'out')
const HOME = 'index.html'
const OFF_FRONT = ['404.html', 'resume.html']

/** Every value of one attribute, deduplicated. */
function attribute(html, name) {
  const values = new Set()
  for (const match of html.matchAll(new RegExp(`${name}="([^"]*)"`, 'g'))) values.add(match[1])
  return values
}

if (!fs.existsSync(OUT)) {
  console.log('SKIP  no out/ to read - run `npm run build`, then this check reads the export.')
  process.exit(0)
}

const homePath = path.join(OUT, HOME)
if (!fs.existsSync(homePath)) {
  console.error(`FAIL  ${HOME} is missing from out/ - the export is incomplete.`)
  process.exit(1)
}

/** What the front page renders, which is what a section link has to reach. */
const homeIds = attribute(fs.readFileSync(homePath, 'utf8'), 'id')

let failures = 0

console.log(`Section links off the front page (${OFF_FRONT.join(', ')})\n`)

for (const page of OFF_FRONT) {
  const file = path.join(OUT, page)
  if (!fs.existsSync(file)) {
    console.log(`  FAIL  ${page.padEnd(11)} was not exported`)
    failures += 1
    continue
  }

  const html = fs.readFileSync(file, 'utf8')
  const ids = attribute(html, 'id')
  const hrefs = [...attribute(html, 'href')]

  // Written as a bare hash on a page that does not render the id, while the
  // front page does: this is the shape the export used to ship.
  const stranded = hrefs.filter(
    (href) => /^#[^/]/.test(href) && !ids.has(href.slice(1)) && homeIds.has(href.slice(1))
  )
  // Written as `/#about` but pointing at a section the front page does not have.
  const dangling = hrefs.filter((href) => href.startsWith('/#') && !homeIds.has(href.slice(2)))
  const leaving = hrefs.filter((href) => href.startsWith('/#') && homeIds.has(href.slice(2)))
  const staying = hrefs.filter((href) => /^#[^/]/.test(href) && ids.has(href.slice(1)))

  if (stranded.length === 0 && dangling.length === 0) {
    console.log(
      `  PASS  ${page.padEnd(11)} ${leaving.length} section link(s) leave the page, ` +
        `${staying.length} same-page anchor(s) stay (${staying.join(', ')})`
    )
    continue
  }

  failures += 1
  console.log(`  FAIL  ${page}`)
  for (const href of stranded) {
    console.log(`        ${href} lands on nothing here - write it /${href}`)
  }
  for (const href of dangling) {
    console.log(`        ${href} points at a section the front page does not render`)
  }
}

console.log(
  failures === 0
    ? '\nEvery section link in the export either stays on a target its own page renders or points at the front page.'
    : '\nA bare hash off the front page scrolls nowhere - it has to be written /#about.'
)

process.exit(failures === 0 ? 0 : 1)
