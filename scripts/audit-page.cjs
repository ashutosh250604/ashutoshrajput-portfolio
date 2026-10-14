#!/usr/bin/env node
/**
 * A measurement harness for the exported site.
 *
 * Serves `out/`, loads the real page in a fresh headless Chrome (empty cache)
 * and reports what the browser actually fetched and when it painted:
 *
 *   - first contentful paint, largest contentful paint, layout shift
 *   - every resource with its transfer size, grouped by type
 *   - the skip link, focused, to prove it lands on screen
 *
 * Timings are run under Chrome's virtual time so the run is deterministic and
 * finishes; use them to compare two builds measured the same way, not as a
 * prediction of a visitor's network. Byte counts are exact.
 *
 * Usage: node scripts/audit-page.cjs [path]   (default "/")
 */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')
const os = require('os')

const root = path.join(__dirname, '..')
const outDir = path.join(root, 'out')
const harness = path.join(outDir, '__audit.html')
const target = process.argv[2] || '/'
const port = Number(process.env.AUDIT_PORT || 4383)
const url = `http://127.0.0.1:${port}/__audit.html?url=${encodeURIComponent(target)}`

const harnessSource = `<!doctype html>
<meta charset="utf-8">
<title>audit</title>
<pre id="result">pending</pre>
<script>
const params = new URLSearchParams(location.search)
const frame = document.createElement('iframe')
frame.style.cssText = 'width:1280px;height:900px;border:0'

const metrics = { resources: [] }
const wait = (ms) => new Promise((r) => setTimeout(r, ms))
const report = (value) => {
  document.getElementById('result').textContent = JSON.stringify(value)
  document.title = 'done'
}

// The listener goes on before the source, or a fast load can beat it.
frame.addEventListener('load', async () => {
  try {
    await measure()
  } catch (error) {
    report({ error: String(error && error.message ? error.message : error) })
  }
})

document.body.append(frame)
frame.src = params.get('url') || '/'

async function measure() {
  const win = frame.contentWindow
  const collect = async (type, key, sum) => {
    try {
      const seen = []
      new win.PerformanceObserver((list) => {
        for (const entry of list.getEntries()) seen.push(entry)
      }).observe({ type, buffered: true })
      await wait(400)
      metrics[key] = sum
        ? seen.reduce((total, entry) => total + entry.value, 0)
        : seen.length
          ? Math.round(seen[seen.length - 1].startTime)
          : null
    } catch (error) {
      metrics[key] = 'unsupported'
    }
  }

  await collect('largest-contentful-paint', 'lcp')
  await collect('layout-shift', 'cls', true)

  const perf = win.performance
  const paint = perf.getEntriesByType('paint')
  metrics.fcp = Math.round((paint.find((p) => p.name === 'first-contentful-paint') || { startTime: 0 }).startTime)
  metrics.domNodes = win.document.getElementsByTagName('*').length
  metrics.resources = perf.getEntriesByType('resource').map((entry) => ({
    name: entry.name.split('/').pop(),
    type: entry.initiatorType,
    bytes: entry.transferSize || 0,
  }))

  // Focus the skip link and see whether it actually comes on screen. The
  // transition is switched off first: under virtual time the clock can sit at
  // zero and leave the element mid-animation, which would say nothing about
  // whether the focus rule applies.
  const link = win.document.querySelector('.skip-link')
  if (link) {
    link.style.transition = 'none'
    frame.focus()
    link.focus()
    await wait(300)
    const rect = link.getBoundingClientRect()
    metrics.skipLink = {
      text: link.textContent.trim(),
      reached: win.document.activeElement === link,
      focused: link.matches(':focus'),
      transform: getComputedStyle(link).transform,
      onScreen: rect.top >= 0 && rect.bottom <= win.innerHeight,
      top: Math.round(rect.top),
    }
  }

  report(metrics)
}
<\/script>`

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Google', 'Chrome', 'Application', 'chrome.exe'),
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)
  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`

async function main() {
  if (!fs.existsSync(path.join(outDir, 'index.html'))) {
    console.error('out/ is missing — run `npm run build` first.')
    process.exit(1)
  }

  const browser = findBrowser()
  if (!browser) {
    console.error('No Chrome or Edge found. Set CHROME_PATH and try again.')
    process.exit(1)
  }

  fs.writeFileSync(harness, harnessSource)

  const server = spawn(process.execPath, [path.join(__dirname, 'serve-static.cjs'), String(port)], {
    stdio: 'ignore',
  })
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-chrome-'))

  try {
    await new Promise((resolve) => setTimeout(resolve, 700))

    const html = await new Promise((resolve, reject) => {
      const child = spawn(
        browser,
        [
          '--headless=new',
          '--disable-gpu',
          '--no-first-run',
          '--no-default-browser-check',
          '--virtual-time-budget=20000',
          `--user-data-dir=${profile}`,
          '--dump-dom',
          url,
        ],
        { stdio: ['ignore', 'pipe', 'pipe'] }
      )
      let stdout = ''
      child.stdout.on('data', (chunk) => (stdout += chunk))
      child.on('error', reject)
      child.on('close', () => resolve(stdout))
    })

    const match = /<pre id="result">([\s\S]*?)<\/pre>/.exec(html)
    if (!match || match[1] === 'pending') {
      console.error('the harness never reported. Last 600 characters of the dump:')
      console.error(html.slice(-600))
      process.exit(1)
    }

    const metrics = JSON.parse(match[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&'))
    const total = metrics.resources.reduce((sum, entry) => sum + entry.bytes, 0)
    const byType = {}
    for (const entry of metrics.resources) {
      const key = /\.woff2$/.test(entry.name) ? 'fonts' : entry.type || 'other'
      byType[key] = byType[key] || { count: 0, bytes: 0 }
      byType[key].count++
      byType[key].bytes += entry.bytes
    }

    console.log(`\npage            ${target}`)
    console.log(`paints          fcp ${metrics.fcp}ms · lcp ${metrics.lcp}ms · cls ${metrics.cls}`)
    console.log(`requests        ${metrics.resources.length} (${kb(total)} transferred)`)
    console.log(`dom             ${metrics.domNodes} elements`)
    if (metrics.skipLink) {
      console.log(
        `skip link       reached=${metrics.skipLink.reached} focused=${metrics.skipLink.focused} ` +
          `onScreen=${metrics.skipLink.onScreen} (top ${metrics.skipLink.top}px, transform ${metrics.skipLink.transform})`
      )
    }
    console.log('\nby type')
    for (const [type, data] of Object.entries(byType).sort((a, b) => b[1].bytes - a[1].bytes)) {
      console.log(`  ${type.padEnd(10)} ${String(data.count).padStart(2)} × ${kb(data.bytes)}`)
    }
    console.log('\nlargest resources')
    metrics.resources
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 6)
      .forEach((entry) => console.log(`  ${kb(entry.bytes).padStart(9)}  ${entry.name}`))
  } finally {
    server.kill()
    fs.rmSync(profile, { recursive: true, force: true })
    fs.rmSync(harness, { force: true })
  }
}

main().catch((error) => {
  console.error(`audit failed: ${error.message}`)
  process.exit(1)
})
