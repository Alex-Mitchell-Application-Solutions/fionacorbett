import Link from 'next/link'

import { NavDrawer } from '@/components/layout/NavDrawer'
import { Container } from '@/components/primitives/Container'

/**
 * The fixed bar over every page in the site proper: the name on the left, the
 * menu button on the right.
 *
 * The links live in a drawer that slides in from the right, ported from
 * luxury-gardens. The drawer is the only client code here; the list below is
 * rendered on the server and handed to it, so the links cost no JavaScript.
 *
 * Fixed and transparent, sitting over the hero photograph. The hero draws its
 * own wash under this area — see PageHero — which is what makes the name and the
 * button legible over an unknown image.
 */
const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/tell-fiona', label: 'Tell Fiona what she means to you' },
  { href: '/gallery', label: 'The photographs' },
  { href: '/memories', label: 'Memories' },
] as const

function DrawerPanel() {
  return (
    <div className="site-nav-drawer-body pb-16">
      <nav aria-label="Main" className="w-full">
        <ul className="site-nav-drawer-items flex flex-col items-end gap-8 text-right">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="title-face block text-2xl leading-tight text-text text-balance md:text-3xl"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}

export function SiteHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-header h-header text-text-inverse">
      <Container width="wide" className="flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="title-face whitespace-nowrap text-lg sm:text-xl"
          // Labelled because "Fiona Corbett" alone does not say where it goes.
          aria-label="Fiona Corbett, home"
        >
          Fiona Corbett
        </Link>

        <NavDrawer panel={<DrawerPanel />} />
      </Container>
    </header>
  )
}
