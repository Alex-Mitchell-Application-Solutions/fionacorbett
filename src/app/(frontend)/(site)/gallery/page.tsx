import type { Metadata } from 'next'

import { DecadeSection } from '@/components/gallery/DecadeSection'
import { GalleryPlayback } from '@/components/gallery/GalleryPlayback'
import { PageHero } from '@/components/layout/PageHero'
import { Container } from '@/components/primitives/Container'
import { Text } from '@/components/primitives/Text'
import { getPhotographs, getSiteSettings } from '@/lib/content'
import { flattenDecades, groupByDecade, slideshowIntervalMs, toSlides } from '@/lib/gallery'

export const metadata: Metadata = {
  title: 'The photographs',
  description: 'Fiona, from the 1960s to now.',
}

/**
 * The gallery.
 *
 * Sections are decades, derived from each photograph's year rather than from a
 * chapter anybody maintains — see src/lib/gallery.ts for why that is the whole
 * data model. A decade with nothing in it does not render, so a gap in the
 * photographs closes up instead of showing an empty heading.
 */
export default async function GalleryPage() {
  const [settings, photographs] = await Promise.all([getSiteSettings(), getPhotographs()])
  const decades = groupByDecade(photographs)
  // The same flattened order the single-photograph route walks.
  const slides = toSlides(flattenDecades(decades))

  return (
    <>
      <PageHero
        image={settings.galleryHero}
        title={settings.galleryTitle}
        lead={settings.galleryLead}
        aside={
          decades.length > 0 ? (
            <div className="flex flex-col items-start gap-4">
              <p className="title-face text-lg">
                {photographs.length} photographs, {decades.length}{' '}
                {decades.length === 1 ? 'decade' : 'decades'}
              </p>
              {/* A client component above the fold, which the standards
                  otherwise forbid. The reason for the rule is the hero image
                  waiting on hydration; this renders as plain anchors, the
                  image does not depend on it, and the menu trigger beside it
                  in the header is the same arrangement. */}
              <GalleryPlayback
                slides={slides}
                intervalMs={slideshowIntervalMs(settings.slideshowSeconds)}
                scrollStartHref={`#${decades[0]?.slug ?? ''}`}
              />
            </div>
          ) : null
        }
      />

      {decades.length === 0 ? (
        // The empty state is real and will be seen: this is what the site looks
        // like on the day it first deploys, before anything has been uploaded.
        // A page that renders nothing at all reads as broken.
        <Container width="measure" className="section-y">
          <Text size="lead">
            There are no photographs here yet. They are being scanned, check back shortly.
          </Text>
        </Container>
      ) : (
        <div className="section-y flex flex-col gap-20 md:gap-28">
          {decades.map((decade, index) => (
            <DecadeSection key={decade.startYear} decade={decade} isFirst={index === 0} />
          ))}
        </div>
      )}
    </>
  )
}
