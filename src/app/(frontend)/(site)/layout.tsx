import type { ReactNode } from 'react'

import { SiteFooter } from '@/components/layout/SiteFooter'
import { SiteHeader } from '@/components/layout/SiteHeader'

/**
 * The site proper: everything that carries the navigation.
 *
 * A group layout rather than the root one, and the distinction is the whole
 * point of this file. `/tell-fiona` is outside this group and gets none of
 * it, because that URL is being shared while the rest of the site is still being
 * built — a header linking to a half-finished gallery is exactly what the people
 * receiving that link must not see.
 *
 * Adding a page to this group opts it into the chrome. That is the right default
 * and it should stay the default: the standalone treatment is the exception and
 * should have to be chosen deliberately, by placing a route outside the group,
 * rather than being something a page can drift into.
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
