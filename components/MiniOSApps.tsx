'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type * as React from 'react'
import { ArrowUpRight, Download, Folder, Mail } from 'lucide-react'
import projects, { profileUrl } from '@/data/projects'
import skills from '@/data/skills'
import { emailAddress } from '@/data/socials'
import { useLanguage } from '@/contexts/LanguageContext'
import { useLocalTime } from '@/lib/localTime'
import type { OsAppId } from '@/lib/os'
import { AppIcon } from './MiniOSIcons'

/**
 * What is inside the desktop's windows.
 *
 * Every one of these reads the same files the site and the resume read -
 * data/projects.ts, data/skills.ts, data/socials.ts and the English strings -
 * so the desktop cannot claim anything the rest of the site does not. That is
 * also why the terminal is worth having: it is the site's own data, queryable.
 */

/** The spec sheet, set the way a Mac writes one: label left, value right. */
function Rows({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="overflow-hidden rounded-[7px] border border-white/[0.08] bg-white/[0.03]">
      {rows.map((row) => (
        <div
          key={row.label}
          className="flex items-baseline justify-between gap-5 border-b border-white/[0.07] px-3 py-2 last:border-b-0"
        >
          <dt className="shrink-0 text-[11px] text-white/50">{row.label}</dt>
          <dd className="min-w-0 truncate text-right text-[11.5px] text-white/90">{row.value}</dd>
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
    { label: t('contact.localTime'), value: clock ?? '--:--' },
  ]

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex flex-col items-center gap-2.5 text-center">
        <img
          src="/avatar.webp"
          alt=""
          width={64}
          height={64}
          className="h-16 w-16 rounded-full object-cover shadow-[0_0_0_1px_rgba(255,255,255,0.18),0_8px_20px_-8px_rgba(0,0,0,0.8)]"
        />
        <div>
          <p className="text-[17px] font-semibold tracking-tight text-white/95">{t('hero.name')}</p>
          <p className="mt-0.5 text-[11.5px] text-white/55">{t('hero.role.backend')}</p>
        </div>
      </div>

      <div className="w-full">
        <Rows rows={rows} />
      </div>

      <div className="flex w-full flex-col items-center gap-1.5 border-t border-white/[0.08] pt-3 text-[11.5px]">
        <a
          href={profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-white/75 transition-colors hover:text-[color:var(--os-accent)]"
        >
          github.com/ashutosh250604
          <ArrowUpRight className="h-3 w-3" />
        </a>
        <a
          href={`mailto:${emailAddress}`}
          className="inline-flex items-center gap-1.5 text-white/75 transition-colors hover:text-[color:var(--os-accent)]"
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
    <ul className="-mx-1 divide-y divide-white/[0.07]">
      {projects.map((project) => {
        const href = project.live ?? project.github
        const title = t(`project.${project.id}.title`)
        const body = (
          <>
            <span
              aria-hidden
              className="grid h-7 w-7 shrink-0 place-items-center rounded-[6px] bg-[#0a84ff]/15 text-[color:var(--os-accent)]"
            >
              <Folder className="h-4 w-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-[12.5px] font-medium text-white/90">{title}</span>
              <span className="mt-0.5 block truncate text-[11px] text-white/55">
                {project.tech.join(' · ')}
              </span>
            </span>
            <span className="tabular shrink-0 text-[10.5px] text-white/55">{project.year}</span>
            {href ? (
              <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-white/30 transition-colors group-hover:text-[color:var(--os-accent)]" />
            ) : null}
          </>
        )

        return (
          <li key={project.id}>
            {href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 rounded-[6px] px-2 py-2.5 transition-colors hover:bg-white/[0.06]"
              >
                {body}
              </a>
            ) : (
              <div className="flex items-center gap-3 px-2 py-2.5">
                {body}
                <span className="shrink-0 text-[10.5px] text-white/55">{t('projects.status.private')}</span>
              </div>
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
    <div className="flex h-full gap-4">
      {/* a Quick Look-sized page, enough to recognise the sheet before opening it */}
      <div
        aria-hidden
        className="relative w-[40%] max-w-[152px] shrink-0 overflow-hidden rounded-[2px] bg-[#fbfbfd] shadow-[0_12px_26px_-10px_rgba(0,0,0,0.8)] ring-1 ring-black/25"
      >
        <div className="h-[5px] bg-[#e5484d]" />
        <div className="p-3">
          <p className="text-[9px] font-semibold leading-tight tracking-tight text-[#1c1c1e]">{t('hero.name')}</p>
          <p className="mt-0.5 text-[6.5px] text-[#6b6b70]">{t('hero.role.backend')}</p>
          <div className="mt-3 space-y-[5px]">
            {[92, 78, 85, 70, 88, 62, 80, 74, 86, 58].map((width, index) => (
              <span
                key={index}
                className="block h-[2px] rounded-full bg-[#d8d8dd]"
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
          <div className="mt-3 flex items-center gap-1.5 border-t border-[#e5e5ea] pt-2 text-[5.5px] text-[#8a8a90]">
            <span className="rounded-[2px] bg-[#e5484d] px-1 py-[1px] font-bold text-white">PDF</span>
            A4 · 1 page
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col items-start gap-3">
        <div className="min-w-0">
          <p className="truncate text-[13px] font-medium text-white/90">resume.pdf</p>
        </div>
        <p className="text-[11.5px] leading-relaxed text-white/55">{t('project.portfolio.description')}</p>
        <a
          href="/resume.pdf"
          download
          className="mt-auto inline-flex items-center gap-2 rounded-[6px] bg-white/90 px-3 py-1.5 text-[11.5px] font-medium text-black transition-colors hover:bg-white"
        >
          <Download className="h-3.5 w-3.5" />
          {t('mobileNav.downloadResume')}
        </a>
      </div>
    </div>
  )
}

export function TrashApp() {
  const { t } = useLanguage()

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <AppIcon app="trash" size={68} />
      <p className="max-w-xs text-[11.5px] leading-relaxed text-white/55">{t('os.trashEmpty')}</p>
    </div>
  )
}

/**
 * A shell over the site's own data. The commands are the point: `cat about.txt`
 * prints the same strings the About window renders, and `projects` prints the
 * same projects the projects section lists.
 */
export function TerminalApp({
  onExit,
  onOpenApp,
}: {
  onExit: () => void
  onOpenApp: (app: OsAppId) => void
}) {
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
      'open <app>        open another window',
      'pwd               where this shell thinks it is',
      'history           what has been typed',
      'echo <text>       say it back',
      'clear             wipe the screen',
      'exit              leave the desktop',
    ]

    const windows: Record<string, OsAppId> = {
      projects: 'projects',
      files: 'projects',
      terminal: 'terminal',
      about: 'about',
      resume: 'resume',
      trash: 'trash',
    }

    return {
      help: () => help,
      ls: () => files,
      whoami: () => [`${t('hero.name')} · ${t('hero.role.backend')}`],
      projects: () => contents['projects/'],
      skills: () => contents['skills.txt'],
      contact: () => contents['contact.txt'],
      date: () => [
        `${new Intl.DateTimeFormat('en-GB', {
          dateStyle: 'full',
          timeStyle: 'short',
          timeZone: 'Asia/Kolkata',
        }).format(new Date())} IST`,
      ],
      open: (args: string[]) => {
        const requested = (args[0] ?? '').toLowerCase()
        if (!requested) return ['open: which app? projects, terminal, about, resume or trash']
        const app = windows[requested]
        if (!app) return [`open: ${requested}: no such app`]
        if (app === 'terminal') return ['open: the terminal is already open']
        onOpenApp(app)
        return [`open: ${app}`]
      },
      pwd: () => ['/home/visit/portfolio'],
      history: () =>
        history.length > 0
          ? history.map((line, index) => `${String(index + 1).padStart(2, '0')}  ${line}`)
          : ['history: nothing typed yet'],
      echo: (args: string[]) => [args.join(' ')],
      cat: (args: string[]) => {
        const name = args[0]
        if (!name) return ['cat: which file? try: ls']
        const found = Object.keys(contents).find((file) => file === name || file === `${name}.txt` || file === `${name}/`)
        if (!found) return [`cat: ${name}: no such file`]
        return contents[found]
      },
      sudo: () => ['nice try - you have read access here, same as everyone'],
    } as Record<string, (args: string[]) => string[]>
  }, [contents, files, history, onOpenApp, t])

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
      ...(output ? output(args) : [`${name}: command not found - try: help`]),
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
      <div
        ref={scrollRef}
        role="log"
        aria-live="polite"
        className="min-h-0 flex-1 select-text overflow-y-auto pr-1 text-white/75"
      >
        <p className="text-white/55">{t('os.terminal')} · {t('hero.name')} · {t('hero.role.backend')}</p>
        <p className="text-white/55">Type `help` and press return.</p>
        <p>&nbsp;</p>
        {lines.map((line, index) => (
          <p
            key={`${index}-${line}`}
            className={`whitespace-pre-wrap break-words ${line.startsWith('visit@') ? 'text-[color:var(--os-accent)]' : ''}`}
          >
            {line || '\u00a0'}
          </p>
        ))}
      </div>

      <label className="mt-3 flex items-center gap-2 border-t border-white/15 pt-2 transition-colors focus-within:border-[color:var(--os-accent)]">
        <span aria-hidden className="text-[color:var(--os-accent)]">%</span>
        <input
          ref={inputRef}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={onKeyDown}
          spellCheck={false}
          autoComplete="off"
          aria-label={t('os.terminal')}
          data-terminal-input
          className="w-full bg-transparent text-white/90 outline-none placeholder:text-white/55"
          placeholder="help"
        />
      </label>
    </div>
  )
}
