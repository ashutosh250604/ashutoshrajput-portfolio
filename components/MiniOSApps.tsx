'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type * as React from 'react'
import { ArrowUpRight, Download, Mail } from 'lucide-react'
import projects, { profileUrl } from '@/data/projects'
import skills from '@/data/skills'
import { emailAddress } from '@/data/socials'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalTime } from '@/lib/localTime'

/**
 * What is inside the desktop's windows.
 *
 * Every one of these reads the same files the site and the resume read —
 * data/projects.ts, data/skills.ts, data/socials.ts and the English strings —
 * so the desktop cannot claim anything the rest of the site does not. That is
 * also why the terminal is worth having: it is the site's own data, queryable.
 */

/** One definition list, used by About so its rows line up with the site's. */
function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="divide-y divide-white/10">
      {rows.map((row) => (
        <div key={row.label} className="flex items-baseline justify-between gap-6 py-2">
          <dt className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">{row.label}</dt>
          <dd className="text-right text-[13px] text-white/90">{row.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export function AboutApp() {
  const { t } = useLanguage()
  const clock = useLocalTime()

  const rows = [
    { label: t('about.spec.role'), value: t('hero.role.backend') },
    { label: t('about.spec.location'), value: t('contact.locationValue') },
    { label: t('about.spec.education'), value: t('about.education') },
    { label: t('about.spec.focus'), value: t('about.focus') },
    { label: t('about.spec.stack'), value: t('about.spec.stackValue') },
    { label: t('about.spec.status'), value: t('hero.openToWork') },
    { label: t('contact.localTime'), value: clock ?? '— —' },
  ]

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-3">
        <span
          aria-hidden
          className="grid h-9 w-9 place-items-center rounded-[3px] border border-white/25 font-mono text-[11px] tracking-[0.06em] text-white/85"
        >
          AR
        </span>
        <div>
          <p className="text-[15px] font-semibold tracking-tight text-white/95">{t('hero.name')}</p>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-white/55">
            {t('hero.role.backend')}
          </p>
        </div>
      </div>

      <Rows rows={rows} />

      <div className="flex flex-wrap gap-x-5 gap-y-2 font-mono text-[11px]">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-white/80 hover:text-[color:var(--os-accent)]"
        >
          github.com/ashutosh250604
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href={`mailto:${emailAddress}`}
          className="inline-flex items-center gap-1.5 text-white/80 hover:text-[color:var(--os-accent)]"
        >
          {emailAddress}
          <Mail className="h-3 w-3" />
        </a>
      </div>
    </div>
  )
}

export function ProjectsApp() {
  const { t } = useLanguage()

  return (
    <ul className="divide-y divide-white/10">
      {projects.map((project) => {
        const href = project.live ?? project.github
        return (
          <li key={project.id} className="py-3">
            <div className="flex items-baseline justify-between gap-4">
              <p className="text-[13px] text-white/90">{t(`project.${project.id}.title`)}</p>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.14em] text-white/55">
                {t(`projects.status.${project.status}`)}
              </span>
            </div>
            <p className="mt-1 font-mono text-[10px] leading-relaxed text-white/55">
              {project.tech.join(' · ')}
            </p>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-flex items-center gap-1 font-mono text-[10px] text-white/70 hover:text-[color:var(--os-accent)]"
              >
                {project.live ? t('projects.viewLive') : t('projects.viewCode')}
                <ArrowUpRight className="h-3 w-3" />
              </a>
            ) : (
              <p className="mt-1 font-mono text-[10px] text-white/55">{t('projects.status.private')}</p>
            )}
          </li>
        )
      })}
    </ul>
  )
}

export function ResumeApp() {
  const { t } = useLanguage()

  return (
    <div className="flex h-full flex-col items-start gap-4">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-9 place-items-center rounded-[3px] border border-white/25 font-mono text-[9px] uppercase text-white/70">
          PDF
        </span>
        <div>
          <p className="text-[13px] text-white/90">resume.pdf</p>
          <p className="font-mono text-[10px] text-white/55">{t('contact.localTime')}: A4 · 1 page</p>
        </div>
      </div>

      <p className="max-w-sm text-[12px] leading-relaxed text-white/60">{t('project.portfolio.description')}</p>

      <a
        href="/resume.pdf"
        download
        className="inline-flex items-center gap-2 rounded-sm bg-white/90 px-3 py-2 font-mono text-[11px] font-medium text-black transition-colors hover:bg-white"
      >
        <Download className="h-3.5 w-3.5" />
        {t('mobileNav.downloadResume')}
      </a>
    </div>
  )
}

export function TrashApp() {
  const { t } = useLanguage()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <p aria-hidden className="tabular font-mono text-3xl text-white/30">
        0
      </p>
      <p className="max-w-xs text-[12px] leading-relaxed text-white/55">{t('os.trashEmpty')}</p>
    </div>
  )
}

/**
 * A shell over the site's own data. The commands are the point: `cat about.txt`
 * prints the same strings the About window renders, and `projects` prints the
 * same projects the projects section lists.
 */
export function TerminalApp({ onExit }: { onExit: () => void }) {
  const { t } = useLanguage()
  const [lines, setLines] = useState<string[]>([])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [historyAt, setHistoryAt] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const files = useMemo(
    () => ['about.txt', 'skills.txt', 'projects/', 'resume.pdf', 'contact.txt'],
    []
  )

  const contents = useMemo(() => {
    const projectLines = projects.map(
      (project) =>
        `${project.id.padEnd(12)} ${project.year}  ${t(`project.${project.id}.title`)}` +
        (project.live ? `  ${project.live}` : '')
    )

    return {
      'about.txt': [
        t('hero.name'),
        t('hero.role.backend'),
        '',
        t('about.education'),
        t('contact.locationValue'),
        '',
        t('about.paragraph1'),
      ],
      'skills.txt': Object.entries(skills).map(([group, items]) => `${group.padEnd(10)} ${items.join(', ')}`),
      'projects/': projectLines,
      'resume.pdf': [`${t('mobileNav.downloadResume')} → /resume.pdf (A4, one page)`],
      'contact.txt': [emailAddress, profileUrl, ...projects.filter((p) => p.github).map((p) => p.github)],
    } as Record<string, string[]>
  }, [t])

  const commands = useMemo(() => {
    const help = [
      'help              this list',
      'ls                files in this directory',
      'cat <file>        print one of them',
      'whoami            who is logged in',
      'projects          what has been built',
      'skills            what it was built with',
      'contact           where to reach him',
      'date              the clock in Bangalore',
      'echo <text>       say it back',
      'clear             wipe the screen',
      'exit              leave the desktop',
    ]

    return {
      help: () => help,
      ls: () => files,
      whoami: () => [`${t('hero.name')} — ${t('hero.role.backend')}`],
      projects: () => contents['projects/'],
      skills: () => contents['skills.txt'],
      contact: () => contents['contact.txt'],
      date: () => [new Intl.DateTimeFormat('en-GB', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Asia/Kolkata' }).format(new Date())],
      echo: (args: string[]) => [args.join(' ')],
      cat: (args: string[]) => {
        const name = args[0]
        if (!name) return ['cat: which file? try: ls']
        const found = Object.keys(contents).find((file) => file === name || file === `${name}.txt` || file === `${name}/`)
        if (!found) return [`cat: ${name}: no such file`]
        return contents[found]
      },
      sudo: () => ['nice try — you have read access here, same as everyone'],
    } as Record<string, (args: string[]) => string[]>
  }, [contents, files, t])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [lines])

  const run = (raw: string) => {
    const trimmed = raw.trim()
    if (!trimmed) return

    setLines((previous) => [...previous, `visit@portfolio ~ % ${trimmed}`])
    setHistory((previous) => [...previous, trimmed])

    const [name, ...args] = trimmed.split(/\s+/)
    const command = name.toLowerCase()

    if (command === 'clear') {
      setLines([])
      return
    }
    if (command === 'exit') {
      onExit()
      return
    }

    const output = commands[command]
    setLines((previous) => [
      ...previous,
      ...(output ? output(args) : [`${name}: command not found — try: help`]),
      '',
    ])
  }

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      run(input)
      setInput('')
      setHistoryAt(null)
      return
    }

    // Up and down walk the history, the way a shell does.
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault()
      if (history.length === 0) return
      const current = historyAt ?? history.length
      const next = event.key === 'ArrowUp' ? Math.max(0, current - 1) : Math.min(history.length, current + 1)
      setHistoryAt(next === history.length ? null : next)
      setInput(next === history.length ? '' : history[next])
    }
  }

  return (
    <div className="flex h-full flex-col font-mono text-[11.5px] leading-relaxed">
      <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto pr-1 text-white/75">
        <p className="text-white/55">{t('os.terminal')} — {t('hero.name')} · {t('hero.role.backend')}</p>
        <p className="text-white/55">Type `help` and press return.</p>
        <p>&nbsp;</p>
        {lines.map((line, index) => (
          <p key={`${index}-${line}`} className={line.startsWith('visit@') ? 'text-[color:var(--os-accent)]' : undefined}>
            {line || '\u00a0'}
          </p>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 border-t border-white/15 pt-2">
        <span className="text-[color:var(--os-accent)]">%</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label={t('os.terminal')}
          className="w-full bg-transparent text-white/90 outline-none placeholder:text-white/55"
          placeholder="help"
        />
      </label>
    </div>
  )
}
