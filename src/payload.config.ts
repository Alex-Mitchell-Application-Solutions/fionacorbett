import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { Media } from './collections/Media'
import { Memories } from './collections/Memories'
import { MemoryPhotos } from './collections/MemoryPhotos'
import { MemoryVideos } from './collections/MemoryVideos'
import { Photographs } from './collections/Photographs'
import { Users } from './collections/Users'
import { SiteSettings } from './globals/SiteSettings'
import { storagePlugins } from './lib/storage'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    // Light only. The site has no dark palette, so a dark admin would have to
    // invent one. Fixing the theme also removes the switch from the account view.
    theme: 'light',
    meta: {
      titleSuffix: ' – Fiona Corbett',
      // Payload's generated card carries its own branding and nothing of ours,
      // and nobody has a reason to share an admin link.
      defaultOGImageType: 'off',
      // robots.txt stops /admin being crawled, but not a linked URL being
      // indexed. This is the part that actually keeps it out.
      robots: { index: false, follow: false },
    },
  },
  collections: [Users, Media, Photographs, Memories, MemoryPhotos, MemoryVideos],
  globals: [SiteSettings],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
    // Migrations are generated, committed, and applied by the deploy as a
    // release step. Never on container start: a multi-replica deploy would race,
    // and "we only run one replica" is a thing that changes without anyone
    // remembering this line.
    push: false,
  }),
  sharp,
  /**
   * The upload ceiling, and it is global because Payload has no per-collection
   * one.
   *
   * Set high — 64 MB — because `media` is where Alex puts full-resolution scans,
   * and a cap tight enough for a guest upload would block the trusted case this
   * site exists for. This is a backstop against something absurd, not the real
   * limit.
   *
   * The limit that matters for public uploads is 12 MB, applied in
   * /submit-memory. That is the only path into `memory-photos`, since the
   * collection's create access requires a signed-in user, so enforcing it at the
   * request is enforcing it everywhere.
   */
  upload: {
    limits: { fileSize: 64 * 1024 * 1024 },
  },
  // Empty locally, so a checkout runs with nothing but Postgres. Populated in
  // deployed environments, where the container disk does not survive a redeploy.
  plugins: storagePlugins(),
})
