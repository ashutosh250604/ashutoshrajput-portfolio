import { Github, Linkedin, Mail } from 'lucide-react'
import XLogo from '@/components/XLogo'

export const emailAddress = 'ashutoshrajput2506@gmail.com'

export const socials = [
  { name: 'GitHub', icon: Github, url: 'https://github.com/ashutosh250604' },
  { name: 'LinkedIn', icon: Linkedin, url: 'https://www.linkedin.com/in/ashutoshrajp' },
  { name: 'Email', icon: Mail, url: `mailto:${emailAddress}` },
  { name: 'X', icon: XLogo, url: 'https://x.com/ashutoshrajp_' },
]
