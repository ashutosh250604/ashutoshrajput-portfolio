/**
 * Link audit: every URL the site and the READMEs publish, actually fetched.
 *
 * The published surface is wide and mostly third-party - shields.io badges,
 * stats cards, two live demos, four social profiles - and it rots silently:
 * a repo gets renamed, a free-tier host is deleted, a card service starts
 * asking for money. Nothing in the build notices, because nothing in the build
 * looks outward. This does.
 *
 * What counts as a failure, and why the line sits exactly there:
 *
 *   404 / 410 / other 4xx   FAIL    the link is gone - the only thing that fails
 *   403 / 406 / 429 / 999   BLOCKED a bot is being refused, not a visitor
 *   5xx                     DOWN    the host answered, the service did not
 *   connection error        UNREACHABLE, after one retry
 *
 * Everything except the first is printed loudly and does not fail the run, and
 * each of those lines was measured rather than assumed. leetcode.com answers 403
 * and zendevx.com 406 to anything without a browser session; linkedin.com
 * answers 999 - its own invention - to a fetch carrying a full Chrome
 * user-agent; and wault-upi.onrender.com, a free Render instance, misses the
 * first request after it has been asleep, answering 000, then 503, then 200
 * inside the same afternoon. None of those is a 404 for a visitor, and failing
 * the run on them is how a link check ends up ignored.
 *
 * Internal links are checked without the network: a `/path` must exist in
 * public/ or be a real route, and a `#anchor` must be an id that some component
 * actually renders.
 *
 * Usage: node scripts/check-links.cjs
 *        PROFILE_README=/path/to/README.md node scripts/check-links.cjs
 */
const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const DOMAIN = 'https://ashutoshrajput-portfolio.vercel.app'

/** Six at a time: enough to be quick, gentle enough for the free services. */
const CONCURRENCY = 6
const TIMEOUT_MS = 20_000
const RETRY_DELAY_MS = 1_500

/**
 * Refused to automated clients; a browser gets in and a fetch does not.
 * 999 is LinkedIn's own invention for exactly this, and it answers 999 to a
 * fetch carrying a full Chrome user-agent string, so there is no header that
 * gets past it. The same profile URL without `www.` answers 200, which is how
 * we know the profile is there.
 */
const BLOCKED_STATUSES = new Set([403, 406, 429, 999])

/** Ask me how many views it has and it counts you. HEAD does not. */
const COUNTING_HOSTS = new Set(['komarev.com', 'hits.sh', 'visitcount.itsvg.in'])

// ---------------------------------------------------------------- gathering

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full, out)
    else out.push(full)
  }
  return out
}

/** The files whose text can publish a link. */
function sourceFiles() {
  const files = []
  for (const dir of ['app', 'components', 'contexts', 'data', 'lib']) walk(path.join(root, dir), files)

  const translations = path.join(root, 'public', 'translations')
  for (const name of fs.readdirSync(translations)) files.push(path.join(translations, name))

  files.push(path.join(root, 'README.md'))

  // The profile README lives in its own repository, one directory up. Its
  // badges are published URLs like any other, so it is scanned when it is
  // there - and the run says so when it is not, because a silent skip would
  // read as a pass.
  files.push(process.env.PROFILE_README
    ? path.resolve(process.env.PROFILE_README)
    : path.join(root, '..', 'ashutosh250604', 'README.md'))

  return files.filter(
    (file) => fs.existsSync(file) && /\.(tsx?|jsx?|json|md)$/.test(file)
  )
}

/** Where the profile README is, for the closing note. */
function profileReadmePath() {
  return process.env.PROFILE_README
    ? path.resolve(process.env.PROFILE_README)
    : path.join(root, '..', 'ashutosh250604', 'README.md')
}

const relative = (file) => path.relative(root, file).split(path.sep).join('/')

/** Markdown and TSX both end a URL at whitespace or a quote; trim the rest. */
const URL_PATTERN = /https?:\/\/[^\s"'`<>)\]}\\]+/g

/*
 * Static paths only, in both the JSX attribute form (`href="/resume.pdf"`) and
 * the object-literal form the nav tables use (`href: '#home'`). Anything with a
 * `${` in it is assembled at runtime and cannot be judged from here.
 */
const INTERNAL_PATTERN = /(?:href|src|srcSet)\s*[:=]\s*["'](\/[^"'{]*)["']/g

/** `href="#about"` and `href: '#contact'`. */
const ANCHOR_PATTERN = /href\s*[:=]\s*["']#([A-Za-z0-9_-]+)["']/g

/** Ids rendered at runtime from data, which the markup cannot show. */
function dataAnchors() {
  const anchors = new Set()
  const projects = fs.readFileSync(path.join(root, 'data', 'projects.ts'), 'utf8')
  for (const match of projects.matchAll(/^\s*id: '([^']+)'/gm)) anchors.add(match[1])
  return anchors
}

function collect() {
  const external = new Map()
  const internal = new Map()
  const anchors = new Map()

  for (const file of sourceFiles()) {
    const source = fs.readFileSync(file, 'utf8')
    const where = relative(file)

    for (const match of source.matchAll(URL_PATTERN)) {
      // A URL assembled at runtime is not knowable from here.
      if (match[0].includes('${')) continue
      const url = match[0].replace(/[.,;:]+$/, '')
      if (!external.has(url)) external.set(url, new Set())
      external.get(url).add(where)
    }

    for (const match of source.matchAll(INTERNAL_PATTERN)) {
      if (!internal.has(match[1])) internal.set(match[1], new Set())
      internal.get(match[1]).add(where)
    }

    for (const match of source.matchAll(ANCHOR_PATTERN)) {
      if (!anchors.has(match[1])) anchors.set(match[1], new Set())
      anchors.get(match[1]).add(where)
    }
  }

  return { external, internal, anchors }
}

/** The ids components actually render, as far as static reading can tell. */
function renderedIds() {
  const ids = dataAnchors()
  for (const file of walk(path.join(root, 'components')).concat(walk(path.join(root, 'app')))) {
    if (!/\.(tsx?|jsx?)$/.test(file)) continue
    for (const match of fs.readFileSync(file, 'utf8').matchAll(/\bid="([A-Za-z0-9_-]+)"/g)) {
      ids.add(match[1])
    }
  }
  return ids
}

// ---------------------------------------------------------------- checking

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** HEAD, because a counting badge increments on GET. */
async function request(url, method) {
  const response = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      // Identify honestly, but look enough like a browser that CDNs answer.
      'user-agent': 'Mozilla/5.0 (compatible; portfolio-link-check/1.0)',
      accept: 'text/html,image/svg+xml,image/*,*/*;q=0.8',
    },
  })
  return response
}

async function probe(url) {
  const host = new URL(url).hostname
  if (host === 'localhost' || host === '127.0.0.1' || host.endsWith('.local')) {
    return { state: 'SKIP', note: 'localhost' }
  }

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    const retried = attempt === 2

    try {
      let response = await request(url, 'HEAD')

      // A few hosts answer GET but not HEAD. Retrying with GET on anything
      // unhelpful would double the traffic for every genuinely dead link, so
      // this is limited to the one status that means "wrong method".
      if (response.status === 405 || response.status === 501) {
        response = await request(url, 'GET')
      }

      const status = response.status
      if (status >= 200 && status < 400) {
        const note = retried
          ? 'asleep; answered on the retry'
          : COUNTING_HOSTS.has(host)
            ? 'counted by HEAD only'
            : ''
        return { state: 'PASS', status, note }
      }

      // Before the 5xx branch: 999 is LinkedIn's bot block and is not a server
      // error, and a status above 599 is not one either.
      if (BLOCKED_STATUSES.has(status)) {
        return { state: 'BLOCKED', status, note: 'refused to a non-browser client' }
      }

      // A free instance that has gone to sleep answers 5xx while it wakes, so
      // this is the one response worth waiting out rather than reporting.
      if (status >= 500 && status < 600) {
        if (!retried) {
          await sleep(RETRY_DELAY_MS)
          continue
        }
        return { state: 'DOWN', status, note: 'answered, but not serving' }
      }

      return { state: 'FAIL', status, note: 'the link is gone' }
    } catch (error) {
      if (retried) {
        return { state: 'UNREACHABLE', note: (error.cause?.code || error.name || 'error').toString() }
      }
      await sleep(RETRY_DELAY_MS)
    }
  }

  return { state: 'UNREACHABLE', note: 'no response' }
}

async function probeAll(urls) {
  const results = new Map()
  const queue = [...urls]

  const workers = Array.from({ length: CONCURRENCY }, async () => {
    while (queue.length) {
      const url = queue.shift()
      results.set(url, await probe(url))
    }
  })

  await Promise.all(workers)
  return results
}

// ------------------------------------------------------------------ report

const ICON = { PASS: 'PASS', BLOCKED: 'BLOCK', DOWN: 'DOWN', FAIL: 'FAIL', SKIP: 'SKIP', UNREACHABLE: 'UNREACH' }
const COLOR = { PASS: 32, BLOCKED: 33, DOWN: 33, FAIL: 31, SKIP: 90, UNREACHABLE: 33 }

const paint = (state, text) =>
  process.stdout.isTTY ? `\u001b[${COLOR[state]}m${text}\u001b[0m` : text

async function main() {
  const { external, internal, anchors } = collect()
  const urls = [...external.keys()].sort()
  const results = await probeAll(urls)

  let failures = 0
  let blocked = 0
  let unreachable = 0
  let down = 0

  console.log(`\nOutward links (${urls.length})`)
  for (const url of urls) {
    const result = results.get(url)
    if (result.state === 'FAIL') failures += 1
    if (result.state === 'BLOCKED') blocked += 1
    if (result.state === 'UNREACHABLE') unreachable += 1
    if (result.state === 'DOWN') down += 1

    const where = [...external.get(url)].join(', ')
    const detail = [result.status, result.note].filter(Boolean).join(' ')
    console.log(`  ${paint(result.state, ICON[result.state].padEnd(7))} ${detail.padEnd(46)} ${url}`)
    if (result.state === 'SKIP') continue
    if (result.state !== 'PASS') console.log(`          published in ${where}`)
  }

  // ---- internal paths
  const internalPaths = [...internal.keys()].sort()
  const badPaths = []
  for (const href of internalPaths) {
    const clean = href.split(/[?#]/)[0]
    if (clean === '/' || clean === '') continue

    /*
     * Four ways a path can be real: a file in public/, a route file under app/, 
     * a Next.js app-directory convention file such as app/favicon.ico (which is
     * where this site's favicon actually lives, not in public/), or something
     * the last build exported into out/.
     */
    const asAsset = fs.existsSync(path.join(root, 'public', clean))
    const asAppFile = fs.existsSync(path.join(root, 'app', clean))
    const asExport = fs.existsSync(path.join(root, 'out', clean))
    const asRoute = ['tsx', 'ts', 'jsx', 'js', 'mdx'].some(
      (extension) =>
        fs.existsSync(path.join(root, 'app', `${clean}.${extension}`)) ||
        fs.existsSync(path.join(root, 'app', clean, `page.${extension}`)) ||
        fs.existsSync(path.join(root, 'app', clean, `route.${extension}`))
    )

    if (asAsset || asAppFile || asExport || asRoute) continue
    badPaths.push(href)
  }

  console.log(`\nInternal paths (${internalPaths.length})`)
  for (const href of internalPaths) {
    const ok = !badPaths.includes(href)
    console.log(`  ${paint(ok ? 'PASS' : 'FAIL', (ok ? 'PASS' : 'FAIL').padEnd(7))} ${' '.repeat(46)} ${href}`)
    if (!ok) {
      failures += 1
      console.log(`          published in ${[...internal.get(href)].join(', ')}`)
    }
  }

  // ---- anchors
  const ids = renderedIds()
  const anchorKeys = [...anchors.keys()].sort()
  const badAnchors = anchorKeys.filter((anchor) => !ids.has(anchor))

  console.log(`\nAnchors (${anchorKeys.length})`)
  for (const anchor of anchorKeys) {
    const ok = !badAnchors.includes(anchor)
    console.log(`  ${paint(ok ? 'PASS' : 'FAIL', (ok ? 'PASS' : 'FAIL').padEnd(7))} ${' '.repeat(46)} #${anchor}`)
    if (!ok) {
      failures += 1
      console.log(`          linked from ${[...anchors.get(anchor)].join(', ')}, but no component renders that id`)
    }
  }

  // ---- the profile README lives in its own repository
  const profileReadme = profileReadmePath()
  const profileLabel = path.relative(root, profileReadme).split(path.sep).join('/')

  if (fs.existsSync(profileReadme)) {
    console.log(`\nIncluded the profile repository's README (${profileLabel}) - its badges are published URLs too.`)
  } else {
    console.log(`\nSKIP     no profile README at ${profileLabel} - set PROFILE_README to check one.`)
  }

  const total = urls.length + internalPaths.length + anchorKeys.length
  const warned = blocked + unreachable + down

  console.log(
    `\n${total} checked - ${total - failures - warned} clean, ${failures} broken, ` +
      `${blocked} refused to a bot, ${down} not serving, ${unreachable} unreachable.`
  )

  if (failures === 0) {
    console.log('No link the site or its READMEs publish is broken.')
    if (warned) {
      console.log('The hosts listed above still need a human eye: a link that resolves is not the same as a service that is up.')
    }
  } else {
    console.log('\nBroken links - fix the URL or drop the link.')
  }

  process.exit(failures === 0 ? 0 : 1)
}

main().catch((error) => {
  console.error(`link check failed to run: ${error.message}`)
  process.exit(1)
})
