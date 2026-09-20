import type { Metadata } from 'next'

import { PageHero } from '@/components/layout/PageHero'
import { MemoryForm } from '@/components/memories/MemoryForm'
import { Container } from '@/components/primitives/Container'
import { getSiteSettings } from '@/lib/content'
import { mintDwellToken } from '@/lib/dwell-token'

export const metadata: Metadata = {
  title: 'Share a memory',
  description: 'Write something for Fiona’s sixtieth.',
}

/**
 * The page the shared link points at.
 *
 * This is the one route a stranger lands on cold, from a message forwarded by
 * someone else, so it carries more explaining than anywhere else on the site.
 *
 * `/share` redirects here — see next.config.ts. The short form is for saying out
 * loud and printing on a card; this is the canonical one, because a bare /share
 * in a forwarded message tells the person nothing about what they are opening.
 *
 * The page is static and the form is the only client component on the site.
 *
 * **Revalidated hourly, and that is the dwell token's doing.** A token is
 * rendered into the form so that a browser running no JavaScript still posts a
 * valid one; prerendered once at build time it would be months old and every
 * no-JS submission would be rejected as expired. An hour against the token's
 * six-hour window leaves plenty of room.
 *
 * The baked token is shared by everyone who loads the page within that hour,
 * which is weaker than one per visitor. That is why the form fetches its own
 * from /memory-token on mount and overwrites this one whenever script runs: the
 * shared token is the floor, not the normal case.
 */
export const revalidate = 3600
export default async function ShareAMemoryPage() {
  const settings = await getSiteSettings()

  return (
    <>
      <PageHero image={settings.shareHero} title={settings.shareTitle} lead={settings.shareLead} />

      <Container width="content" className="section-y">
        <MemoryForm thanksMessage={settings.shareThanks} dwellToken={mintDwellToken()} />
      </Container>
    </>
  )
}
