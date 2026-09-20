import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { uploadImagePatterns } from './src/lib/uploads'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  /**
   * Hosts allowed to load dev-only assets.
   *
   * `next dev` blocks cross-origin requests for its own chunks, and the origin
   * is whatever was typed into the address bar. Testing on a phone means a
   * hostname or a LAN address rather than localhost, so without this the HTML
   * arrives and every client component silently fails to mount — a page that
   * looks nearly right, which is the expensive kind of broken.
   *
   * Development only. No effect on a build, so nothing here reaches production.
   */
  allowedDevOrigins: ['*.local'],
  /**
   * Which local paths next/image is allowed to optimise.
   *
   * One entry per upload collection, because Payload serves each collection's
   * files from its own slug: `media` from /api/media/file/** and
   * `memory-photos` from /api/memory-photos/file/**. This is not a wildcard by
   * choice — an unrestricted localPatterns lets any path on the origin be fed
   * through the image optimiser, which is a resource amplifier.
   *
   * **Adding an upload collection means adding a line here.** Forgetting is not
   * a build failure: `next build` prerendered /memories perfectly happily, and
   * the page only threw `Invalid src prop … does not match images.localPatterns`
   * when a request actually rendered a memory that had a photograph attached.
   * So it fails on the first guest submission with an image, in production,
   * having passed every check before it.
   */
  images: {
    localPatterns: uploadImagePatterns(),
  },
  async redirects() {
    return [
      // The short form, for saying out loud and printing on a card. The
      // canonical URL is the long one, because a stranger receiving a bare
      // /share has no idea what it is.
      { source: '/share', destination: '/share-a-memory', permanent: false },
    ]
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
