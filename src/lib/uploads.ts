/**
 * The upload collections, named once.
 *
 * Three places need this list and they are in three different build contexts —
 * the Next config, the Payload config's storage plugin, and the image
 * optimiser's allow-list. Each one was maintained separately until adding
 * `memory-photos` updated two of them and not the third, and the result was a
 * page that built cleanly and threw on the first request that rendered a guest's
 * photograph.
 *
 * That is the failure mode this module exists to remove: a missing entry here is
 * now a single edit rather than three, and `uploads.test.ts` fails if a
 * collection with an `upload` block is not in the list.
 */
export const UPLOAD_COLLECTIONS = ['media', 'memory-photos', 'memory-videos'] as const

export type UploadCollection = (typeof UPLOAD_COLLECTIONS)[number]

/**
 * The upload collections that hold images, and so the only ones next/image may
 * optimise.
 *
 * A subset, not the whole list: `memory-videos` must go to the bucket like
 * everything else but has no business reaching the image optimiser, where it
 * would only widen what a stranger can feed through it.
 */
export const IMAGE_UPLOAD_COLLECTIONS = [
  'media',
  'memory-photos',
] as const satisfies readonly UploadCollection[]

/**
 * Where Payload serves each collection's files from.
 *
 * Payload mounts an upload collection's files at `/api/<slug>/file/<filename>`,
 * so the route follows the slug and nothing else has to be configured for it.
 */
export function uploadFilePattern(slug: UploadCollection): string {
  return `/api/${slug}/file/**`
}

/**
 * `images.localPatterns` for next.config.ts.
 *
 * Deliberately a list rather than a wildcard. An unrestricted allow-list lets
 * any path on the origin be fed through the image optimiser, which turns it into
 * a resource amplifier for anyone who notices.
 */
export function uploadImagePatterns(): { pathname: string }[] {
  return IMAGE_UPLOAD_COLLECTIONS.map((slug) => ({ pathname: uploadFilePattern(slug) }))
}
