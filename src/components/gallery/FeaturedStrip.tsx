import { PhotographPlate } from '@/components/gallery/PhotographPlate'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import type { Photograph } from '@/payload-types'

/**
 * The handful of photographs on the home page.
 *
 * A scroll-snap row rather than a grid, so it reads as a sample of something
 * larger rather than as the whole gallery shrunk down. The browser owns the
 * scrolling — see the `gallery-track` utility — so a swipe, a trackpad and the
 * keyboard all work with no JavaScript of ours.
 *
 * No arrow buttons. They would be a client component, and the one thing they add
 * over a native scroller is a pointer affordance on desktop, where the trackpad
 * already does it. The row is visibly cut off at the right edge, which is the
 * affordance.
 */
export function FeaturedStrip({ photographs }: { photographs: Photograph[] }) {
  return (
    <section aria-labelledby="featured-heading" className="section-y bg-surface-sunken">
      <Container width="wide" className="flex items-end justify-between gap-6">
        <Heading level={2} size={3} id="featured-heading">
          A few of them
        </Heading>
        <Button href="/gallery" variant="link" size="md" className="shrink-0">
          See them all
        </Button>
      </Container>

      {/* Outside the Container: the row runs to the edge of the viewport while
          its first card still lines up with the heading above, which is what
          `gallery-track`'s scroll-padding is for. */}
      <ul className="gallery-track mt-10 gap-6 gutter">
        {photographs.map((photograph) => (
          <li key={photograph.id} className="gallery-slide w-64 shrink-0 sm:w-72">
            <PhotographPlate photograph={photograph} />
          </li>
        ))}
      </ul>
    </section>
  )
}
