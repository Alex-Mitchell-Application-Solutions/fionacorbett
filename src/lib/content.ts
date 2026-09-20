import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'

import { CACHE_TAGS } from '@/lib/revalidate'
import type { Memory, Photograph, SiteSetting } from '@/payload-types'

/**
 * Every read the public pages make, in one module.
 *
 * Three things are true of all of them and are easier to keep true from one
 * place than from a dozen call sites:
 *
 * 1. **They go through the Local API, not fetch.** No HTTP hop, no serialisation
 *    round trip, and access control still applies because the Local API is given
 *    no user. That last part matters more than the performance: `overrideAccess`
 *    stays false, so an unapproved memory is invisible to these queries by the
 *    same rule that makes it invisible over REST, rather than by a filter
 *    someone has to remember to write.
 *
 * 2. **They are cached under a tag the collection hooks invalidate.** See
 *    revalidate.ts. Without the tag an approval would not appear until a deploy.
 *
 * 3. **`depth: 2` is stated.** Depth 1 resolves a photograph's `image` to a
 *    media document; depth 2 is needed where an upload sits one level further
 *    in, as a memory's photographs do. A depth that is too shallow returns a
 *    number where a document was expected, and PayloadImage renders nothing at
 *    all — a blank page with no error, which is expensive to diagnose.
 */

async function client() {
  return getPayload({ config: await configPromise })
}

export const getSiteSettings = unstable_cache(
  async (): Promise<SiteSetting> => {
    const payload = await client()
    return payload.findGlobal({ slug: 'site-settings', depth: 2 })
  },
  ['site-settings'],
  { tags: [CACHE_TAGS.siteSettings] },
)

/**
 * The gallery, unsorted.
 *
 * Ordering is `groupByDecade`'s job, not the query's, and deliberately so: the
 * order has three keys and a rule about blank `order` values that a Payload sort
 * string cannot express. Sorting here as well would mean two definitions of the
 * sequence, and the lightbox arrows walking a different order from the page is
 * exactly the bug that produces.
 *
 * `limit: 0` returns everything. This is a birthday site; the ceiling is however
 * many photographs Alex can face scanning, and paginating it would be scaffold
 * for a problem that will not arrive.
 */
export const getPhotographs = unstable_cache(
  async (): Promise<Photograph[]> => {
    const payload = await client()
    const result = await payload.find({ collection: 'photographs', depth: 2, limit: 0 })
    return result.docs
  },
  ['photographs'],
  { tags: [CACHE_TAGS.photographs] },
)

export const getFeaturedPhotographs = unstable_cache(
  async (): Promise<Photograph[]> => {
    const payload = await client()
    const result = await payload.find({
      collection: 'photographs',
      depth: 2,
      limit: 12,
      where: { featured: { equals: true } },
      sort: 'year',
    })
    return result.docs
  },
  ['photographs-featured'],
  { tags: [CACHE_TAGS.photographs] },
)

/**
 * Approved memories, newest first.
 *
 * The `where` clause is belt and braces: the collection's read access already
 * restricts an unauthenticated query to approved rows, and this query passes no
 * user. Stated anyway, because the cost is nothing and the failure mode it
 * guards against — someone later adding `overrideAccess: true` here to fix an
 * unrelated problem — is silent publication of everything in the queue.
 */
export const getApprovedMemories = unstable_cache(
  async (): Promise<Memory[]> => {
    const payload = await client()
    const result = await payload.find({
      collection: 'memories',
      depth: 2,
      limit: 0,
      where: { status: { equals: 'approved' } },
      sort: '-createdAt',
    })
    return result.docs
  },
  ['memories-approved'],
  { tags: [CACHE_TAGS.memories] },
)
