import type { Photograph } from '@/payload-types'

/**
 * Grouping the gallery into decades.
 *
 * This module is the reason there is no `chapters` collection. The structure of
 * /gallery is derived from a number Alex already has to type — the year — rather
 * than from a second field he would have to keep in step with it. Nothing can
 * end up filed under the wrong decade, because nothing files anything.
 *
 * Pure functions over plain data, with no Payload import beyond the generated
 * type, so the whole of this is testable without a database.
 */

export type Decade = {
  /** The first year of the decade: 1970, 1980. The stable key. */
  startYear: number
  /** "The 1970s". */
  label: string
  /** A URL fragment, for linking to a decade from elsewhere on the site. */
  slug: string
  photographs: Photograph[]
}

/** 1974 -> 1970. */
export function decadeOf(year: number): number {
  return Math.floor(year / 10) * 10
}

export function decadeLabel(startYear: number): string {
  return `The ${startYear}s`
}

export function decadeSlug(startYear: number): string {
  return `${startYear}s`
}

/**
 * Order within a decade: by year, then by the optional `order`, then by title.
 *
 * Three keys because each one runs out. Year is the real ordering and most
 * photographs will only need it. `order` breaks a tie inside a year, and is
 * blank on nearly every row — which is why it sorts as Infinity rather than 0:
 * a photograph Alex has deliberately pulled to the front of 1982 should come
 * before the ones he has not touched, and treating blank as 0 would put all the
 * untouched ones first instead.
 *
 * Title is the last resort, so the order is total and the page does not
 * reshuffle between builds when two rows are otherwise identical.
 */
function comparePhotographs(a: Photograph, b: Photograph): number {
  if (a.year !== b.year) return a.year - b.year

  const orderA = a.order ?? Number.POSITIVE_INFINITY
  const orderB = b.order ?? Number.POSITIVE_INFINITY
  if (orderA !== orderB) return orderA - orderB

  return a.title.localeCompare(b.title, 'en-GB')
}

/**
 * Group photographs into decades, oldest first.
 *
 * Only decades that actually contain something are returned. A gap — no
 * photographs at all from the 1990s — closes up rather than rendering an empty
 * section, because an empty decade on the page reads as a loading failure rather
 * than as an absence of photographs.
 */
export function groupByDecade(photographs: Photograph[]): Decade[] {
  const byDecade = new Map<number, Photograph[]>()

  for (const photograph of photographs) {
    const start = decadeOf(photograph.year)
    const existing = byDecade.get(start)
    if (existing) existing.push(photograph)
    else byDecade.set(start, [photograph])
  }

  return [...byDecade.entries()]
    .sort(([a], [b]) => a - b)
    .map(([startYear, items]) => ({
      startYear,
      label: decadeLabel(startYear),
      slug: decadeSlug(startYear),
      photographs: [...items].sort(comparePhotographs),
    }))
}

/**
 * The flat sequence the lightbox steps through, in the order the page shows
 * them.
 *
 * Derived from the grouped form rather than sorted separately, so the arrows
 * cannot walk a different order from the one on screen. Sorting twice in two
 * places is how "next" ends up going backwards across a decade boundary.
 */
export function flattenDecades(decades: Decade[]): Photograph[] {
  return decades.flatMap((decade) => decade.photographs)
}

/**
 * Where a photograph sits in the sequence, and what is on either side of it.
 *
 * Returns null for an id that is not in the sequence — an old link to a
 * photograph that has since been deleted — so the caller can render a 404
 * rather than a page with broken arrows.
 */
export function neighboursOf(
  sequence: Photograph[],
  id: number,
): { index: number; previous: Photograph | null; next: Photograph | null } | null {
  const index = sequence.findIndex((photograph) => photograph.id === id)
  if (index === -1) return null

  return {
    index,
    previous: sequence[index - 1] ?? null,
    next: sequence[index + 1] ?? null,
  }
}
