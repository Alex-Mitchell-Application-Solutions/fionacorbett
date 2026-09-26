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

/**
 * 100 MB, one video.
 *
 * Roughly a minute of 1080p or twenty-odd seconds of 4K from a current phone —
 * the length of a toast or a piece of a speech. The endpoint buffers the whole
 * request in memory, so this is also what bounds the cost of one submission.
 */
export const MAX_MEMORY_VIDEO_BYTES = 100 * 1024 * 1024

/**
 * One. A memory is something to read; the video is beside it, not instead of
 * it. It also keeps each request to a single large upload.
 */
export const MAX_MEMORY_VIDEOS = 1

/**
 * Accepted video types, by exact mime and never `video/*`, for the same reason
 * the photograph list is exact.
 *
 * `video/quicktime` is what an iPhone records. Stored as sent, not transcoded:
 * an HEVC clip plays wherever the device can decode it, which is most of them,
 * and Alex previews every one before it is approved.
 */
export const ACCEPTED_MEMORY_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const

export type AcceptedMemoryVideoType = (typeof ACCEPTED_MEMORY_VIDEO_TYPES)[number]

/** The `accept` attribute for the video input, derived so it cannot drift. */
export const MEMORY_VIDEO_ACCEPT = ACCEPTED_MEMORY_VIDEO_TYPES.join(',')

/**
 * The largest request the endpoint will read: every photograph and the video at
 * their caps, plus a megabyte for the text fields and multipart framing.
 *
 * Derived rather than written as a number, so raising a cap cannot leave the
 * ceiling below what the form allows — which would refuse a submission that
 * passed every check the person could see.
 */
export const MAX_SUBMISSION_BYTES =
  MAX_MEMORY_PHOTOS * MAX_MEMORY_PHOTO_BYTES +
  MAX_MEMORY_VIDEOS * MAX_MEMORY_VIDEO_BYTES +
  1024 * 1024

export const MAX_MEMORY_BODY_LENGTH = 5000
export const MAX_MEMORY_TITLE_LENGTH = 120
export const MAX_MEMORY_NAME_LENGTH = 80

/** For telling someone their file is too big in units they think in. */
export function formatMegabytes(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`
}

/**
 * Whether a form entry is a file someone actually attached — a photograph or a
 * video; the rule is the same for both.
 *
 * **This is the difference between "no photo" and "a broken photo", and getting
 * it wrong blocks the most common submission there is.**
 *
 * An `<input type="file" multiple>` with nothing chosen does not send nothing.
 * Every browser sends one part with an empty filename, zero bytes and no
 * content type. Treat that as a file and it fails the mime check, so someone who
 * attached no photograph is told "Photographs only, please — JPEG, PNG, WebP or
 * HEIC", which is both wrong and impossible to act on.
 *
 * Exported and shared because the client had this filter and the server did not.
 * The two must apply the same rule, and the only way to be sure of that is for
 * there to be one rule.
 */
export function isAttachedFile(entry: FormDataEntryValue): entry is File {
  return entry instanceof File && entry.size > 0 && entry.name !== ''
}

/** Also what the endpoint says when Payload's content sniffing refuses a file. */
export const VIDEO_TYPE_MESSAGE = 'Videos only, please — MP4, MOV or WebM.'

/**
 * What is wrong with the attached video, in words for the person who attached
 * it, or `undefined` if nothing is.
 *
 * Shared by the form and the endpoint so the two give the same answer in the
 * same words. Takes the files already filtered through `isAttachedFile`.
 */
export function videoProblem(videos: readonly File[]): string | undefined {
  if (videos.length > MAX_MEMORY_VIDEOS) return 'Please attach just one video.'

  const video = videos[0]
  if (!video) return undefined

  if (video.size > MAX_MEMORY_VIDEO_BYTES) {
    return `That video is larger than ${formatMegabytes(MAX_MEMORY_VIDEO_BYTES)}. A shorter clip will fit — about a minute from a phone.`
  }
  if (!ACCEPTED_MEMORY_VIDEO_TYPES.includes(video.type as AcceptedMemoryVideoType)) {
    return VIDEO_TYPE_MESSAGE
  }
  return undefined
}

/**
 * Whether a request's declared size is within `MAX_SUBMISSION_BYTES`, decided
 * from the header alone so the body is never read when it is not.
 *
 * `absent` is its own answer rather than a refusal. This guards resources, not
 * authenticity, and every per-file cap still runs after parsing; refusing on a
 * missing header would lose a real memory whenever something in between
 * re-chunks the body.
 */
export function declaredSize(contentLength: string | null): 'ok' | 'absent' | 'too-large' {
  if (contentLength === null || contentLength.trim() === '') return 'absent'
  const bytes = Number(contentLength)
  // A header that is not a number is not a size; treat it as not declared.
  if (!Number.isFinite(bytes) || bytes < 0) return 'absent'
  return bytes > MAX_SUBMISSION_BYTES ? 'too-large' : 'ok'
}

export const TOO_LARGE_MESSAGE =
  'That is more than the form can take in one go. Please try a shorter video.'
