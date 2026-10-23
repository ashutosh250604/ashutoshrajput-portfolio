import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        primary: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        // Editorial tokens, resolved from CSS variables so one class works in
        // both themes (see app/globals.css).
        paper: 'rgb(var(--paper) / <alpha-value>)',
        ink: 'rgb(var(--ink) / <alpha-value>)',
        muted: 'rgb(var(--muted) / <alpha-value>)',
        rule: 'rgb(var(--rule) / <alpha-value>)',
        //
        // `accent` is the one accent, tuned per theme so it is legible in both
        // roles it plays: as text on the paper (>= 4.5:1) and as a fill with
        // `accent-on` on top of it (>= 4.5:1). Never use primary-500/600 for
        // text - that is what failed the contrast audit.
        accent: {
          DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
          strong: 'rgb(var(--accent-strong) / <alpha-value>)',
          on: 'rgb(var(--on-accent) / <alpha-value>)',
        },
      },
      fontFamily: {
        // The families are self-hosted by next/font and exposed as variables
        // (see app/layout.tsx); the named fallbacks cover the case where the
        // variables are missing.
        sans: [
          'var(--font-sans)',
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'Roboto',
          'sans-serif',
        ],
        mono: [
          'var(--font-mono)',
          'JetBrains Mono',
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Consolas',
          'monospace',
        ],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-down': 'slideDown 0.15s ease-out',
        'slide-in-right': 'slideInRight 0.25s ease-out',
        'card-in': 'cardIn 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both',
        'orbit': 'orbit 90s linear infinite',
        // The desktop's start-up bar, timed to the boot delay in MiniOS.tsx.
        'os-boot': 'osBoot 1.6s cubic-bezier(0.4, 0, 0.2, 1) forwards',
        'os-open': 'osOpen 0.18s ease-out both',
        // Blueprint's column guides drop in from the top; the press proof's
        // marks fade up. Both are short enough to read as the instrument
        // arriving rather than as an animation being played at you.
        'rules-in': 'rulesIn 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both',
        'marks-in': 'marksIn 0.45s ease-out both',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(12px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-6px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideInRight: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        cardIn: {
          '0%': { transform: 'translateY(16px) scale(0.96)', opacity: '0' },
          '100%': { transform: 'translateY(0) scale(1)', opacity: '1' },
        },
        orbit: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        osBoot: {
          '0%': { width: '3%' },
          '100%': { width: '100%' },
        },
        osOpen: {
          '0%': { transform: 'scale(0.98)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        rulesIn: {
          '0%': { transform: 'scaleY(0)', opacity: '0' },
          '100%': { transform: 'scaleY(1)', opacity: '1' },
        },
        marksIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
export default config
