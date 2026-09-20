import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Rule } from '@/components/primitives/Rule'
import { Text } from '@/components/primitives/Text'
import { getPhotographs } from '@/lib/content'
import { decadeOf, decadeSlug, flattenDecades, groupByDecade, neighboursOf } from '@/lib/gallery'

/**
 * One photograph, on its own page.
 *
 * This is the "navigatable" half of the gallery, and it is a route rather than a
 * lightbox overlay on purpose. The consequences of that choice are the reason
 * for it:
 *
 *   - **Every photograph has its own address**, so one can be sent to someone.
 *     On a site whose entire distribution is people sharing links, that is not a
 *     nice-to-have.
 *   - **Back goes back one photograph**, not out of the gallery.
 *   - **It works with no JavaScript**, because previous and next are anchors.
 *   - **The title and description are real page metadata**, so a shared link
 *     previews as that photograph rather than as the site.
 *
 * What it costs is the overlay's animation and the sense of staying in place. A
 * View Transition would give most of that back without giving up any of the
 * above, and it is on the pre-launch list rather than done here: it is an
 * enhancement to a working page, and this needed to work first.
 */

/**
 * The sequence, built once per request from the same functions the gallery page
 * uses.
 *
 * Deliberately not a separate "find this photograph by id" query. The page needs
 * the neighbours as well as the photograph, and the neighbours are only defined
 * by the order the gallery renders in — so the order has to be computed the same
 * way, from the same source, or `next` here walks somewhere `next` there does
 * not. The read is cached and the sort is over a few hundred rows.
 */
async function sequence() {
  return flattenDecades(groupByDecade(await getPhotographs()))
}

export async function generateStaticParams() {
  const photographs = await sequence()
  return photographs.map((photograph) => ({ id: String(photograph.id) }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const photographs = await sequence()
  const photograph = photographs.find((candidate) => candidate.id === Number(id))

  if (!photograph) return { title: 'Not found' }

  return {
    title: photograph.title,
    description: photograph.description ?? `Fiona, ${photograph.year}.`,
  }
}

export default async function PhotographPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  // Number('12abc') is NaN and Number('') is 0, so a junk segment simply finds
  // nothing below rather than needing its own branch here.
  const photographs = await sequence()
  const neighbours = neighboursOf(photographs, Number(id))

  // Covers both an id that was never valid and one that has since been deleted.
  if (!neighbours) notFound()

  const photograph = photographs[neighbours.index]
  if (!photograph) notFound()

  const { previous, next } = neighbours

  return (
    <article className="pt-header">
      <Container width="feature" className="section-y">
        <div className="bg-surface-sunken rounded-sm shadow-plate">
          <PayloadImage
            media={photograph.image}
            // The LCP element on this page, always.
            preload
            sizes="(width >= 56rem) 56rem, 100vw"
            className="w-full rounded-sm object-contain"
          />
        </div>

        <div className="mt-10">
          <span className="font-heading tracking-heading text-sm uppercase text-text-subtle">
            {photograph.year}
          </span>
          <Heading level={1} size={2} className="mt-2">
            {photograph.title}
          </Heading>
          <Rule className="mt-5" />

          {photograph.description ? (
            // whitespace-pre-line so paragraph breaks Alex typed are kept. The
            // field is a textarea, not rich text, so this is the only thing
            // standing between the text and one run-on block.
            <Text size="lead" className="mt-6 whitespace-pre-line">
              {photograph.description}
            </Text>
          ) : null}
        </div>

        {/*
          Previous and next, as anchors.

          aria-label on each, because "Previous" alone tells a screen-reader user
          the direction and not what is there. The visible label stays short.
        */}
        <nav aria-label="Photographs" className="mt-16 border-t border-line pt-6">
          <ul className="flex items-start justify-between gap-6">
            <li className="min-w-0">
              {previous ? (
                <Link
                  href={`/gallery/${previous.id}`}
                  aria-label={`Previous photograph: ${previous.title}`}
                  className="group block"
                >
                  <span className="font-heading tracking-heading block text-2xs uppercase text-text-subtle">
                    Previous
                  </span>
                  <span className="title-face block truncate text-lg text-text group-hover:underline">
                    {previous.title}
                  </span>
                </Link>
              ) : null}
            </li>

            <li className="shrink-0">
              <Link
                href={`/gallery#${decadeSlug(decadeOf(photograph.year))}`}
                className="font-heading tracking-heading text-2xs uppercase text-text-subtle underline-offset-4 hover:underline"
              >
                All photographs
              </Link>
            </li>

            <li className="min-w-0 text-right">
              {next ? (
                <Link
                  href={`/gallery/${next.id}`}
                  aria-label={`Next photograph: ${next.title}`}
                  className="group block"
                >
                  <span className="font-heading tracking-heading block text-2xs uppercase text-text-subtle">
                    Next
                  </span>
                  <span className="title-face block truncate text-lg text-text group-hover:underline">
                    {next.title}
                  </span>
                </Link>
              ) : null}
            </li>
          </ul>
        </nav>
      </Container>
    </article>
  )
}
