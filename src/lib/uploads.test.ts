import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  IMAGE_UPLOAD_COLLECTIONS,
  UPLOAD_COLLECTIONS,
  uploadImagePatterns,
  versionedUploadUrl,
} from '@/lib/uploads'

/**
 * Guards a failure that no other check catches.
 *
 * Adding an upload collection without adding it to `UPLOAD_COLLECTIONS` breaks
 * `next/image` with `Invalid src prop … does not match images.localPatterns` —
 * but only at request time, and only for a request that renders one of that
 * collection's files. `next build` prerenders the page without complaint, so
 * lint, typecheck and the build all pass. In production it fails on the first
 * guest who attaches a photograph.
 *
 * This reads the collection source rather than importing the Payload config,
 * deliberately: importing that pulls in sharp, the Postgres adapter and a live
 * config build, which is a lot of machinery to run inside a jsdom unit test in
 * order to read five slugs. Reading the files is exact enough — a collection
 * with an `upload` block has one — and costs nothing.
 */

const COLLECTIONS_DIR = path.join(process.cwd(), 'src/collections')

/** Every collection whose config declares an `upload` block. */
function uploadCollectionsInSource(): string[] {
  const slugs: string[] = []

  for (const file of readdirSync(COLLECTIONS_DIR)) {
    if (!file.endsWith('.ts') || file.endsWith('.test.ts')) continue

    const source = readFileSync(path.join(COLLECTIONS_DIR, file), 'utf8')
    // `upload:` at the top level of the config object, which Payload indents by
    // two. Requiring the indentation keeps this from matching the word in a
    // comment or inside a nested field.
    if (!/^ {2}upload: \{/m.test(source)) continue

    const slug = /^ {2}slug: '([^']+)'/m.exec(source)?.[1]
    if (slug) slugs.push(slug)
  }

  return slugs.sort()
}

describe('UPLOAD_COLLECTIONS', () => {
  it('lists exactly the collections that declare an upload block', () => {
    expect(uploadCollectionsInSource()).toEqual([...UPLOAD_COLLECTIONS].sort())
  })

  it('finds the two we know about, so the scan itself is not silently matching nothing', () => {
    // Without this, a regex that stops matching makes the test above pass
    // trivially by comparing two empty lists.
    const found = uploadCollectionsInSource()
    expect(found).toContain('media')
    expect(found).toContain('memory-photos')
    expect(found).toContain('memory-videos')
  })
})

describe('uploadImagePatterns', () => {
  it('produces one localPatterns entry per image collection', () => {
    expect(uploadImagePatterns()).toEqual([
      { pathname: '/api/media/file/**' },
      { pathname: '/api/memory-photos/file/**' },
    ])
  })

  it('never lets a video collection reach the image optimiser', () => {
    expect(IMAGE_UPLOAD_COLLECTIONS).not.toContain('memory-videos')
    expect(uploadImagePatterns()).not.toContainEqual({ pathname: '/api/memory-videos/file/**' })
  })

  it('only lists image collections that are also upload collections', () => {
    for (const slug of IMAGE_UPLOAD_COLLECTIONS) expect(UPLOAD_COLLECTIONS).toContain(slug)
  })

  it('is what next.config.ts actually uses, rather than a second copy of it', () => {
    // The bug this whole module exists for was a hard-coded list in
    // next.config.ts drifting from the collections. If someone inlines the
    // patterns again, this fails.
    const config = readFileSync(path.join(process.cwd(), 'next.config.ts'), 'utf8')
    expect(config).toContain('uploadImagePatterns')
    expect(config).not.toMatch(/pathname: '\/api\//)
  })
})

describe('versionedUploadUrl', () => {
  const url = '/api/memory-photos/file/IMG_0001.jpg'

  it('carries the revision, so a re-cropped file under the same name is a new URL', () => {
    const before = versionedUploadUrl(url, '2026-09-30T10:00:00.000Z')
    const after = versionedUploadUrl(url, '2026-10-01T09:30:00.000Z')
    expect(before).toBe(`${url}?v=${Date.parse('2026-09-30T10:00:00.000Z')}`)
    expect(after).not.toBe(before)
  })

  it('appends to an existing query string rather than starting a second one', () => {
    expect(versionedUploadUrl(`${url}?a=1`, '2026-10-01T09:30:00.000Z')).toMatch(/\?a=1&v=\d+$/)
  })

  it('leaves the URL alone when there is no usable revision', () => {
    expect(versionedUploadUrl(url, undefined)).toBe(url)
    expect(versionedUploadUrl(url, null)).toBe(url)
    expect(versionedUploadUrl(url, '')).toBe(url)
    expect(versionedUploadUrl(url, 'not a date')).toBe(url)
  })
})
