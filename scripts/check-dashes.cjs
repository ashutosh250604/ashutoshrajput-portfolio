#!/usr/bin/env node
/**
 * No em dashes.
 *
 * This repository says what it means with hyphens, in prose, in comments, in
 * translation strings and in docs. The rule is easier to keep than to remember:
 * a single U+2014 anywhere in a file this script reads fails the run, and
 * `npm run check` runs it. The character is written as an escape so this file
 * passes its own check.
 *
 * Binary files are skipped by extension rather than by sniffing, because the
 * point is to catch text that a person wrote, not a glyph inside a PDF.
 */
const fs = require('fs')
const path = require('path')

const ROOT = path.resolve(__dirname, '..')
const EM = '\u2014'
const SKIP_DIRS = new Set(['node_modules', '.next', '.git', 'out'])
const TEXT_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.cjs',
  '.mjs',
  '.css',
  '.json',
  '.md',
  '.txt',
  '.html',
  '.svg',
])

const hits = []

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue
    const full = path.join(directory, entry.name)

    if (entry.isDirectory()) {
      walk(full)
      continue
    }

    if (!TEXT_EXTENSIONS.has(path.extname(entry.name))) continue

    let source
    try {
      source = fs.readFileSync(full, 'utf8')
    } catch {
      continue
    }
    if (!source.includes(EM)) continue

    const relative = path.relative(ROOT, full)
    source.split(/\r?\n/).forEach((line, index) => {
      if (line.includes(EM)) hits.push(`${relative}:${index + 1}`)
    })
  }
}

walk(ROOT)

if (hits.length > 0) {
  console.error(`Em dash found in ${hits.length} place${hits.length === 1 ? '' : 's'}:`)
  for (const hit of hits) console.error(`  ${hit}`)
  console.error('\nUse a hyphen instead. See AGENTS.md, "Copy rules".')
  process.exit(1)
}

console.log('No em dashes in source, copy or docs.')
