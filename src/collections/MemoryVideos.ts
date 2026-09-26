import type { CollectionConfig } from 'payload'

import { ACCEPTED_MEMORY_VIDEO_TYPES } from '@/lib/memories/limits'

/**
 * A video attached to a memory by whoever submitted it. One per memory.
 *
 * Its own collection rather than a wider `memory-photos`, for the reason that
 * one is separate from `media`: each upload collection is governed by one rule.
 * `memory-photos` has image sizes, a photograph's alt default and a mime list
 * everything reads as "photographs"; admitting video would make every one of
 * those conditional.
 *
 * Stored as sent. No transcoding and no poster frame — an iPhone `.mov` is
 * usually HEVC, which plays wherever the device can decode it, and Alex watches
 * each one in the admin before approving the memory it belongs to. A clip that
 * will not play is removed from the memory there.
 *
 * Access is the same as `memory-photos`, including the same accepted limit: a
 * video on a still-pending memory is fetchable by anyone who knows its URL.
 * Recorded in AGENTS.md.
 */
export const MemoryVideos: CollectionConfig = {
  slug: 'memory-videos',
  labels: { singular: 'Memory video', plural: 'Memory videos' },
  admin: {
    useAsTitle: 'filename',
    defaultColumns: ['filename', 'description', 'filesize', 'createdAt'],
    description: 'Videos people attached to their memories.',
  },
  access: {
    // Public, because an approved memory plays it from its ordinary URL.
    read: () => true,
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'description',
      type: 'text',
      maxLength: 200,
      admin: {
        description:
          'What the video shows. Read aloud by screen readers in place of watching it. The submitter did not write this — improve it when you approve the memory.',
      },
    },
  ],
  upload: {
    // Exact types, never `video/*`, imported from the same list the endpoint
    // and the form check against.
    mimeTypes: [...ACCEPTED_MEMORY_VIDEO_TYPES],
    filesRequiredOnCreate: true,
  },
}
