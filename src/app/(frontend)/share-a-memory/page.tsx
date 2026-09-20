import type { Metadata } from 'next'

import { PageHero } from '@/components/layout/PageHero'
import { MemoryForm } from '@/components/memories/MemoryForm'
import { Container } from '@/components/primitives/Container'
import { getSiteSettings } from '@/lib/content'

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
 * The page is static and the form is the only client component on the site. The
 * Turnstile site key is read here, on the server, and passed down: it is a
 * NEXT_PUBLIC value and therefore inlined at build time, which is why the
 * Dockerfile has to take it as a build argument as well as a runtime variable.
 */
export default async function ShareAMemoryPage() {
  const settings = await getSiteSettings()

  return (
    <>
      <PageHero image={settings.shareHero} title={settings.shareTitle} lead={settings.shareLead} />

      <Container width="content" className="section-y">
        <MemoryForm
          thanksMessage={settings.shareThanks}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? null}
        />
      </Container>
    </>
  )
}
