import { Github, Linkedin, Mail, Twitter } from 'lucide-react'

const socials = [
  {
    name: 'GitHub',
    icon: Github,
    url: 'https://github.com/ashutosh250604',
    color: 'hover:text-gray-900 dark:hover:text-white'
  },
  {
    name: 'LinkedIn',
    icon: Linkedin,
    url: 'https://www.linkedin.com/in/ashutoshrajp',
    color: 'hover:text-blue-600'
  },
  {
    name: 'Email',
    icon: Mail,
    url: 'mailto:ashutoshrajput2506@gmail.com',
    color: 'hover:text-red-500'
  },
  {
    name: 'X',
    icon: Twitter,
    url: 'https://x.com/ashutoshrajp_',
    color: 'hover:text-gray-900 dark:hover:text-white'
  }
]

export default function SocialBar() {
  return (
    <div className="flex gap-4">
      {socials.map((social) => {
        const Icon = social.icon
        return (
          <a
            key={social.name}
            href={social.url}
            target={social.url.startsWith('http') ? '_blank' : undefined}
            rel={social.url.startsWith('http') ? 'noopener noreferrer' : undefined}
            className={`p-3 glass rounded-full transition-all duration-200 hover:shadow-lg hover:scale-110 ${social.color}`}
            aria-label={social.name}
          >
            <Icon className="w-5 h-5" />
          </a>
        )
      })}
    </div>
  )
}