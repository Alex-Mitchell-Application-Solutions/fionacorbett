import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

/**
 * The site proper: everything that carries the navigation.
 *
 * A group layout rather than the root one, so the root stays the document and
 * nothing else. Every public page now lives in here, including `/tell-fiona`,
 * which was deliberately outside it while the rest of the site was unfinished
 * and the link was being shared on its own.
 */
export default function SiteLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* Before the header, and the first thing a keyboard reaches. The gallery
          is a long list of links, and without this every visit to a second page
          means tabbing through all of them again. */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-header focus:rounded-sm focus:bg-surface-raised focus:px-4 focus:py-3 focus:text-text"
      >
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  )
}
