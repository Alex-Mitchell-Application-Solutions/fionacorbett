import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * A signed timestamp proving the form was on screen for a plausible interval.
 *
 * Bots post immediately and often replay the same payload. A token saying when
 * the form was rendered catches both — but only if the client cannot forge it,
 * so a plain `renderedAt` field in the body is worthless.
 *
 * Signed with PAYLOAD_SECRET rather than a new variable. That secret already
 * exists in every environment, and adding another one to manage is a way to have
 * it missing in production.
 *
 * The share page is statically rendered, so the token cannot be baked into the
 * HTML: it would be identical for every visitor and stale within the hour. The
 * form fetches one from a no-store endpoint on mount instead.
 */

const MIN_DWELL_MS = 3_000

/**
 * Six hours.
 *
 * Longer than a contact form's hour, because of what this form actually is:
 * someone opens the link, starts writing about a person they have known for
 * forty years, goes to find a photograph, and comes back. A token that expires
 * under a genuine visitor is the one failure these layers must never cause —
 * every bot rejection reports success, so the submission would vanish without a
 * word and nobody would ever know a memory had been lost.
 *
 * The floor is unchanged, so instant posts are still caught.
 */
const MAX_AGE_MS = 6 * 60 * 60 * 1000

function secret(): string {
  const value = process.env.PAYLOAD_SECRET
  // Fail closed and loudly. A missing secret must not silently disable the
  // check, which is exactly the window an attacker waits for.
  if (!value) throw new Error('PAYLOAD_SECRET is required to sign form tokens.')
  return value
}

function sign(issuedAt: number): string {
  return createHmac('sha256', secret()).update(String(issuedAt)).digest('hex')
}

export function mintDwellToken(now: number = Date.now()): string {
  return `${now}.${sign(now)}`
}

export type DwellResult = 'valid' | 'malformed' | 'forged' | 'too-fast' | 'expired'

export function verifyDwellToken(
  token: string,
  now: number = Date.now(),
  maxAgeMs: number = MAX_AGE_MS,
): DwellResult {
  const parts = token.split('.')
  if (parts.length !== 2) return 'malformed'

  const [issuedRaw, provided] = parts
  if (!issuedRaw || !provided) return 'malformed'

  const issuedAt = Number(issuedRaw)
  if (!Number.isInteger(issuedAt) || issuedAt <= 0) return 'malformed'

  const expected = sign(issuedAt)
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')

  // Length check first: timingSafeEqual throws on a mismatch rather than
  // returning false.
  if (a.length !== b.length || !timingSafeEqual(a, b)) return 'forged'

  const age = now - issuedAt
  // A negative age means clock skew or a fabricated future timestamp. Either
  // way it is not a form someone filled in.
  if (age < MIN_DWELL_MS) return 'too-fast'
  if (age > maxAgeMs) return 'expired'

  return 'valid'
}
