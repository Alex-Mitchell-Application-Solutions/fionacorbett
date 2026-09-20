import type { GlobalConfig } from 'payload'

import { revalidateSite } from '@/lib/revalidate'

/**
 * The copy and imagery that is the site itself rather than a photograph or a
 * memory: the home page's hero, the two doorway labels, the heroes on the other
 * three pages.
 *
 * A global rather than a `pages` collection with a block builder. luxury-gardens
 * has the collection, and it earns its place there: that site has a dozen pages
 * and a founder who needs to add more. This one has four routes, fixed, and they
 * will not change between now and the birthday. A page builder here would be a
 * large amount of scaffold whose only user is a person who can also just ask for
 * a route.
 *
 * Every hero image is a field here so Alex can change a hero without a deploy,
 * which is the thing he actually will want to do.
 */
export const SiteSettings: GlobalConfig = {
  slug: 'site-settings',
  label: 'Site settings',
  access: {
    read: () => true,
    update: ({ req }) => Boolean(req.user),
  },
  hooks: {
    afterChange: [revalidateSite],
  },
  admin: {
    description:
      'The wording and the hero photographs. Everything else comes from the two collections.',
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Home',
          fields: [
            {
              name: 'homeHero',
              type: 'upload',
              relationTo: 'media',
              required: true,
              admin: {
                description:
                  'The photograph the site opens on. Full width, so use the largest version you have — ideally landscape.',
              },
            },
            {
              name: 'homeEyebrow',
              type: 'text',
              defaultValue: 'Sixty years',
              admin: { description: 'The small line above her name.' },
            },
            {
              name: 'homeTitle',
              type: 'text',
              required: true,
              defaultValue: 'Fiona Corbett',
              admin: { description: 'The largest words on the site.' },
            },
            {
              name: 'homeLead',
              type: 'textarea',
              admin: {
                description:
                  'A sentence or two under her name. Optional, and it reads well without one.',
              },
            },
            {
              name: 'galleryLinkLabel',
              type: 'text',
              required: true,
              defaultValue: 'See the photographs',
              admin: { description: 'The first of the two large links on the home page.' },
            },
            {
              name: 'memoriesLinkLabel',
              type: 'text',
              required: true,
              defaultValue: 'Share a memory',
              admin: { description: 'The second of the two large links on the home page.' },
            },
          ],
        },
        {
          label: 'Gallery',
          fields: [
            {
              name: 'galleryHero',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            { name: 'galleryTitle', type: 'text', required: true, defaultValue: 'The photographs' },
            { name: 'galleryLead', type: 'textarea' },
          ],
        },
        {
          label: 'Memories',
          fields: [
            {
              name: 'memoriesHero',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            {
              name: 'memoriesTitle',
              type: 'text',
              required: true,
              defaultValue: 'Memories of Fiona',
            },
            { name: 'memoriesLead', type: 'textarea' },
          ],
        },
        {
          label: 'Share a memory',
          fields: [
            {
              name: 'shareHero',
              type: 'upload',
              relationTo: 'media',
              required: true,
            },
            { name: 'shareTitle', type: 'text', required: true, defaultValue: 'Share a memory' },
            {
              name: 'shareLead',
              type: 'textarea',
              admin: {
                description:
                  'What you want people to do. This is the page strangers land on from the link you send, so it is worth being warm and specific here.',
              },
            },
            {
              name: 'shareThanks',
              type: 'textarea',
              required: true,
              defaultValue:
                'Thank you — that has been sent to Alex, and it will appear on the site once he has had a look.',
              admin: {
                description:
                  'Shown after someone sends a memory. Say that it is checked first, so nobody wonders why theirs has not appeared.',
              },
            },
          ],
        },
      ],
    },
  ],
}
