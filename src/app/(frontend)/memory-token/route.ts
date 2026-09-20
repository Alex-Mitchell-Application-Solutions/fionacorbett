import { mintDwellToken } from '@/lib/dwell-token'

/**
 * Issues a signed dwell token for the memory form.
 *
 * A separate endpoint because the share page is statically rendered. A token
 * baked into that HTML would be identical for every visitor and stale within the
 * hour — it would prove nothing and reject everyone. The form fetches one here
 * on mount instead, which also means the clock starts when the form appears
 * rather than when the page was built.
 *
 * Deliberately not under `/api`: Payload owns `/api/[...slug]`, and a route that
 * only works because a static segment happens to beat a catch-all is a route
 * that breaks the next time either side changes.
 */
export const dynamic = 'force-dynamic'

export function GET(): Response {
  return Response.json(
    { token: mintDwellToken() },
    {
      status: 200,
      headers: {
        // Never cached, anywhere. A CDN or a browser holding one of these would
        // hand the same timestamp to everyone who opened the form, and then
        // expire it for all of them at once.
        'cache-control': 'no-store, max-age=0',
      },
    },
  )
}
