import Link from 'next/link'

import { Container } from '@/components/primitives/Container'

/**
 * The fixed bar over every page.
 *
 * A server component with no JavaScript at all, and that is the design rather
 * than a stage it has not reached yet. luxury-gardens needs a drawer because it
 * has a dozen destinations; this site has three, and three links fit on a phone.
 * A hamburger here would be a menu, a trigger, focus trapping and an escape
 * handler in service of hiding two words.
 *
 * Fixed and transparent, sitting over the hero photograph. The hero draws its
 * own wash under this area — see PageHero — which is what makes the name legible
 * over an unknown image. A page without a hero must supply its own ground; there
 * is currently no such page, and AGENTS.md records that as a constraint on
 * adding one.
 */
const LINKS = [
  { href: '/gallery', label: 'Photographs' },
  { href: '/memories', label: 'Memories' },
  { href: '/share-a-memory', label: 'Share a memory' },
] as const

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-header h-header">
      <Container width="wide" className="flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="title-face text-lg text-text-inverse whitespace-nowrap sm:text-xl"
          // The site's name is the h1 on the home page, so this is a link home
          // rather than a second heading. Labelled because "Fiona Corbett" on
          // its own does not say where the link goes.
          aria-label="Fiona Corbett, home"
        >
          Fiona Corbett
        </Link>

        <nav aria-label="Main">
          {/* gap-x only, with wrapping allowed: at 320px the three labels do not
              hold one line, and wrapping is better than a scrollbar or a menu. */}
          <ul className="flex flex-wrap items-center justify-end gap-x-5 gap-y-1 sm:gap-x-8">
            {LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="font-heading tracking-heading text-2xs uppercase text-text-inverse underline-offset-8 hover:underline sm:text-xs"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </Container>
    </header>
  )
}
