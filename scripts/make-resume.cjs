#!/usr/bin/env node
/**
 * Renders the exported /resume page to public/resume.pdf with headless
 * Chrome/Edge, then checks what came out: one A4 page, and the words that are
 * supposed to be on it.
 *
 * The PDF is generated from the same page the browser gets, so the layout you
 * see in print preview is the layout in the file.
 *
 * Usage: npm run resume        (builds first)
 *        node scripts/make-resume.cjs
 */
const { spawn } = require('child_process')
const fs = require('fs')
const path = require('path')
const http = require('http')
const { extractText } = require('./pdf-text.cjs')

const root = path.join(__dirname, '..')
const outDir = path.join(root, 'out')
const resumeHtml = path.join(outDir, 'resume.html')
const target = path.join(root, 'public', 'resume.pdf')
const port = Number(process.env.RESUME_PORT || 4381)
const url = `http://127.0.0.1:${port}/resume.html`

/** Words that must survive the trip into the PDF. */
const required = [
  'Ashutosh Rajput',
  'Backend Developer',
  'Bangalore',
  'ZenDevX',
  'Flask',
  'PostgreSQL',
  'Wault',
  'IFM Billing Software',
  'B.Tech Computer Engineering',
]

/**
 * Page furniture that must not reach the sheet: if the print stylesheet stops
 * hiding the navigation and footer, these words are how we find out.
 */
const forbidden = ['Colophon', 'Get In Touch', 'Open to Work']

/** A4 in points, with a millimetre of slack for the rounding Chrome does. */
const A4 = { width: 595, height: 842, tolerance: 3 }

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
    '/usr/bin/chromium-browser',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean)

  return candidates.find((candidate) => fs.existsSync(candidate)) || null
}

function get(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    http
      .get(url, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && redirects < 3) {
          res.resume()
          resolve(get(new URL(res.headers.location, url).href, redirects + 1))
          return
        }
        let body = ''
        res.setEncoding('utf8')
        res.on('data', (chunk) => (body += chunk))
        res.on('end', () => resolve({ status: res.statusCode, body }))
      })
      .on('error', reject)
  })
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function waitForServer(deadlineMs = 15000) {
  const started = Date.now()
  while (Date.now() - started < deadlineMs) {
    try {
      const res = await get(`${url}?t=${Date.now()}`)
      if (res.status === 200) return res.body
    } catch (error) {
      /* not up yet */
    }
    await sleep(250)
  }
  throw new Error(`the static server never answered on ${url}`)
}

async function main() {
  if (!fs.existsSync(resumeHtml)) {
    console.error('out/resume.html is missing - run `npm run build` (or `npm run resume`) first.')
    process.exit(1)
  }

  const browser = findBrowser()
  if (!browser) {
    console.error('No Chrome or Edge found. Set CHROME_PATH to a Chromium binary and try again.')
    process.exit(1)
  }

  /*
   * Never destroy a resume nobody else can recover. Two archives, because
   * there are two ways one arrives here: the copy that predates this script,
   * and a PDF put in public/resume.pdf by hand. The second is detected by
   * difference - a file that is not the byte-for-byte output of the last run
   * did not come from this script.
   */
  if (fs.existsSync(target)) {
    const backupDir = path.join(root, '.resume-backup')
    fs.mkdirSync(backupDir, { recursive: true })

    const original = path.join(backupDir, 'resume-original.pdf')
    if (!fs.existsSync(original)) {
      fs.copyFileSync(target, original)
      console.log(`kept the previous public/resume.pdf at ${path.relative(root, original)}`)
    }

    const lastOutput = path.join(outDir, 'resume.pdf')
    const isOurOutput =
      fs.existsSync(lastOutput) && fs.readFileSync(lastOutput).equals(fs.readFileSync(target))
    if (!isOurOutput) {
      const stamp = new Date().toISOString().slice(0, 16).replace(/[:T]/g, '-')
      const handPlaced = path.join(backupDir, `resume-replaced-${stamp}.pdf`)
      fs.copyFileSync(target, handPlaced)
      console.log(`archived the resume this run replaces at ${path.relative(root, handPlaced)}`)
    }
  }

  const server = spawn(process.execPath, [path.join(__dirname, 'serve-static.cjs'), String(port)], {
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  server.stdout.on('data', () => {})
  server.stderr.on('error', () => {})

  const profileDir = path.join(fs.mkdtempSync(path.join(require('os').tmpdir(), 'resume-chrome-')), 'profile')
  const staged = path.join(path.dirname(profileDir), 'resume.pdf')

  try {
    const html = await waitForServer()
    const missing = required.filter((word) => !html.includes(word))
    if (missing.length) throw new Error(`the rendered page is missing: ${missing.join(', ')}`)

    const args = [
      '--headless=new',
      '--disable-gpu',
      '--no-first-run',
      '--no-default-browser-check',
      '--no-pdf-header-footer',
      '--print-to-pdf-no-header',
      '--virtual-time-budget=6000',
      `--user-data-dir=${profileDir}`,
      `--print-to-pdf=${staged}`,
      url,
    ]

    const exitCode = await new Promise((resolve, reject) => {
      const child = spawn(browser, args, { stdio: ['ignore', 'pipe', 'pipe'] })
      let stderr = ''
      child.stdout.on('data', () => {})
      child.stderr.on('data', (chunk) => (stderr += chunk))
      child.on('error', reject)
      child.on('close', (code) => {
        if (code !== 0) reject(new Error(`${path.basename(browser)} exited ${code}\n${stderr.slice(-800)}`))
        else resolve(code)
      })
    })
    void exitCode

    if (!fs.existsSync(staged)) throw new Error('headless Chrome produced no PDF')

    if (!fs.readFileSync(staged).subarray(0, 5).toString('latin1').startsWith('%PDF-')) {
      throw new Error('the file headless Chrome wrote is not a PDF')
    }

    const pdf = extractText(staged)
    const size = `${pdf.width.toFixed(0)}x${pdf.height.toFixed(0)}pt`

    if (pdf.pageCount !== 1) {
      throw new Error(
        `the resume is ${pdf.pageCount || 'an unknown number of'} pages (${size}) - trim content until it fits on one A4 sheet`
      )
    }

    if (
      Math.abs(pdf.width - A4.width) > A4.tolerance ||
      Math.abs(pdf.height - A4.height) > A4.tolerance
    ) {
      throw new Error(`the page is ${size}, not A4 (${A4.width}x${A4.height}pt) - check the @page rule`)
    }

    // Case-insensitive: the sheet sets some lines in small caps by CSS.
    const flattened = pdf.text.replace(/\s+/g, ' ').toLowerCase()
    const missingWords = required.filter((word) => !flattened.includes(word.toLowerCase()))
    if (missingWords.length) {
      throw new Error(`the PDF is missing text it should contain: ${missingWords.join(', ')}`)
    }

    const leaked = forbidden.filter((word) => flattened.includes(word.toLowerCase()))
    if (leaked.length) {
      throw new Error(`the page furniture printed too (${leaked.join(', ')}) - check the print rules`)
    }

    console.log(`page: ${pdf.pageCount} × A4 (${size})`)
    console.log(`size: ${(fs.statSync(staged).size / 1024).toFixed(0)} KB`)
    console.log(`words checked: ${required.length}/${required.length}`)
    console.log(`text starts: ${flattened.trim().slice(0, 150)}`)

    fs.copyFileSync(staged, target)
    fs.copyFileSync(staged, path.join(outDir, 'resume.pdf'))
    console.log(`wrote ${path.relative(root, target)} and out/resume.pdf`)
  } finally {
    server.kill()
    fs.rmSync(path.dirname(profileDir), { recursive: true, force: true })
  }
}

main().catch((error) => {
  console.error(`resume build failed: ${error.message}`)
  process.exit(1)
})
