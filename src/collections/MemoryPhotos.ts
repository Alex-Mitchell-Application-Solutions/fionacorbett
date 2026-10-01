import type { CollectionConfig } from 'payload'

import { ACCEPTED_MEMORY_PHOTO_TYPES } from '@/lib/memories/limits'
import { revalidateMemories } from '@/lib/revalidate'

/**
 * Photographs attached to a memory by whoever submitted it.
 *
 * A separate collection from `media`, and the separation is the whole point:
 * this is content a stranger supplied and `media` is content Alex supplied. One
 * collection holding both would have to be governed by whichever of the two
 * needs the stricter rule, and in practice that means the strict rule gets
 * relaxed the first time it is inconvenient for the trusted case.
 *
 * What is different here:
 *
 *   - **A file size ceiling.** `media` has none, because Alex should upload the
 *     largest scan he has. This is capped, because an uncapped public upload is
 *     a way to fill a bucket.
 *   - **A narrow mime allow-list**, by exact type rather than `image/*`. SVG is
 *     an image by that wildcard and is also a document that can carry script.
 *   - **`alt` is not required.** It is on `media` and it should be, but nobody
 *     is going to make a guest write alt text, and a required field that cannot
 *     be filled would just block the submission. The endpoint writes a
 *     serviceable default; Alex can improve it when he approves.
 *   - **No public create.** As with `media`. The submission endpoint writes
 *     these through the Local API after it has validated the request.
 */
export const MemoryPhotos: CollectionConfig = {
  slug: 'memory-photos',
  labels: { singular: 'Memory photo', plural: 'Memory photos' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'createdAt'],
    // Reached through the memory it belongs to. A top-level list of loose
    // guest uploads with no context is not a thing anyone needs to browse.
    hidden: false,
    description: 'Photographs people attached to their memories.',
  },
  access: {
    /**
     * Public read, and it has to be: an approved memory renders its photographs,
     * and next/image fetches them as ordinary URLs.
     *
     * This does mean a photograph attached to a still-pending memory is
     * retrievable by anyone who knows its URL. That is accepted rather than
     * overlooked: the URL contains a filename nobody outside the submission has
     * seen, nothing links to it, and the alternative — signing every image URL —
     * buys very little on a site whose entire purpose is showing photographs to
     * people who were sent a link. Recorded in AGENTS.md as a known limit rather
     * than left to be discovered.
     */
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // A memory embeds its photographs at depth 2, so the cached /memories page
    // carries this document's alt, dimensions and focal point. Cropping or
    // editing one here changes no memory, and without these the change sits
    // invisible until the next deploy.
    afterChange: [revalidateMemories],
    afterDelete: [revalidateMemories],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      admin: {
        description:
          'What the photograph shows. The submitter did not write this — improve it when you approve the memory.',
      },
    },
  ],
  upload: {
    // Exact types, not `image/*`. That wildcard admits image/svg+xml, which is
    // a document that can carry script, served from our own origin. The same
    // list the endpoint validates against, imported rather than restated so the
    // two cannot disagree.
    mimeTypes: [...ACCEPTED_MEMORY_PHOTO_TYPES],
    filesRequiredOnCreate: true,
    imageSizes: [
      { name: 'thumbnail', width: 640, height: undefined, position: 'centre' },
      { name: 'card', width: 1200, height: undefined, position: 'centre' },
    ],
  },
}
