import Link from 'next/link'

import { HeaderShell } from '@/components/layout/HeaderShell'
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
 * Recedes over a hero: at the top of such a page the bar is lifted away and the
 * name and button are white over the photograph; scrolling brings the bar in and
 * the type settles to ink. See header.css and HeaderShell.
 */
const LINKS = [
  { href: '/tell-fiona', label: 'Tell Fiona what she means to you' },
  { href: '/gallery', label: 'The photographs' },
  { href: '/memories', label: 'Memories' },
] as const

function DrawerPanel() {
  return (
    <div className="site-nav-drawer-body pb-16">
      <nav aria-label="Main" className="w-full">
        <ul className="site-nav-drawer-items flex flex-col items-end gap-10 text-right">
          {LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                // The sans, at text-xl, as luxury-gardens sets its drawer: a list
                // of destinations to choose between, not display type.
                className="font-body block text-xl leading-tight text-text"
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
    <HeaderShell className="site-header inset-x-0 top-0 z-header h-header">
      <Container width="wide" className="flex h-full items-center justify-between gap-6">
        <Link
          href="/"
          className="site-header-persistent title-face whitespace-nowrap text-lg sm:text-xl"
          // Labelled because "Fiona Corbett" alone does not say where it goes.
          aria-label="Fiona Corbett, home"
        >
          Fiona Corbett
        </Link>

        <div className="site-header-persistent">
          <NavDrawer panel={<DrawerPanel />} />
        </div>
      </Container>
    </HeaderShell>
  )
}
