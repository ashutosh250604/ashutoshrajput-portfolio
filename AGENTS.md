# AGENTS.md

What an agent, or a person, needs to know before changing this repository. The
long version is [README.md](README.md); how to run the worktree is
[.freebuff/run.md](.freebuff/run.md).

## Copy rules

- **No em dashes.** U+2014 does not appear anywhere in this repository: copy,
  comments, docs, translations, commit messages. Where an em dash would go, use
  a hyphen (`-`), spaced when it separates two clauses. `npm run check` enforces
  this with [scripts/check-dashes.cjs](scripts/check-dashes.cjs), so a stray one
  fails the build rather than surviving in a translation nobody rereads.
- English copy lives only in [public/translations/en.json](public/translations/en.json).
  Every other locale carries the same keys, and `npm run check` fails when they
  drift. Add a key to all eight files at once.
- Metadata that belongs to a document, not a language, stays in English on
  purpose: terminal commands, the proof sheet's slug, the resume's printed
  labels. Do not translate them.

## Checks

Before calling a change done:

```bash
npx tsc --noEmit
npm run check
npm run build
```

`npm run resume` rebuilds `public/resume.pdf` from the `/resume` route, and the
blurb check compares that PDF with the current English copy. A copy change that
alters a project title or highlight needs both `npm run blurbs:write` (for the
profile README one directory up) and `npm run resume`.

## Commits

This repository's `commit-msg` hook strips third-party attribution trailers. Do
not add "Generated with" lines or `Co-Authored-By` trailers to commits here.
