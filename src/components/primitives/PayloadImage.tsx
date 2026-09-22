import NextImage from 'next/image'

import type { Media, MemoryPhoto } from '@/payload-types'

/**
 * What this component actually needs from an upload document.
 *
 * There are two upload collections — `media` for what Alex uploads and
 * `memory-photos` for what guests attach — and they differ in exactly one way
 * that matters here: `alt` is required on the first and optional on the second,
 * because nobody is going to make a guest write alt text.
 *
 * Accepting the union directly would push that difference onto every call site.
 * A structural type instead: it says what is read rather than which table the
 * row came from, and `alt` is optional in it so the narrower of the two fits.
 * The two assertions below keep that honest: if either generated type drifts
 * away from what is read here, this file fails to compile rather than silently
 * accepting a document it cannot render.
 */
export type ImageDocument = {
  url?: string | null
  alt?: string | null
  width?: number | null
  height?: number | null
  /** Percentages, 0–100, set by clicking the image in the admin. */
  focalX?: number | null
  focalY?: number | null
}

/**
 * Compile-time assignability check. `satisfies` cannot be used here — it is an
 * expression operator, not a type one — and a constraint on a type parameter is
 * the type-level equivalent.
 */
type MustFit<T extends ImageDocument> = T

type _MediaFits = MustFit<Media>
type _MemoryPhotoFits = MustFit<MemoryPhoto>

/**
 * Renders a Payload media document through next/image.
 *
 * Server-rendered by design. The standards ban a client component owning
 * anything above the fold, because the browser would have to download, parse and
 * hydrate React before the image request even started — the serialised waterfall
 * that kills mobile LCP. On a site that is almost entirely photographs, that is
 * the whole performance story.
 *
 * Width and height always come from the media document, so the box is reserved
 * before the bytes arrive. Layout shift is a bug.
 */
export function PayloadImage({
  media,
  sizes,
  preload = false,
  className,
  fill = false,
  decorative = false,
}: {
  media: number | ImageDocument | null | undefined
  sizes: string
  /**
   * True only for the LCP image: it loads eagerly and is preloaded from the
   * head. More than one preloaded image competes for bandwidth.
   *
   * Named `preload` rather than `priority` since Next 16, which deprecates the
   * old name. The two produce identical output.
   */
  preload?: boolean
  className?: string
  fill?: boolean
  /**
   * Renders with an empty alt, for an image that illustrates copy sitting on it
   * rather than carrying anything of its own.
   *
   * The media library requires alt text at upload and should: an asset with no
   * description is a validation error. What is announced at the point of use is
   * a separate decision, and describing a photograph beside a caption describing
   * the same photograph announces it twice.
   */
  decorative?: boolean
}) {
  // A depth-0 query returns the id rather than the document. That is a query bug
  // at the call site, not something to paper over with a placeholder.
  if (!media || typeof media === 'number') return null
  if (!media.url) return null

  const common = {
    src: media.url,
    // `?? ''` covers the memory-photos case, where alt is optional because a
    // guest was never asked for one. An empty alt is the correct rendering for
    // an image with no description — it tells a screen reader to skip it, which
    // is better than announcing a filename.
    alt: decorative ? '' : (media.alt ?? ''),
    preload,
    className,
    sizes,
  }

  if (fill) {
    // A filled image is cropped to its box, and the box's shape changes with the
    // screen: a hero is wide on a laptop and a tall narrow slice on a phone. By
    // default that slice is the centre of the photograph, which on a two-person
    // shot is the gap between them. The focal point set in the admin moves the
    // crop onto the subject instead. Unset, it falls back to the centre.
    const x = media.focalX ?? 50
    const y = media.focalY ?? 50
    return (
      <NextImage {...common} fill style={{ objectFit: 'cover', objectPosition: `${x}% ${y}%` }} />
    )
  }

  return <NextImage {...common} width={media.width ?? 1600} height={media.height ?? 1200} />
}
