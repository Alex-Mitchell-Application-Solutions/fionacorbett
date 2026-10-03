import type { ReactNode } from 'react'

import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { Heading } from '@/components/primitives/Heading'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Rule } from '@/components/primitives/Rule'
import { Text } from '@/components/primitives/Text'
import type { Media } from '@/payload-types'

/**
 * Every page's hero: a full-bleed photograph with the page's title drawn over
 * its foot.
 *
 * One hero, used by every route. luxury-gardens has two — a block-driven one for
 * CMS pages and a second for garden pages — and they drifted into having the
 * same scrims, the same height and two copies of the reasoning. There are fewer
 * page types here, so there is one component and the differences are props.
 *
 * Why it is built this way, in the order the decisions matter:
 *
 * 1. **The photograph is the LCP element on every page**, so it is server
 *    rendered through next/image with `preload` set. Nothing above the fold may
 *    be a client component: React would have to download, parse and hydrate
 *    before the image request even started.
 *
 * 2. **Two scrims, not one.** The first runs bottom-up and is what makes the
 *    copy legible over an unknown photograph — and on this site every
 *    photograph is unknown, since they span six decades and every exposure from
 *    underlit to blown out. The second is a lighter wash under the header,
 *    because the first one gives the top of the image nothing, and the header
 *    sits on whatever the photograph happens to show there.
 *
 * 3. **`pt-header` with `items-end`.** The copy is anchored to the foot of the
 *    hero. Without the top padding it slides under the fixed bar on a short
 *    screen, which only shows up on a phone in landscape.
 *
 * 4. **Base is the phone.** The copy stacks; from md the aside moves beside it.
 */
export function PageHero({
  image,
  eyebrow,
  title,
  lead,
  aside,
  /**
   * False on a page whose hero is not the first thing rendered. Exactly one
   * image per page may be preloaded — more than one and they compete for
   * bandwidth, which makes LCP worse rather than better.
   */
  preload = true,
}: {
  image: number | Media | null | undefined
  eyebrow?: string | null
  title: string
  lead?: string | null
  /** The right-hand side from md: a date, a count, a caption. */
  aside?: ReactNode
  preload?: boolean
}) {
  return (
    <section
      data-hero
      // One height at every width, from a token rather than a viewport fraction
      // chosen here. The choice of svh over vh, lvh and dvh is reasoned in
      // tokens.css and is not a decision to re-take per call site.
      className="min-h-hero pt-header relative isolate flex items-end overflow-hidden pb-12 md:pb-16"
    >
      <div className="absolute inset-0 -z-10">
        <PayloadImage media={image} fill preload={preload} sizes="100vw" decorative />
        {/* The legibility scrim. Weighted through the middle as well as the
            foot: a portrait with a pale sky behind the shoulders puts the
            brightest part of the frame exactly where the heading sits. */}
        <div className="absolute inset-0 bg-gradient-to-t from-scrim/85 via-scrim/50 to-transparent" />
        {/* The second, lighter wash under the header. The scrim above runs
            bottom-up, so without this the top of the image has nothing behind
            the site's name. */}
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-scrim/50 to-transparent" />
      </div>

      {/* Width wide, matching the header, so the copy starts on the same
          vertical axis as the site name above it. */}
      <Container width="wide">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between md:gap-12">
          <div className="min-w-0">
            {eyebrow ? (
              <Eyebrow tone="inverse" size="lg" className="mb-4">
                {eyebrow}
              </Eyebrow>
            ) : null}

            {/* Fit-content, so the rule under the title runs exactly as far as
                the title does, whatever its length. */}
            <div className="w-fit max-w-3xl">
              <Heading level={1} size={{ base: 2, md: 1 }} className="text-text-inverse">
                {title}
              </Heading>

              <Rule tone="inverse" width="fill" className="mt-6" />
            </div>

            {lead ? (
              <Text tone="inverse" size="lead" className="mt-6 max-w-xl">
                {lead}
              </Text>
            ) : null}
          </div>

          {aside ? <div className="shrink-0 text-text-inverse">{aside}</div> : null}
        </div>
      </Container>
    </section>
  )
}
