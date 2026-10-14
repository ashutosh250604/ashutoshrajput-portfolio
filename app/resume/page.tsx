import type { Metadata } from 'next'
import './resume.css'
import copyJson from '@/public/translations/en.json'
import projects, { profileUrl } from '@/data/projects'
import skills from '@/data/skills'
import experience from '@/data/experience'
import { emailAddress } from '@/data/socials'

/**
 * One page, printed. The content is the same content the site shows, pulled
 * from the same files: `data/projects.ts`, `data/skills.ts`,
 * `data/experience.ts` and the English strings — so the resume cannot drift
 * away from the portfolio.
 *
 * `scripts/make-resume.cjs` renders this route with headless Chrome and writes
 * the result to `public/resume.pdf`; it is not linked in the navigation, and it
 * asks search engines not to index it.
 */

export const metadata: Metadata = {
  title: 'Ashutosh Rajput — Resume',
  description: 'One-page resume: backend developer, Python and Flask, Bangalore.',
  robots: { index: false },
}

/** The site stores copy as flat keys; this is the same lookup, typed. */
const copy = copyJson as Record<string, string>
const t = (key: string) => copy[key] ?? key

const name = 'Ashutosh Rajput'
const role = t('hero.role.backend')
const location = t('contact.locationValue')

const contact = [
  { label: location, href: '' },
  { label: emailAddress, href: `mailto:${emailAddress}` },
  { label: 'github.com/ashutosh250604', href: profileUrl },
  { label: 'linkedin.com/in/ashutoshrajp', href: 'https://www.linkedin.com/in/ashutoshrajp' },
]

/** Two highlights per project keeps the sheet to one page. */
const highlightsPerProject = 2

/** "September 2023" -> "Sep 2023". */
const shortDate = (value: string) => {
  const parsed = new Date(`1 ${value}`)
  if (Number.isNaN(parsed.getTime())) return value
  return `${parsed.toLocaleString('en-US', { month: 'short' })} ${parsed.getFullYear()}`
}

const skillLabels: Record<string, string> = {
  languages: t('skills.languages'),
  backend: t('skills.backend'),
  database: t('skills.database'),
  frontend: t('skills.frontend'),
  tools: t('skills.tools'),
}

export default function Resume() {
  return (
    <div className="resume-page">
      <article className="sheet">
        <header className="sheet-head">
          <div className="sheet-head-row">
            <div>
              <h1>{name}</h1>
              <p className="sheet-role">{role}</p>
            </div>
            <ul className="sheet-contact">
              {contact.map((item) => (
                <li key={item.label}>
                  {item.href ? <a href={item.href}>{item.label}</a> : item.label}
                </li>
              ))}
            </ul>
          </div>
          <p className="sheet-summary">
            Backend developer with most of my work in Python and Flask over SQL: money movement, GST
            billing, and the unglamorous parts that have to be exactly right — a PIN verified on the
            server, a backup that restores, a PDF whose totals agree. Currently going deep on data
            structures and algorithms in Java, and building small things with GenAI.
          </p>
        </header>

        <section className="sheet-section">
          <h2>Experience</h2>

          {experience.map((job) => (
            <div className="entry" key={job.company}>
              <div className="entry-head">
                <h3>
                  {t(`experience.${job.company.toLowerCase().replace(/\s+/g, '')}.role`) || job.role}
                  <span className="entry-at">
                    {' '}
                    · <a href={job.url}>{job.company}</a>
                  </span>
                </h3>
                <span className="entry-when">
                  {shortDate(job.start)} — {shortDate(job.end)}
                </span>
              </div>

              <ul className="bullets">
                {(job.achievements ?? []).map((achievement, index) => {
                  const key = `experience.${job.company.toLowerCase().replace(/\s+/g, '')}.achievement${index + 1}`
                  return <li key={key}>{t(key) === key ? achievement : t(key)}</li>
                })}
              </ul>
            </div>
          ))}
        </section>

        <section className="sheet-section">
          <h2>Projects</h2>

          {projects.map((project) => {
            const highlights = Array.from(
              { length: Math.min(project.highlights, highlightsPerProject) },
              (_, index) => t(`project.${project.id}.highlight${index + 1}`)
            ).filter((value, index) => value !== `project.${project.id}.highlight${index + 1}`)

            const links = [
              { href: project.live, label: 'live' },
              { href: project.github, label: 'code' },
            ].filter((link) => Boolean(link.href))

            return (
              <div className="entry" key={project.id}>
                <div className="entry-head">
                  <h3>{t(`project.${project.id}.title`)}</h3>
                  <span className="entry-when">{t(`projects.status.${project.status}`)}</span>
                </div>

                <p className="entry-stack">
                  {project.tech.join(' · ')}
                  {links.length > 0 ? (
                    <>
                      {' — '}
                      {links.map((link, index) => (
                        <span key={link.label}>
                          {index > 0 ? ', ' : ''}
                          <a href={link.href as string}>{link.label}</a>
                        </span>
                      ))}
                    </>
                  ) : (
                    ' — internal build, no public link'
                  )}
                </p>

                <ul className="bullets">
                  {highlights.map((highlight) => (
                    <li key={highlight}>{highlight}</li>
                  ))}
                </ul>
              </div>
            )
          })}
        </section>

        <section className="sheet-section sheet-section--split">
          <div>
            <h2>Skills</h2>
            <dl className="sheet-skills">
              {Object.entries(skills).map(([category, items]) => (
                <div key={category}>
                  <dt>{skillLabels[category] ?? category}</dt>
                  <dd>{items.join(', ')}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <h2>Education</h2>
            {/*
              The site only carries the degree, so that is what prints. Add the
              college and years here and they appear on the sheet as well.
            */}
            <p className="entry-stack">{t('about.education')}</p>
          </div>
        </section>
      </article>
    </div>
  )
}
