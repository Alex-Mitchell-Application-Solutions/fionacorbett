import type { MemoryVideo } from '@/payload-types'

/**
 * What this component reads from a video document. Structural, as with
 * `ImageDocument`, so the showcase can hand it a static file.
 */
export type VideoDocument = {
  url?: string | null
  description?: string | null
}

/** Compile-time assignability check; see `MustFit` in PayloadImage.tsx. */
type MustFit<T extends VideoDocument> = T
type _MemoryVideoFits = MustFit<MemoryVideo>

/**
 * A video upload, in the browser's own player.
 *
 * **Server-rendered, and there is no reason for it not to be.** A `<video>`
 * needs no hydration: the controls, the keyboard handling and the fullscreen
 * button are the browser's, and they work with JavaScript off. So this adds
 * nothing to the client bundle and does not count against the four client
 * components.
 *
 * What each attribute is for:
 *
 *   - `preload="metadata"` — a page of thirty memories must not download
 *     thirty videos. Only the header and first frame load until play.
 *   - `#t=0.001` on the URL — without it iOS Safari shows a black box for a
 *     metadata-only video, and there is no poster to fall back on because
 *     videos are stored as sent, not processed.
 *   - `playsInline` — iOS otherwise throws the video fullscreen on play, which
 *     is disorientating in the middle of reading someone's memory.
 *   - Never `autoplay`, never `muted` by default. Somebody's toast is meant to
 *     be heard, and only when the reader chooses.
 *
 * **The box is a fixed 16:9 and the video is contained in it.** Payload records
 * no dimensions for a non-image upload, and reading them from the file means
 * parsing the container and the iPhone's rotation matrix — more machinery than
 * it earns. A fixed box reserves its space before any bytes arrive, so nothing
 * shifts; the cost is that a portrait clip sits pillarboxed on the sunken
 * surface and plays smaller than it might.
 */
export function PayloadVideo({
  video,
  label,
  className,
}: {
  video: number | VideoDocument | null | undefined
  /**
   * The accessible name when the document has no description — say whose
   * video it is. The description wins when Alex has written one, because it
   * says what the video shows.
   */
  label: string
  className?: string
}) {
  // An unresolved id is a query-depth bug at the call site. A player with no
  // source is worse than no player: it looks broken rather than absent.
  if (!video || typeof video === 'number') return null
  if (!video.url) return null

  return (
    <video
      controls
      playsInline
      preload="metadata"
      src={`${video.url}#t=0.001`}
      aria-label={video.description || label}
      className={['aspect-video w-full rounded-sm bg-surface-sunken object-contain', className]
        .filter(Boolean)
        .join(' ')}
    >
      {/* Shown only by a browser with no video support at all. */}
      <a href={video.url}>Download the video</a>
    </video>
  )
}
