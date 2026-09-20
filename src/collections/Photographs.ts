import type { CollectionConfig } from 'payload'

import { revalidateGallery } from '@/lib/revalidate'

/**
 * The curated gallery: one row per photograph, in the order the site shows them.
 *
 * **Why there is no `chapters` collection.** The obvious model for "Fiona
 * through the years" is a set of named eras with photographs filed under them.
 * It was rejected: a chapter is a value maintained by hand alongside the thing
 * it describes, so it will eventually disagree with it, and a photograph filed
 * under the wrong decade is worse than one with no decade at all because it gets
 * trusted. The gallery derives its sections from `year` instead — see
 * `src/lib/gallery.ts`. Alex types a number he already knows; the structure
 * falls out of it and cannot drift.
 *
 * The cost of that choice is that the section headings are "The 1970s" rather
 * than "The Liverpool Years". If a hand-written era name is wanted later, it
 * belongs as an optional label on a derived decade, not as a second hierarchy
 * that photographs can be filed into wrongly.
 */
export const Photographs: CollectionConfig = {
  slug: 'photographs',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'year', 'image', 'updatedAt'],
    description: 'The photographs on /gallery, grouped into decades by their year.',
  },
  // Newest edit first is Payload's default and it is wrong here: this collection
  // is read as a sequence, and the admin list should show the same sequence the
  // site does. On the collection rather than under `admin`, which is where it
  // looks like it should go and is not.
  defaultSort: 'year',
  access: {
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    // The gallery is statically rendered and cached. Without this, an approved
    // edit sits invisible until the next deploy.
    afterChange: [revalidateGallery],
    afterDelete: [revalidateGallery],
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
      admin: {
        description: 'Upload the largest version you have. The site makes its own smaller copies.',
      },
    },
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        description: 'A short line shown under the photograph. "Brighton, the summer it rained".',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description:
          'Optional. The story behind it — who is in it, what was happening. Shown when the photograph is opened.',
      },
    },
    {
      name: 'year',
      type: 'number',
      required: true,
      min: 1900,
      // No max: a hard-coded upper bound is a value that goes stale every
      // January and fails silently in the admin when it does. The validate
      // below reads the clock instead.
      admin: {
        position: 'sidebar',
        description:
          'Roughly when it was taken. A guess is fine — it only decides which decade it sits in.',
        step: 1,
      },
      validate: (value: number | null | undefined) => {
        if (value === null || value === undefined) return 'A year is required.'
        if (!Number.isInteger(value)) return 'Use a whole year, like 1987.'
        const thisYear = new Date().getFullYear()
        if (value < 1900 || value > thisYear) return `Use a year between 1900 and ${thisYear}.`
        return true
      },
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        position: 'sidebar',
        description:
          'Optional. Orders photographs that share a year. Leave it blank unless two are out of sequence.',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        position: 'sidebar',
        description: 'Show this one on the home page. Pick a handful, not forty.',
      },
    },
  ],
}
