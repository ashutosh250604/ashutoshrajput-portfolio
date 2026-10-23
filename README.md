# Ashutosh Rajput - Portfolio Website

A Modern, responsive portfolio website built with Next.js, TypeScript, and Tailwind CSS.

https://ashutoshrajput-portfolio.vercel.app/

## 🚀 Features

- ⚡ Next.js 15 with App Router
- 💎 TypeScript for type safety
- 🎨 Tailwind CSS for styling
- 🌙 Dark mode support
- 📱 Fully responsive design
- ♿ Accessible (WCAG compliant)
- 🎭 Smooth animations
- 🔍 SEO optimized
- ⚡ Fast performance

## 🛠️ Tech Stack

- **Framework:** Next.js 15
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Icons:** Lucide React
- **Animations:** CSS keyframes and transitions
- **Deployment:** Vercel

## 📁 Project Structure

```text
├── app/
│   ├── layout.tsx          # Root layout, fonts, pre-paint theme script
│   ├── page.tsx            # Home page, section by section
│   ├── globals.css         # Design tokens, print rules, animations
│   └── resume/             # The printable /resume route
├── components/             # Sections, chrome, overlays and the mini desktop
├── contexts/               # Language provider and its eight locales
├── data/                   # Projects, skills, experience, socials, colophon
├── lib/                    # Shortcuts, scroll lock, egg register, local clock
├── public/
│   ├── translations/       # en, ja, zh, es, de, ru, hi, gu
│   ├── avatar.jpg|webp     # Profile plate
│   └── resume.pdf          # Generated from /resume
└── scripts/                # Checks, resume printer, link and blurb audits
```


## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/ashutosh250604/ashutoshrajput-portfolio.git
cd ashutoshrajput-portfolio

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
npm run check                 # em dashes, translations, key coverage, AA contrast, links, project blurbs
npm run links                 # just the link audit, on its own
npm run blurbs                # just the project-blurb drift check
npm run blurbs:write          # regenerate the profile README's project table
npm run images                # re-cut avatar.jpg to the sizes the page actually uses
node scripts/audit-page.cjs   # serves out/ and measures it in headless Chrome
```

`npm run check` includes `scripts/check-dashes.cjs`, the repository-wide copy rule: U+2014 is not allowed in any source file, doc or translation, and the run fails naming the line. Where an em dash would go, write a hyphen. See [AGENTS.md](AGENTS.md).

It also includes `scripts/check-contrast.cjs`, which measures the theme tokens arithmetically (text at 4.5:1, control fills at 3:1) and fails if the `.dark` block and the no-JavaScript `prefers-color-scheme` block drift apart.

It also includes `scripts/check-links.cjs`, which fetches every URL the site and the READMEs publish: it reads the TSX, the data files, the translation JSON and this README, and picks up the profile README one directory up (`PROFILE_README=/path/to/README.md` to point it elsewhere) - so social links, live demos, demo hosts and shields.io badges are all covered by the same run. A 404, a 410 or any other dead 4xx fails the run; internal `/paths` and `#anchors` are checked without the network, against `public/`, `app/` and the ids the components actually render.

Two states are reported but do not fail: a host that refuses bots (403/406/429, and LinkedIn's 999) and one that is not serving yet (5xx, or a free instance still waking up). That line was drawn from measurement, not taste - `leetcode.com` answers 403 and a sleeping Render instance answers 503 to a first request and 200 to the next, so failing on those would only teach everyone to ignore the check. Both are printed loudly, because a link that resolves is not the same as a service that is up.

### One source for the project blurbs

A project's blurb is written once, in `public/translations/en.json`. That one file is imported by `contexts/LanguageContext.tsx` as the site's English defaults and by `app/resume/page.tsx` for the printed sheet, and `scripts/project-blurbs.cjs` generates the profile README's table from it, so all three surfaces cannot disagree. Nothing about a project is retyped in a second voice.

The same script is the check, and `npm run check` runs it. It fails when

- a project in `data/projects.ts` has no title, no description or fewer highlights than it declares;
- the README's table between `<!-- projects:start -->` and `<!-- projects:end -->` is not exactly what the blurbs would generate;
- `public/resume.pdf` no longer contains the current titles and the two highlights each project prints - the sheet is a build artifact, and this is how an edited blurb is caught while the PDF on the site still says the old thing.

When a blurb changes, run `npm run blurbs:write` and `npm run resume`; the check tells you which of the two is stale, and names the line.

The README lives in its own repository one directory up, so it can be absent - that is reported as a skip, never as a pass. Set `PROFILE_README=/path/to/README.md` to point at another copy.

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
