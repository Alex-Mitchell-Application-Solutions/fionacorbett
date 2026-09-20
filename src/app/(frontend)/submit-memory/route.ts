import configPromise from '@payload-config'
import { getPayload } from 'payload'

import { verifyDwellToken } from '@/lib/dwell-token'
import {
  ACCEPTED_MEMORY_PHOTO_TYPES,
  MAX_MEMORY_PHOTOS,
  MAX_MEMORY_PHOTO_BYTES,
  formatMegabytes,
  isAttachedPhoto,
} from '@/lib/memories/limits'
import {
  type MemoryFieldErrors,
  memorySubmissionSchema,
  toFieldErrors,
} from '@/lib/memories/schema'
import { verifyHuman } from '@/lib/memories/turnstile'
import { clientIp, rateLimit } from '@/lib/rate-limit'

/**
 * `POST /submit-memory` — the only way a memory gets into the database.
 *
 * The collection's `create` access requires a signed-in user, so this endpoint
 * is not one path among several: it is the path, and every layer below is
 * therefore mandatory rather than advisory.
 *
 * Layers, cheapest first, so a bot costs us as little as possible:
 *
 *   1. IP rate limit      in-memory fixed window, a blunt backstop
 *   2. Honeypot           an off-screen input bots fill and humans never see
 *   3. Signed dwell token HMAC(timestamp) minted at mount, verified here
 *   4. Zod validation     the same schema the form used
 *   5. Photo checks       count, size and exact mime type
 *   6. Human check        Turnstile. A network call, so it goes last
 *   7. Write              through the Local API, status pending
 *
 * **Bot rejections return HTTP 200 `{ ok: true }`.** Telling a scraper which
 * layer caught it is free tuning information, and a human never trips these. The
 * cost of that choice is that a genuine submission lost to a false positive
 * disappears silently — which is why the dwell window is six hours rather than
 * the usual one, and why every one of these paths logs.
 *
 * Not under `/api`: Payload owns `/api/[...slug]`.
 */
export const dynamic = 'force-dynamic'

/**
 * What a bot sees. Identical to success, deliberately.
 *
 * A function, not a shared constant, and that distinction is not style. A
 * `Response` body is a stream that can be consumed exactly once, so a single
 * module-level instance returned from every rejection serves a correct body to
 * the first caller of the process and an empty one to every caller after it.
 *
 * Found by firing four rejected submissions in a row against the built server:
 * the first came back `{"ok":true}` and the rest came back blank. It would never
 * have shown up in a unit test that builds one response per case, and in
 * production it would have looked like an intermittent network fault.
 */
function silentOk(): Response {
  return Response.json({ ok: true }, { status: 200 })
}

function invalid(fields: MemoryFieldErrors): Response {
  return Response.json({ ok: false, fields }, { status: 400 })
}

/**
 * Log a rejection without logging anything a person wrote.
 *
 * No names, no email addresses, no memory bodies, no filenames — filenames from
 * a phone carry dates and sometimes locations. The layer and the outcome are
 * enough to tell whether the form is under attack or simply broken.
 */
function logRejection(layer: string, detail?: string): void {
  console.warn(`[submit-memory] rejected at ${layer}${detail ? `: ${detail}` : ''}`)
}

export async function POST(request: Request): Promise<Response> {
  const ip = clientIp(request.headers)

  // 1. Rate limit.
  if (!rateLimit(`memory:${ip}`).allowed) {
    logRejection('rate-limit')
    // 429 rather than a silent 200: this one a real person can hit, by sending
    // several memories in an evening, and they deserve to be told to wait
    // rather than to watch the last one vanish.
    return Response.json(
      { ok: false, message: 'That is a few in quick succession. Please try again shortly.' },
      { status: 429 },
    )
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    logRejection('malformed-body')
    return silentOk()
  }

  // 2. Honeypot. Named to look worth filling in; positioned off-screen and
  //    marked aria-hidden with tabindex -1, so nothing a human uses can reach it.
  const honeypot = form.get('website')
  if (typeof honeypot === 'string' && honeypot.trim().length > 0) {
    logRejection('honeypot')
    return silentOk()
  }

  // 3. Dwell token.
  const token = form.get('dwell')
  if (typeof token !== 'string') {
    logRejection('dwell', 'missing')
    return silentOk()
  }
  const dwell = verifyDwellToken(token)
  if (dwell !== 'valid') {
    logRejection('dwell', dwell)
    // Expired is the one outcome here that a real person can reach — the form
    // left open overnight — so it gets a message and a recoverable status
    // rather than a silent success. The form refetches a token and lets them
    // send again, so nothing they wrote is lost.
    if (dwell === 'expired') {
      return Response.json(
        {
          ok: false,
          expired: true,
          message: 'This form has been open a while. Please send it again — nothing has been lost.',
        },
        { status: 409 },
      )
    }
    return silentOk()
  }

  // 4. Schema. The same one the form validated against.
  const parsed = memorySubmissionSchema.safeParse({
    fromName: form.get('fromName') ?? '',
    relationship: form.get('relationship') ?? '',
    title: form.get('title') ?? '',
    body: form.get('body') ?? '',
    email: form.get('email') ?? '',
  })

  if (!parsed.success) {
    logRejection('schema')
    return invalid(toFieldErrors(parsed.error))
  }

  // 5. Photographs. A real person reaches every one of these by accident, so
  //    they all return a message rather than a silent success.
  // isAttachedPhoto, not `instanceof File`. A file input with nothing chosen
  // still sends a part — empty name, zero bytes, no content type — and treating
  // that as a file fails the mime check below, so a submission with no
  // photograph gets told "Photographs only, please". Shared with the client so
  // the two cannot apply different rules; they already had.
  const photos = form.getAll('photos').filter(isAttachedPhoto)

  if (photos.length > MAX_MEMORY_PHOTOS) {
    return invalid({ photos: `Please attach no more than ${MAX_MEMORY_PHOTOS} photographs.` })
  }

  for (const photo of photos) {
    if (photo.size > MAX_MEMORY_PHOTO_BYTES) {
      return invalid({
        photos: `One of those is larger than ${formatMegabytes(MAX_MEMORY_PHOTO_BYTES)}. Please send a smaller version.`,
      })
    }
    // Checked against the exact list rather than a prefix match: `image/*`
    // admits SVG, which is a document that can carry script, and we would be
    // serving it from our own origin.
    if (
      !ACCEPTED_MEMORY_PHOTO_TYPES.includes(
        photo.type as (typeof ACCEPTED_MEMORY_PHOTO_TYPES)[number],
      )
    ) {
      return invalid({ photos: 'Photographs only, please — JPEG, PNG, WebP or HEIC.' })
    }
  }

  // 6. Human check. Last, because it is the only layer that makes a network call.
  const human = await verifyHuman(
    typeof form.get('cf-turnstile-response') === 'string'
      ? (form.get('cf-turnstile-response') as string)
      : null,
    ip,
  )
  /*
   * Misconfiguration is not a bot, and must never be answered with a silent
   * success.
   *
   * Only one of the two Turnstile keys being set makes every genuine submission
   * look exactly like a bot: the widget cannot render without the site key, so
   * no token is ever produced, so the check always fails. Reporting that as
   * `{ok: true}` means every memory sent during the misconfiguration is thrown
   * away while its author is told it arrived.
   *
   * So: a loud log, and an honest 500. The submitter is told to try again rather
   * than being lied to, and the error names the fix.
   */
  if (human === 'misconfigured') {
    console.error(
      '[submit-memory] Turnstile is half-configured: TURNSTILE_SECRET_KEY and ' +
        'NEXT_PUBLIC_TURNSTILE_SITE_KEY must both be set, or neither. ' +
        'Refusing to accept submissions that would be silently discarded.',
    )
    return Response.json(
      {
        ok: false,
        message:
          'Something is wrong at our end, not yours. Please try again shortly — and if it keeps happening, let Alex know.',
      },
      { status: 500 },
    )
  }

  if (human === 'failed') {
    logRejection('human-check')
    return silentOk()
  }

  // 7. Write. Photographs first, so a memory never references an upload that
  //    failed; an orphaned photo with no memory is tidier than a memory with a
  //    broken image on it.
  try {
    const payload = await getPayload({ config: await configPromise })

    const photoIds: number[] = []
    for (const photo of photos) {
      const created = await payload.create({
        collection: 'memory-photos',
        data: {
          // A serviceable default rather than nothing. Alt text is required on
          // `media` and cannot be here — nobody is going to make a guest write
          // it — so this at least says where the image came from until Alex
          // improves it on approval.
          alt: `A photograph shared by ${parsed.data.fromName}`,
        },
        file: {
          data: Buffer.from(await photo.arrayBuffer()),
          mimetype: photo.type,
          name: photo.name,
          size: photo.size,
        },
      })
      photoIds.push(created.id)
    }

    await payload.create({
      collection: 'memories',
      data: {
        ...parsed.data,
        photos: photoIds,
        // Stated rather than left to the field default. The default is right,
        // and this is the single most consequential value in the request: it is
        // what stands between a public page and whatever anyone chose to send.
        status: 'pending',
      },
      // The Local API applies access control unless told otherwise, and
      // `create` on this collection requires a signed-in user. This request has
      // none — it is a stranger — so the override is what makes the write
      // possible at all. It is safe here and only here, because every layer
      // above has already run.
      overrideAccess: true,
    })
  } catch (error) {
    // Generic to the caller, detail to the logs, and never the submitted
    // content in either.
    console.error('[submit-memory] write failed', error instanceof Error ? error.message : error)
    return Response.json(
      {
        ok: false,
        message: 'Something went wrong saving that. Please try again in a moment.',
      },
      { status: 500 },
    )
  }

  return Response.json({ ok: true }, { status: 200 })
}
