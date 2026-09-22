import type { ReactNode } from 'react'

import { Container } from '@/components/primitives/Container'
import { Text } from '@/components/primitives/Text'

/**
 * The chrome for a page that is shared on its own.
 *
 * `/tell-fiona` is being sent out while the rest of the site is still being
 * built, so it carries no navigation at all. Not a hidden navigation, not a
 * disabled one — there is no anchor to anywhere on this page except the ones the
 * form needs.
 *
 * **Why there is a wordmark at all.** A page with no branding whatsoever reads
 * as a form someone has been phished into, which is the worst possible first
 * impression for a request to write something personal. So the name is there,
 * set exactly as the real header sets it — and it is a `<span>`, not a link.
 * That is the load-bearing detail: a logo is the one thing every visitor tries
 * to click to "see the rest", and the rest is not ready.
 *
 * **Why the footer carries no link either.** The real `SiteFooter` exists to
 * push people towards this page, which would be circular here, and it names the
 * domain in a way that invites typing it into a browser.
 *
 * When the site is finished, the fix is to move `tell-fiona` into the
 * `(site)` group and delete this. It is deliberately not built as a toggle: a
 * flag that controls whether a page leaks links to an unfinished site is a flag
 * that will one day be set wrong.
 */
export function StandaloneFrame({ children }: { children: ReactNode }) {
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-header focus:rounded-sm focus:bg-surface-raised focus:px-4 focus:py-3 focus:text-text"
      >
        Skip to content
      </a>

      {/* Same position, height and treatment as SiteHeader, so the page does not
          look like a different site from the one it will eventually join. */}
      <header className="fixed inset-x-0 top-0 z-header h-header">
        <Container width="wide" className="flex h-full items-center">
          <span className="title-face text-lg whitespace-nowrap text-text-inverse sm:text-xl">
            Fiona Corbett
          </span>
        </Container>
      </header>

      <main id="main">{children}</main>

      <footer className="bg-surface-inverse text-text-inverse">
        <Container width="wide" className="py-10">
          <Text tone="inverse" size="sm" className="opacity-dimmed">
            {/* No domain, because naming it invites someone to go and look at a
                site that is not finished. No year, because this is not a
                copyright notice and never was. */}
            Made for Fiona&rsquo;s 60th.
          </Text>
        </Container>
      </footer>
    </>
  )
}
