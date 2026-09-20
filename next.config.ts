import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

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
  images: {
    localPatterns: [{ pathname: '/api/media/file/**' }],
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
