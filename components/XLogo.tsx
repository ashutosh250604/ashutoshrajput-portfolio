import type { SVGProps } from 'react'

/**
 * The current X mark. Lucide still ships the retired blue-bird `Twitter` icon
 * and carries no X replacement, so the glyph is inlined here from the official
 * wordmark. Drawn as a filled path inside the same 24×24 box the stock icons
 * use, so it drops into the existing icon slots unchanged.
 */
export default function XLogo(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  )
}
