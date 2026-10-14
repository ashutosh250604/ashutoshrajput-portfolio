import { ArrowUpRight } from 'lucide-react'
import { socials } from '@/data/socials'

/** Text links, for the sections that are set like a document. */
export default function SocialLinks() {
  return (
    <ul className="flex flex-wrap gap-x-5 gap-y-2">
      {socials.map((social) => (
        <li key={social.name}>
          <a
            href={social.url}
            target={social.url.startsWith('http') ? '_blank' : undefined}
            rel={social.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            className="group inline-flex items-center gap-1 font-mono text-xs underline-offset-4 hover:text-accent hover:underline hover:text-accent"
          >
            {social.name}
            <ArrowUpRight className="h-3 w-3 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </a>
        </li>
      ))}
    </ul>
  )
}
