import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'
import { isIndexable, siteUrl } from '@/lib/site-env'

import '@/styles/globals.css'

const SITE_TITLE = 'Fiona Corbett'
const SITE_DESCRIPTION =
  'Sixty years of Fiona, in photographs and in the words of the people who know her.'

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
    // is a decision rather than an omission.
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
      </head>
      <body>
        {/* Before the header, and the first thing a keyboard reaches. The
            gallery is a long list of links, and without this every visit to a
            second page means tabbing through all of them again. */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-header focus:rounded-sm focus:bg-surface-raised focus:px-4 focus:py-3 focus:text-text"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
