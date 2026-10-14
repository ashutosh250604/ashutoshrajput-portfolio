# Ashutosh Rajput - Portfolio Website

A Modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS.

https://ashutoshrajput-portfolio.vercel.app/

## 🚀 Features

- ⚡ Next.js 14 with App Router
- 💎 TypeScript for type safety
- 🎨 Tailwind CSS for styling
- 🌙 Dark mode support
- 📱 Fully responsive design
- ♿ Accessible (WCAG compliant)
- 🎭 Smooth animations
- 🔍 SEO optimized
- ⚡ Fast performance

## 🛠️ Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** Framer Motion
- **Deployment:** Vercel

## 📁 Project Structure
├── app/
│ ├── layout.tsx # Root layout with theme provider
│ ├── page.tsx # Home page
│ └── globals.css # Global styles
├── components/
│ ├── Navbar.tsx # Navigation bar
│ ├── Hero.tsx # Hero section
│ ├── About.tsx # About section
│ ├── ProjectsGrid.tsx # Projects showcase
│ ├── ExperienceList.tsx # Work experience
│ ├── SkillsList.tsx # Skills & technologies
│ ├── ContactSection.tsx # Contact information
│ └── ... # Other components
├── data/
│ ├── projects.ts # Projects data
│ ├── skills.ts # Skills data
│ └── experience.ts # Experience data
└── public/
├── avatar.jpg # Profile picture
└── resume.pdf # Resume file


## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ashutosh250604/portfolio.git
cd portfolio

npm install
# or
yarn install

npm run dev
# or
yarn dev

```

Open http://localhost:3000 in your browser.

**Note:** When running in development mode, you'll see a Next.js development indicator icon in the bottom-right corner. This is normal and only appears during local development - it won't be visible in production.

### Resume

`public/resume.pdf` is generated, not hand-edited. It is a print of the `/resume` route, which reads the same `data/` files as the portfolio, so the sheet cannot drift away from the site:

```bash
npm run resume        # build, then print /resume to public/resume.pdf
npm run resume:only   # print from the existing out/ build
```

The script renders the page with headless Chrome or Edge (set `CHROME_PATH` if neither is found) and fails unless the result is one A4 page containing the expected text and none of the page furniture.

### Checking the build

```bash
npm run check                 # translations, key coverage, and AA contrast for every theme
npm run images                # re-cut avatar.jpg to the sizes the page actually uses
node scripts/audit-page.cjs   # serves out/ and measures it in headless Chrome
```

`npm run check` includes `scripts/check-contrast.cjs`, which measures the theme tokens arithmetically (text at 4.5:1, control fills at 3:1) and fails if the `.dark` block and the no-JavaScript `prefers-color-scheme` block drift apart.

`scripts/audit-page.cjs` reports first paint, largest contentful paint, layout shift, every request with its transfer size, and whether the skip link comes on screen when focused. Run it before and after a change to compare; the byte counts are exact, the timings are virtual-time and meant for comparison rather than as a prediction.

📄 License
This project is open source and available under the MIT License.

🤝 Contributing
Contributions, issues, and feature requests are welcome!

👤 Author
Ashutosh Rajput

GitHub: @ashutosh250604

LinkedIn: Ashutosh Rajput

Email: ashutoshrajput2506atgmaildotcom

🙏 Acknowledgments

Icons by Lucide

Deployment by Vercel
