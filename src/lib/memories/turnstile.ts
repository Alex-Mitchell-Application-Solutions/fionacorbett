import { requiresHumanCheck } from '@/lib/site-env'

/**
 * Cloudflare Turnstile, the human check on the memory form.
 *
 * Chosen over a reCAPTCHA-style challenge because it is usually invisible, needs
 * no cookie, and does not ask a sixty-year-old's friends to identify traffic
 * lights. That last part is not a joke: the audience for this form is people
 * being asked to do a favour, and every point of friction is a memory that does
 * not get written.
 */

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

/** A network call gets a timeout. An upstream that hangs must not hang this. */
const TIMEOUT_MS = 5_000

export type HumanCheckResult = 'passed' | 'skipped' | 'failed' | 'misconfigured'

/**
 * The two keys have to be set together, and the half-configured case is the one
 * that actually happens.
 *
 * `TURNSTILE_SECRET_KEY` alone means the server demands a token that the form
 * can never produce, because the widget only renders when the *site* key is
 * present. Every submission then looks exactly like a bot to the endpoint.
 *
 * This is not hypothetical. It happened here, from a single mistyped variable
 * name: `PUBLIC_TURNSTILE_SITE_KEY` instead of `NEXT_PUBLIC_TURNSTILE_SITE_KEY`.
 * Next only exposes the `NEXT_PUBLIC_` prefix, so the site key was silently
 * undefined, the widget silently did not render, the endpoint silently rejected,
 * and the submitter was silently told everything was fine. Four silences and a
 * lost memory.
 *
 * Read server-side even though it is a NEXT_PUBLIC value: the prefix controls
 * what is inlined into the client bundle, not what the server can see.
 */
function keysDisagree(): boolean {
  const secret = Boolean(process.env.TURNSTILE_SECRET_KEY)
  const site = Boolean(process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY)
  return secret !== site
}

/**
 * Verify a Turnstile token.
 *
 * Three outcomes rather than a boolean, because "not configured" is genuinely
 * different from "failed" and the caller treats them differently: a skip
 * proceeds, a failure does not.
 *
 * The configuration rule is the important part:
 *
 *   - **No secret in development or preview** — skipped, so a checkout runs with
 *     nothing but Postgres and nobody needs Cloudflare credentials to work on
 *     the form.
 *   - **No secret in production** — failed, not skipped. A bot check that
 *     quietly turns itself off when misconfigured is worse than having none,
 *     because it reports that it is protecting something. Fail closed.
 *   - **Only one of the two keys set** — `misconfigured`, which the caller must
 *     NOT treat as a bot. See keysDisagree below. This is our fault, not the
 *     submitter's, and answering it with a silent success throws away something
 *     a person wrote.
 *
 * A network error is a failure, for the same reason a missing secret is: an
 * upstream being down is exactly the window an attacker waits for.
 */
export async function verifyHuman(
  token: string | null,
  remoteIp: string,
): Promise<HumanCheckResult> {
  // Before anything else, because a half-configured pair produces a rejection
  // that is indistinguishable from a bot and must not be reported as one.
  if (keysDisagree()) return 'misconfigured'

  const secret = process.env.TURNSTILE_SECRET_KEY

  if (!secret) {
    if (requiresHumanCheck()) return 'failed'
    return 'skipped'
  }

  if (!token) return 'failed'

  const body = new URLSearchParams({ secret, response: token })
  // 'unknown' is what clientIp returns when it cannot determine an address.
  // Cloudflare rejects the request outright if given that as an IP, so the
  // field is omitted rather than sent as a literal — it is optional.
  if (remoteIp !== 'unknown') body.set('remoteip', remoteIp)

  try {
    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    })

    if (!response.ok) return 'failed'

    const result: unknown = await response.json()
    // Validated rather than trusted: this is a boundary, and `result.success`
    // on an unknown shape is an assumption about someone else's API.
    if (typeof result !== 'object' || result === null) return 'failed'
    const success = (result as { success?: unknown }).success
    return success === true ? 'passed' : 'failed'
  } catch {
    // Covers the timeout, a DNS failure and malformed JSON alike. All of them
    // mean the check did not complete, and a check that did not complete is not
    // a check that passed.
    return 'failed'
  }
}
