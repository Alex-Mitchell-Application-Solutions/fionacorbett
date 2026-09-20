import type { CollectionConfig } from 'payload'

/**
 * Admin accounts. There is expected to be one, and possibly a second so that
 * someone else can approve memories while Alex is at the party.
 *
 * No public registration and no public read: this collection exists only to log
 * in to /admin. Payload's auth handles the sessions, hashing and reset flow, and
 * nothing here reimplements any of it.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: true,
  admin: {
    useAsTitle: 'email',
  },
  access: {
    // Signed in to read, create, update or delete. Payload's default for an auth
    // collection already requires this; stated so it cannot be loosened by
    // accident when someone adds a field.
    read: ({ req }) => Boolean(req.user),
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Shown on a memory you approve, so two approvers can tell who did what.',
      },
    },
  ],
}
