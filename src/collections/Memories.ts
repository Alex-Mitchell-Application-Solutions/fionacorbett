import type { CollectionConfig } from 'payload'

import { revalidateMemories } from '@/lib/revalidate'

/**
 * What people who were sent the link wrote about Fiona.
 *
 * Three rules govern this collection, and each of them is enforced here rather
 * than being remembered at a call site:
 *
 * 1. **Nothing is public until it is approved.** `read` filters on status for
 *    anyone not signed in, so an unapproved memory is not reachable through the
 *    page, the REST API, the GraphQL API or a guessed id.
 *
 * 2. **The public cannot create a row directly.** `create` requires a signed-in
 *    user, so the only way in is `POST /submit-memory`, which runs the rate
 *    limit, the honeypot, the dwell token, the schema and the human check
 *    first and then writes through the Local API. Leaving `create` open would
 *    make every one of those layers optional.
 *
 * 3. **The contact address is never public.** It is on the document so Alex can
 *    thank people and chase a blurry photograph, and it is behind field-level
 *    read access so it cannot leave the admin. A public collection with an email
 *    column on it is a scraped mailing list.
 *
 * The body is plain text, not rich text, and that is deliberate. A rich text
 * editor for a stranger means storing markup a stranger supplied, which means
 * sanitising it correctly forever. Line breaks are all this needs.
 */
export const Memories: CollectionConfig = {
  slug: 'memories',
  labels: { singular: 'Memory', plural: 'Memories' },
  admin: {
    useAsTitle: 'fromName',
    defaultColumns: ['fromName', 'title', 'status', 'createdAt'],
    description:
      'Memories people have sent in. New ones arrive as Pending and show nowhere until approved.',
  },
  // Newest first: this list is a queue to work through, not an archive. On the
  // collection rather than under `admin`.
  defaultSort: '-createdAt',
  access: {
    /**
     * Signed in sees everything. Everyone else sees approved memories only.
     *
     * Returning a query constraint rather than a boolean is what makes this hold
     * for a single document as well as a list: Payload applies it to findByID
     * too, so /api/memories/<id> on a pending row is a 404 rather than a leak.
     */
    read: ({ req }) => {
      if (req.user) return true
      return { status: { equals: 'approved' } }
    },
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  hooks: {
    beforeChange: [
      /**
       * Stamp who approved it, at the moment the status becomes approved.
       *
       * Derived rather than typed, for the reason the gallery has no chapters
       * field: a value maintained by hand beside the thing it describes drifts
       * away from it. Only set on the transition into `approved`, so re-editing
       * an already-approved memory does not reassign credit to whoever fixed a
       * typo.
       */
      ({ data, originalDoc, req }) => {
        const becomingApproved =
          data.status === 'approved' && originalDoc?.status !== 'approved' && Boolean(req.user)

        if (becomingApproved) return { ...data, approvedBy: req.user?.id }
        return data
      },
    ],
    // Approving a memory has to make it appear. The pages are statically
    // rendered, so without this an approval sits invisible until a redeploy —
    // which is the kind of bug that gets noticed on the morning of the party.
    afterChange: [revalidateMemories],
    afterDelete: [revalidateMemories],
  },
  fields: [
    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Approved', value: 'approved' },
        { label: 'Hidden', value: 'hidden' },
      ],
      admin: {
        position: 'sidebar',
        description:
          'Only Approved appears on the site. Hidden is for anything you would rather not show.',
      },
    },
    {
      name: 'fromName',
      label: 'From',
      type: 'text',
      required: true,
      maxLength: 80,
      admin: { description: 'How they signed it.' },
    },
    {
      name: 'relationship',
      type: 'text',
      maxLength: 80,
      admin: {
        description:
          'Optional. "Her sister", "Next door at Elm Road", "Worked with her at the surgery".',
      },
    },
    {
      name: 'title',
      type: 'text',
      maxLength: 120,
      admin: { description: 'Optional. A heading for the memory.' },
    },
    {
      name: 'body',
      type: 'textarea',
      required: true,
      maxLength: 5000,
      admin: { description: 'The memory itself. Plain text — line breaks are kept.' },
    },
    {
      name: 'photos',
      type: 'upload',
      relationTo: 'memory-photos',
      hasMany: true,
      admin: { description: 'Anything they attached. Delete any you would rather not publish.' },
    },
    {
      name: 'video',
      type: 'upload',
      relationTo: 'memory-videos',
      admin: {
        description:
          'A video they attached, if any. Play it before approving — clear this to publish the memory without it.',
      },
    },
    {
      name: 'email',
      type: 'email',
      access: {
        // Never leaves the admin. Without this the address ships on every
        // approved memory the public API returns.
        read: ({ req }) => Boolean(req.user),
        update: ({ req }) => Boolean(req.user),
      },
      admin: {
        position: 'sidebar',
        description: 'Optional, and never shown on the site. Only so you can reply to them.',
      },
    },
    {
      name: 'approvedBy',
      type: 'relationship',
      relationTo: 'users',
      access: { read: ({ req }) => Boolean(req.user) },
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Who approved it. Filled in automatically.',
      },
    },
  ],
}
