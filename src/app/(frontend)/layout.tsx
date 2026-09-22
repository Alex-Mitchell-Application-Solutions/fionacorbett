import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { isIndexable, siteUrl } from '@/lib/site-env'

import '@/styles/globals.css'

const SITE_TITLE = 'Fiona Corbett'
const SITE_DESCRIPTION =
  'Sixty years of Fiona, in photographs and in the words of the people who know her.'

/**
 * The document, and nothing else.
 *
 * The site's chrome — header, footer, skip link — deliberately does NOT live
 * here. It lives in `(site)/layout.tsx`, which wraps the pages that are part of
 * the site proper. `/tell-fiona` sits outside that group, because it is
 * shared on its own while the rest of the site is still being built and must not
 * link anywhere a recipient cannot go yet.
 *
 * Everything genuinely common to every page is here: the language, the font
 * preload, the metadata base. Duplicating those into two root layouts would be
 * the obvious alternative and is worse — the `metadataBase` in particular is the
 * kind of thing that gets fixed in one copy and not the other, and the symptom
 * is a shared link with a broken preview image.
 */
export function generateMetadata(): Metadata {
  return {
    // Every relative URL in the head — an uploaded share image is served from
    // /api/media/file/… — resolves against the site's own origin. Without this
    // Next resolves them against localhost, so a link shared in WhatsApp carries
    // an image nobody else can load. Which, on a site whose entire distribution
    // is a link shared in WhatsApp, is the whole first impression.
    metadataBase: new URL(siteUrl()),
    title: {
      default: SITE_TITLE,
      template: '%s | Fiona Corbett',
    },
    description: SITE_DESCRIPTION,
    // Not indexed anywhere, production included. See isIndexable() for why that
    // is a decision rather than an omission. It matters more than usual while
    // /tell-fiona is circulating ahead of the site being finished.
    robots: isIndexable() ? undefined : { index: false, follow: false },
    openGraph: {
      type: 'website',
      locale: 'en_GB',
      siteName: SITE_TITLE,
      title: SITE_TITLE,
      description: SITE_DESCRIPTION,
    },
  }
}

export default function FrontendLayout({ children }: { children: ReactNode }) {
  return (
    // en-GB rather than en. It is what makes the base layer's hyphenation use
    // British break patterns, and it inserts no character into the DOM, so
    // copied text is unchanged.
    <html lang="en-GB">
      <head>
        {/*
          Only the body face is preloaded. Preloading the serif as well would
          have the two compete with the hero photograph for bandwidth in exactly
          the window that decides LCP, and the serif's first appearance is a
          heading that falls back legibly.

          400 is body copy, which is most of any page here. 300 arrives with the
          hero heading and 700 only where something is emphasised; neither is
          worth a second preload.
        */}
        <link
          rel="preload"
          href="/fonts/lato-400.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/*
          The header's no-JavaScript fallback. HeaderShell is what keeps
          data-scrolled up to date, so without it the attribute stays 'false'
          and the bar would be lifted out of sight for good on any page with a
          hero. This pins it visible. Unlayered, so it beats @layer components.
        */}
        <noscript>
          <style>{`.site-header::before{opacity:1;transform:translateY(0)}.site-header-persistent{color:var(--color-text)}`}</style>
        </noscript>
      </head>
      <body>{children}</body>
    </html>
  )
}
