/**
 * The limits on a memory submission, in one place.
 *
 * Imported by the Zod schema, by the collection's upload config and by the form
 * that tells a submitter what is allowed. Three call sites, one definition: a
 * cap restated in three files is a cap that is eventually three different
 * numbers, and the symptom is a form that accepts a photograph the server then
 * rejects with no explanation.
 */

/** 12 MB. Above a modern phone photograph, below anything worth worrying about. */
export const MAX_MEMORY_PHOTO_BYTES = 12 * 1024 * 1024

/**
 * How many photographs one memory may carry.
 *
 * Six, which is a choice about the page rather than about storage. A memory is
 * something to read; past half a dozen images it stops being a memory with
 * photographs and becomes an album with a caption, and it crowds out the memory
 * after it.
 */
export const MAX_MEMORY_PHOTOS = 6

/**
 * Accepted image types, by exact mime rather than an `image/*` wildcard.
 *
 * SVG is excluded on purpose: the wildcard admits it, and an SVG is a document
 * that can carry script, which we would then be serving from our own origin.
 *
 * HEIC and HEIF are included because that is what an iPhone produces by default,
 * and a form that silently rejects the format half the audience is shooting in
 * is a form that looks broken. Sharp converts them on upload.
 */
export const ACCEPTED_MEMORY_PHOTO_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
] as const

export type AcceptedMemoryPhotoType = (typeof ACCEPTED_MEMORY_PHOTO_TYPES)[number]

/** The `accept` attribute for the file input, derived so it cannot drift. */
export const MEMORY_PHOTO_ACCEPT = ACCEPTED_MEMORY_PHOTO_TYPES.join(',')

export const MAX_MEMORY_BODY_LENGTH = 5000
export const MAX_MEMORY_TITLE_LENGTH = 120
export const MAX_MEMORY_NAME_LENGTH = 80

/** For telling someone their file is too big in units they think in. */
export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}
