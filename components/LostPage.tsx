'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, FileText, Search } from 'lucide-react'
import { openPalette } from './CommandPalette'
import { revision } from '@/data/colophon'

/**
 * A 404 written as errata, not as an apology.
 *
 * The request path comes from the browser, because a flat export cannot know
 * which file was asked for: Vercel serves this same 404.html for every miss.
 * That is why the slip stays empty on the server and fills itself in on the
 * client - printing a guessed path would be a lie in the one place that is
 * supposed to be exact. The <title> itself is static: app/not-found.tsx
 * exports the metadata, so the tab is named before any JavaScript runs.
 */
export default function LostPage() {
  const [path, setPath] = useState<string | null>(null)

  useEffect(() => {
    setPath(window.location.pathname)
  }, [])

  const requested = path ?? 'the address you asked for'

  return (
    <section className="relative overflow-hidden">
      <div className="mx-auto max-w-6xl border-x border-rule/15 px-5 pb-16 pt-28 sm:px-8 sm:pb-24 sm:pt-32">
        <div className="grid gap-12 md:grid-cols-12 md:gap-14">
          <div className="relative md:col-span-7">
            {/* An index mark and a rule: the same furniture every section opens with. */}
            <div className="flex items-center gap-3 sm:gap-4">
              <span className="tabular font-mono text-xs text-accent">404</span>
              <span aria-hidden className="h-px flex-1 bg-rule/20" />
              <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                errata / dead link
              </span>
            </div>

            {/* The number as a watermark, not a headline: the sentence is the point. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-1 -top-10 select-none font-mono text-[9rem] font-semibold leading-none tracking-[-0.08em] text-rule/[0.08] sm:text-[12rem] lg:text-[14rem]"
            >
              404
            </span>
            <h1 className="relative mt-8 max-w-xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
              This page is <span className="text-accent">out of print</span>.
            </h1>

            <p className="relative mt-5 max-w-xl text-sm leading-relaxed text-ink/90 sm:text-base">
              The address you followed is not part of this edition. Nothing is broken on your end:
              the link is out of date, or it never pointed at a page that was set. There are no
              redirects here, so this is the honest end of the trail.
            </p>

            {/* A request slip, printed like the colophon's metadata. */}
            <div className="relative mt-8 border-y border-rule/15 py-3 font-mono text-xs">
              <p className="flex gap-2 break-all text-muted">
                <span aria-hidden className="shrink-0 text-accent">$</span>
                <span>
                  open <span className="text-ink/90">{requested}</span>
                </span>
              </p>
              <p className="mt-1.5 flex items-center gap-2 text-ink/90">
                <span aria-hidden className="text-muted">404</span>
                <span>no such document in this edition</span>
                <span aria-hidden className="inline-block h-3 w-1.5 animate-pulse bg-accent" />
              </p>
            </div>

            <div className="relative mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/"
                className="group inline-flex items-center gap-1.5 rounded-sm bg-accent px-4 py-2 text-xs font-semibold text-accent-on transition-all hover:scale-105 hover:bg-accent-strong hover:shadow-lg sm:px-5 sm:py-2.5 sm:text-sm"
              >
                Back to the front page
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <button
                type="button"
                onClick={openPalette}
                className="inline-flex items-center gap-2 rounded-sm border border-rule/20 px-4 py-2 font-mono text-xs transition-colors hover:border-accent hover:text-accent sm:px-5 sm:py-2.5"
              >
                <Search className="h-3.5 w-3.5" />
                Search the site
                <span className="tabular text-[10px] text-muted">⌘K</span>
              </button>
              <Link
                href="/resume"
                className="inline-flex items-center gap-1.5 px-1 py-2 font-mono text-xs text-muted underline-offset-4 transition-colors hover:text-accent hover:underline"
              >
                <FileText className="h-3.5 w-3.5" />
                Resume
              </Link>
            </div>
          </div>

          <aside className="md:col-span-5 md:pt-1">
            {/* A stamp on the slip, the way a rejected proof gets marked. */}
            <div className="mb-4 flex justify-end">
              <span
                aria-hidden
                className="rotate-[-5deg] border-[3px] border-double border-accent/70 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.22em] text-accent"
              >
                not found
              </span>
            </div>

            <div className="glass relative">
              <div className="flex items-center justify-between gap-3 border-b border-rule/15 px-4 py-3">
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted">
                  request.log
                </span>
                <span className="tabular font-mono text-[10px] uppercase tracking-[0.18em] text-accent">
                  exit 404
                </span>
              </div>

              <dl className="divide-y divide-rule/15 font-mono text-xs">
                <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <dt className="uppercase tracking-[0.18em] text-muted">Path</dt>
                  <dd className="break-all sm:text-right">{requested}</dd>
                </div>
                <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <dt className="uppercase tracking-[0.18em] text-muted">Status</dt>
                  <dd className="text-accent sm:text-right">404 - not in the index</dd>
                </div>
                <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <dt className="uppercase tracking-[0.18em] text-muted">Edition</dt>
                  <dd className="tabular sm:text-right">{revision}</dd>
                </div>
                <div className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
                  <dt className="uppercase tracking-[0.18em] text-muted">Served</dt>
                  <dd className="sm:text-right">static export</dd>
                </div>
              </dl>

              <p className="border-t border-rule/15 px-4 py-4 font-mono text-[11px] leading-relaxed text-muted">
                No redirect, no soft 200. The export has nothing at this address, so the server says
                so.
              </p>
            </div>

            <p className="mt-4 font-mono text-[10px] uppercase leading-relaxed tracking-[0.16em] text-muted">
              Try the palette: it knows every door. Or press <span className="text-ink/80">⇧⌘O</span>{' '}
              for the mini desktop.
            </p>
          </aside>
        </div>

        {/* A printer's registration strip, in the only characters this page deserves. */}
        <p
          aria-hidden
          className="mt-14 select-none overflow-hidden whitespace-nowrap border-t border-rule/15 pt-4 font-mono text-[10px] uppercase tracking-[0.3em] text-rule/30"
        >
          {'404 - not found - 404 - not found - 404 - not found - 404 - not found - 404 - not found - 404 - not found'}
        </p>
      </div>
    </section>
  )
}
