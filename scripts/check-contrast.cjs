/**
 * Theme contrast, checked as arithmetic rather than by eye.
 *
 * Every text colour in the site is one of four tokens, so the whole theme can
 * be verified by measuring those tokens against each other in both themes. It
 * also fails if the `.dark` block and the no-JavaScript
 * `@media (prefers-color-scheme: dark)` block drift apart, since they have to
 * carry the same values for dark mode to behave the same with and without JS.
 */
const fs = require('fs')
const path = require('path')

const file = path.join(__dirname, '..', 'app', 'globals.css')
const css = fs.readFileSync(file, 'utf8')

/** Read `--name: r g b` declarations out of one CSS rule block. */
function readTokens(blockSource) {
  const tokens = {}
  for (const match of blockSource.matchAll(/--([a-z-]+):\s*(\d+)\s+(\d+)\s+(\d+)\s*;/g)) {
    tokens[match[1]] = [Number(match[2]), Number(match[3]), Number(match[4])]
  }
  return tokens
}

function block(after, open = '{', close = '}') {
  const start = css.indexOf(after)
  if (start < 0) throw new Error(`could not find "${after}" in app/globals.css`)
  const from = css.indexOf(open, start) + 1
  const to = css.indexOf(close, from)
  return css.slice(from, to)
}

function luminance([r, g, b]) {
  const channel = (value) => {
    const v = value / 255
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

function ratio(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

/**
 * Colour pairs that carry meaning, with the WCAG rule that applies to each:
 * 4.5:1 for text (1.4.3), 3:1 for the boundary of a control (1.4.11).
 */
const pairs = [
  ['ink', 'paper', 4.5, 'body text'],
  ['muted', 'paper', 4.5, 'secondary text'],
  ['accent', 'paper', 4.5, 'accent text and links'],
  ['on-accent', 'accent', 4.5, 'button label'],
  ['on-accent', 'accent-strong', 4.5, 'button label on hover'],
  ['accent', 'paper', 3, 'button fill against the page'],
  ['accent-strong', 'paper', 3, 'button fill on hover against the page'],
]

const themes = {
  light: readTokens(block(':root')),
  dark: readTokens(block('.dark')),
  'dark (no JavaScript)': readTokens(block('html:not(.light)')),
}

let failures = 0

for (const [name, tokens] of Object.entries(themes)) {
  console.log(`\n${name}`)
  for (const [foreground, background, minimum, use] of pairs) {
    const fg = tokens[foreground]
    const bg = tokens[background]
    if (!fg || !bg) {
      console.log(`  FAIL  ${foreground} on ${background}: token missing`)
      failures++
      continue
    }
    const value = ratio(fg, bg)
    const ok = value >= minimum
    if (!ok) failures++
    console.log(
      `  ${ok ? 'PASS' : 'FAIL'}  ${foreground} on ${background}: ${value.toFixed(2)}:1  ` +
        `(needs ${minimum}:1 — ${use})`
    )
  }
}

const [lightDark, mediaDark] = [themes.dark, themes['dark (no JavaScript)']]
const drifted = Object.keys(lightDark).filter(
  (key) => JSON.stringify(lightDark[key]) !== JSON.stringify(mediaDark[key])
)
if (drifted.length) {
  console.log(`\nFAIL  the two dark blocks disagree on: ${drifted.join(', ')}`)
  failures++
} else {
  console.log('\nPASS  .dark and the prefers-color-scheme block carry the same values')
}

console.log(
  failures === 0
    ? '\nEvery text colour and control fill clears its WCAG minimum in every theme.'
    : `\n${failures} contrast problem(s).`
)
process.exit(failures === 0 ? 0 : 1)
