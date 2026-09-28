import type { CollectionConfig } from 'payload'

import { revalidateGallery, revalidateSite } from '@/lib/revalidate'

/**
 * Every photograph Alex uploads: the gallery, the page heroes, the site's own
 * imagery.
 *
 * Deliberately NOT where a guest's uploaded photograph lands. That goes to
 * `memory-photos`, which has its own size ceiling and its own access rules. The
 * separation is the point: this collection is trusted content and that one is
 * not, and a single collection would have to be governed by whichever of the two
 * needs the stricter rule.
 */
export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  access: {
    read: () => true,
    // Signed in to upload. A public create here is an open bucket.
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // A photograph and the site settings embed their image at depth 2, so the
    // cached pages carry this document's alt and focal point. Editing either
    // here changes no photograph and no setting, and without these the change
    // sits invisible until the next deploy.
    afterChange: [revalidateGallery, revalidateSite],
    afterDelete: [revalidateGallery, revalidateSite],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      // AGENTS.md: an image with no alt text is a validation error, not a
      // warning. Enforced at upload so it cannot be skipped later, when there
      // are four hundred of them and nobody is going back through.
      required: true,
      admin: {
        description:
          'What the photograph shows, for someone who cannot see it. "Fiona on a beach in Cornwall, holding a baby" — not "photo1".',
      },
    },
  ],
  upload: {
    // Explicit, so a stray PDF or zip cannot end up in the library.
    mimeTypes: ['image/*'],
    // Generated once at upload rather than resized per request. The gallery
    // shows dozens of images at a time and the hero is full-bleed, so these are
    // the two sizes that actually get requested.
    imageSizes: [
      { name: 'thumbnail', width: 640, height: undefined, position: 'centre' },
      { name: 'card', width: 1200, height: undefined, position: 'centre' },
      { name: 'hero', width: 2400, height: undefined, position: 'centre' },
    ],
    focalPoint: true,
  },
}
