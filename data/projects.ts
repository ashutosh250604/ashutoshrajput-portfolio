export type ProjectStatus = 'live' | 'running' | 'shipped' | 'private'

export interface Project {
  id: string
  /**
   * The short name, as the project is actually called: Wault, 7–8. The site
   * shows the longer `project.<id>.title` instead ("Wault - a UPI-Style
   * Wallet"); this is what the generated README links read as.
   */
  name: string
  year: string
  status: ProjectStatus
  /** Number of `project.<id>.highlightN` keys that exist for this project. */
  highlights: number
  tech: string[]
  github?: string
  live?: string
}

/**
 * The four projects shown on the page, in order. Everything else lives behind
 * the "see all repositories" link at the end of the section.
 *
 * Links are checked, not assumed: the wallet repo was renamed to `wault-upi`,
 * and the card game's live URL is the Vercel one (the GitHub Pages path in its
 * README is gone).
 */
const projects: Project[] = [
  {
    id: 'wallet-app',
    name: 'Wault',
    year: '2026',
    status: 'live',
    highlights: 3,
    tech: ['Python', 'Flask', 'PostgreSQL', 'React 19', 'TypeScript', 'Docker'],
    github: 'https://github.com/ashutosh250604/wault-upi',
    live: 'https://wault-upi.onrender.com',
  },
  {
    id: 'ifm-billing',
    name: 'IFM Billing Software',
    year: '2026',
    status: 'running',
    highlights: 3,
    tech: ['Python', 'Flask', 'SQLite', 'Jinja2', 'JavaScript'],
  },
  {
    id: 'card-game',
    name: '7–8',
    year: '2025',
    status: 'shipped',
    highlights: 3,
    tech: ['HTML', 'CSS', 'JavaScript'],
    github: 'https://github.com/ashutosh250604/7-8-strategic-card-game',
    live: 'https://7-8-strategic-card-game.vercel.app',
  },
  {
    id: 'portfolio',
    name: 'Portfolio',
    year: '2026',
    status: 'live',
    highlights: 3,
    tech: ['Next.js', 'TypeScript', 'Tailwind CSS'],
    github: 'https://github.com/ashutosh250604/ashutoshrajput-portfolio',
    live: 'https://ashutoshrajput-portfolio.vercel.app',
  },
]

export const profileUrl = 'https://github.com/ashutosh250604'

/** The card game behind the deck easter egg. */
export const cardGameUrl = 'https://7-8-strategic-card-game.vercel.app'

export default projects
