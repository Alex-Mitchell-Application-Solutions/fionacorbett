import Link from 'next/link'

import { PayloadImage } from '@/components/primitives/PayloadImage'
import type { Photograph } from '@/payload-types'

/**
 * One photograph in the gallery grid.
 *
 * A link to the photograph's own page rather than a button that opens an
 * overlay, and that is the load-bearing decision in this component. An overlay
 * would be a client component holding index state, and it would give every
 * photograph the same URL — so nobody could send anyone a particular one, the
 * back button would leave the gallery entirely, and none of it would work before
 * JavaScript arrived. A route per photograph gets all of that from the browser.
 *
 * The caption sits under the image rather than over it. Over it needs a scrim,
 * a scrim darkens the photograph, and the photograph is the point.
 */
export function PhotographPlate({
  photograph,
  /**
   * True for the first few in the first decade only. Everything below the fold
   * loads lazily, which on a page that may carry two hundred images is the
   * difference between a gallery and a download.
   */
  preload = false,
}: {
  photograph: Photograph
  preload?: boolean
}) {
  return (
    <figure className="group">
      <Link
        href={`/gallery/${photograph.id}`}
        className="block overflow-hidden rounded-sm bg-surface-sunken"
      >
        <PayloadImage
          media={photograph.image}
          preload={preload}
          // Two columns from sm, three from lg, capped by the container. Stated
          // in the same order the grid below changes, so the two can be checked
          // against each other.
          sizes="(width >= 64rem) 30vw, (width >= 40rem) 45vw, 92vw"
          className="aspect-[4/5] w-full object-cover transition-transform duration-plate ease-out group-hover:scale-[1.03]"
          // The caption underneath names it. Announcing the alt text as well
          // says the same thing twice to a screen reader.
          decorative
        />
      </Link>

      <figcaption className="mt-3">
        <span className="title-face block text-lg text-text">{photograph.title}</span>
        <span className="font-body block text-sm text-text-subtle">{photograph.year}</span>
      </figcaption>
    </figure>
  )
}
