import { PhotographPlate } from '@/components/gallery/PhotographPlate'
import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Rule } from '@/components/primitives/Rule'
import type { Decade } from '@/lib/gallery'

/**
 * One decade of the gallery.
 *
 * The heading is an h2 and the decade's id is a fragment target, so the sections
 * form a real document outline and a decade can be linked to directly.
 */
export function DecadeSection({
  decade,
  /** True for the first section only: it owns the page's eager images. */
  isFirst,
}: {
  decade: Decade
  isFirst: boolean
}) {
  return (
    <section
      id={decade.slug}
      aria-labelledby={`${decade.slug}-heading`}
      // scroll-mt, so linking to a decade does not put its heading under the
      // fixed header. The value is the header's own token rather than a number
      // picked to look right, so the two cannot drift apart.
      className="scroll-mt-header"
    >
      <Container width="wide">
        {/* w-fit, so the rule under the heading runs exactly as far as the
            decade's name and no further. */}
        <div className="w-fit">
          <Heading level={2} id={`${decade.slug}-heading`}>
            {decade.label}
          </Heading>
          <Rule width="fill" className="mt-5" />
        </div>

        <ul className="mt-10 grid grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {decade.photographs.map((photograph, index) => (
            <li key={photograph.id}>
              <PhotographPlate
                photograph={photograph}
                // Only the first row of the first decade. More than a handful of
                // eager images on one page makes LCP worse rather than better:
                // they all compete for the same connection.
                preload={isFirst && index < 3}
              />
            </li>
          ))}
        </ul>
      </Container>
    </section>
  )
}
