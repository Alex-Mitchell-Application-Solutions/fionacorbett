import { describe, expect, it } from 'vitest'

import {
  type Decade,
  decadeLabel,
  decadeOf,
  flattenDecades,
  groupByDecade,
  neighboursOf,
  SLIDESHOW_DEFAULT_SECONDS,
  slideshowIntervalMs,
  toSlides,
} from '@/lib/gallery'
import type { Photograph } from '@/payload-types'

/**
 * A photograph with only the fields the grouping actually reads.
 *
 * Cast at the seam rather than building a full Payload document: the module
 * under test touches five fields and a faithful fixture would be thirty lines of
 * noise that no assertion depends on. The cast is confined to this helper, so
 * there is exactly one place to fix if the shape changes.
 */
function photograph(fields: Pick<Photograph, 'id' | 'year' | 'title'> & Partial<Photograph>) {
  return { order: null, description: null, ...fields } as Photograph
}

describe('decadeOf', () => {
  it('floors a year to the start of its decade', () => {
    expect(decadeOf(1974)).toBe(1970)
    expect(decadeOf(1970)).toBe(1970)
    expect(decadeOf(1979)).toBe(1970)
  })

  it('handles a turn-of-century year', () => {
    expect(decadeOf(2000)).toBe(2000)
    expect(decadeOf(1999)).toBe(1990)
  })
})

describe('decadeLabel', () => {
  it('reads as a chapter heading', () => {
    expect(decadeLabel(1970)).toBe('The 1970s')
    expect(decadeLabel(2000)).toBe('The 2000s')
  })
})

describe('groupByDecade', () => {
  it('groups into decades, oldest first', () => {
    const decades = groupByDecade([
      photograph({ id: 1, year: 1991, title: 'Nineties' }),
      photograph({ id: 2, year: 1974, title: 'Seventies' }),
      photograph({ id: 3, year: 1979, title: 'Also seventies' }),
    ])

    expect(decades.map((d) => d.startYear)).toEqual([1970, 1990])
    expect(decades[0]?.photographs.map((p) => p.id)).toEqual([2, 3])
  })

  it('omits a decade with nothing in it rather than rendering an empty section', () => {
    const decades = groupByDecade([
      photograph({ id: 1, year: 1974, title: 'Seventies' }),
      // Nothing at all from the 1980s.
      photograph({ id: 2, year: 1994, title: 'Nineties' }),
    ])

    expect(decades.map((d) => d.startYear)).toEqual([1970, 1990])
  })

  it('orders by year before anything else', () => {
    const decades = groupByDecade([
      photograph({ id: 1, year: 1978, title: 'Later' }),
      photograph({ id: 2, year: 1971, title: 'Earlier' }),
    ])

    expect(decades[0]?.photographs.map((p) => p.id)).toEqual([2, 1])
  })

  it('breaks a tie within a year using order', () => {
    const decades = groupByDecade([
      photograph({ id: 1, year: 1982, title: 'A', order: 2 }),
      photograph({ id: 2, year: 1982, title: 'B', order: 1 }),
    ])

    expect(decades[0]?.photographs.map((p) => p.id)).toEqual([2, 1])
  })

  it('sorts an ordered photograph ahead of the untouched ones in the same year', () => {
    // The reason blank sorts as Infinity rather than 0. Pulling one photograph
    // to the front of 1982 should put it first, not last.
    const decades = groupByDecade([
      photograph({ id: 1, year: 1982, title: 'Untouched A' }),
      photograph({ id: 2, year: 1982, title: 'Untouched B' }),
      photograph({ id: 3, year: 1982, title: 'Pulled forward', order: 1 }),
    ])

    expect(decades[0]?.photographs.map((p) => p.id)).toEqual([3, 1, 2])
  })

  it('falls back to title so the order is total and stable between builds', () => {
    const decades = groupByDecade([
      photograph({ id: 1, year: 1982, title: 'Zebra' }),
      photograph({ id: 2, year: 1982, title: 'Apple' }),
    ])

    expect(decades[0]?.photographs.map((p) => p.id)).toEqual([2, 1])
  })

  it('returns nothing for an empty gallery', () => {
    expect(groupByDecade([])).toEqual([])
  })
})

describe('flattenDecades', () => {
  it('walks the same order the page renders', () => {
    const decades = groupByDecade([
      photograph({ id: 3, year: 1991, title: 'C' }),
      photograph({ id: 1, year: 1974, title: 'A' }),
      photograph({ id: 2, year: 1979, title: 'B' }),
    ])

    expect(flattenDecades(decades).map((p) => p.id)).toEqual([1, 2, 3])
  })
})

describe('neighboursOf', () => {
  const sequence = flattenDecades(
    groupByDecade([
      photograph({ id: 1, year: 1974, title: 'A' }),
      photograph({ id: 2, year: 1979, title: 'B' }),
      photograph({ id: 3, year: 1991, title: 'C' }),
    ]),
  )

  it('finds what sits either side', () => {
    expect(neighboursOf(sequence, 2)).toMatchObject({
      index: 1,
      previous: { id: 1 },
      next: { id: 3 },
    })
  })

  it('has no previous at the start', () => {
    expect(neighboursOf(sequence, 1)?.previous).toBeNull()
  })

  it('has no next at the end', () => {
    expect(neighboursOf(sequence, 3)?.next).toBeNull()
  })

  it('crosses a decade boundary forwards rather than restarting', () => {
    // The reason the sequence is derived from the grouped form rather than
    // sorted a second time: two independent sorts are how "next" ends up going
    // backwards here.
    expect(neighboursOf(sequence, 2)?.next?.id).toBe(3)
  })

  it('returns null for a photograph that has been deleted', () => {
    expect(neighboursOf(sequence, 999)).toBeNull()
  })

  it('returns null against an empty sequence', () => {
    expect(neighboursOf([], 1)).toBeNull()
  })
})

describe('decade shape', () => {
  it('carries a slug usable as a URL fragment', () => {
    const decades: Decade[] = groupByDecade([photograph({ id: 1, year: 1974, title: 'A' })])
    expect(decades[0]?.slug).toBe('1970s')
  })
})

describe('toSlides', () => {
  const image = {
    id: 10,
    url: '/api/media/file/a.jpg',
    alt: 'Fiona on the beach',
    width: 1600,
    height: 1200,
    focalX: 40,
    focalY: 30,
    updatedAt: '2026-09-01T00:00:00.000Z',
    createdAt: '2026-09-01T00:00:00.000Z',
    filename: 'a.jpg',
  }

  it('keeps the order it is given and only the fields it draws', () => {
    const slides = toSlides([
      photograph({ id: 1, year: 1974, title: 'A', image, description: 'Long story' }),
      photograph({ id: 2, year: 1981, title: 'B', image }),
    ])

    expect(slides.map((slide) => slide.id)).toEqual([1, 2])
    expect(slides[0]).toEqual({
      id: 1,
      title: 'A',
      year: 1974,
      image: {
        url: image.url,
        alt: image.alt,
        width: 1600,
        height: 1200,
        focalX: 40,
        focalY: 30,
        updatedAt: image.updatedAt,
      },
    })
  })

  it('leaves out a photograph whose image did not resolve', () => {
    // depth too shallow, or the media row deleted: an id or nothing, not a
    // document. Five seconds of empty frame is worse than skipping it.
    const slides = toSlides([
      photograph({ id: 1, year: 1974, title: 'A', image: 10 }),
      photograph({ id: 2, year: 1975, title: 'B', image: { ...image, url: null } }),
      photograph({ id: 3, year: 1976, title: 'C', image }),
    ])

    expect(slides.map((slide) => slide.id)).toEqual([3])
  })

  it('is empty for an empty gallery', () => {
    expect(toSlides([])).toEqual([])
  })
})

describe('slideshowIntervalMs', () => {
  it('converts seconds to milliseconds', () => {
    expect(slideshowIntervalMs(5)).toBe(5000)
    expect(slideshowIntervalMs(7.5)).toBe(7500)
  })

  it('falls back to the default when the setting is missing or not a number', () => {
    expect(slideshowIntervalMs(null)).toBe(SLIDESHOW_DEFAULT_SECONDS * 1000)
    expect(slideshowIntervalMs(undefined)).toBe(SLIDESHOW_DEFAULT_SECONDS * 1000)
    expect(slideshowIntervalMs(Number.NaN)).toBe(SLIDESHOW_DEFAULT_SECONDS * 1000)
  })

  it('clamps to the bounds the admin field enforces', () => {
    // 0 would advance on every tick; a negative value the same.
    expect(slideshowIntervalMs(0)).toBe(2000)
    expect(slideshowIntervalMs(-3)).toBe(2000)
    expect(slideshowIntervalMs(1.9)).toBe(2000)
    expect(slideshowIntervalMs(2)).toBe(2000)
    expect(slideshowIntervalMs(60)).toBe(60000)
    expect(slideshowIntervalMs(3600)).toBe(60000)
    expect(slideshowIntervalMs(Number.POSITIVE_INFINITY)).toBe(SLIDESHOW_DEFAULT_SECONDS * 1000)
  })
})
