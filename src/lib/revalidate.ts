import { revalidatePath, revalidateTag } from 'next/cache'

/**
 * Cache invalidation, as Payload collection hooks.
 *
 * Every public page here is statically rendered — it is a brochure, and almost
 * nothing on it is per-visitor. That is the right call for speed and the wrong
 * one for editing, unless something tells Next when the data changed. These are
 * that something.
 *
 * Without them the failure is quiet and badly timed: Alex approves a memory, the
 * admin says saved, and the site keeps serving the page it built at deploy. The
 * first person to notice is whoever wrote the memory, on the day.
 *
 * Tags rather than paths where a query is shared across routes, so one fetch
 * does not have to know every page that reads it.
 */

export const CACHE_TAGS = {
  photographs: 'photographs',
  memories: 'memories',
  siteSettings: 'site-settings',
} as const

/**
 * The cacheLife profile `revalidateTag` takes as its second argument.
 *
 * Next 16 made that argument mandatory: it says how long the newly revalidated
 * entry should live, not how urgently to purge the old one. `'max'` means "until
 * something invalidates it again", which is exactly right here — every one of
 * these caches is invalidated by an editor's action and by nothing else, so
 * there is no interval at which re-fetching would be useful. A time-based
 * profile would just add background revalidation of data that has not changed.
 */
const UNTIL_CHANGED = 'max'

/**
 * Run a cache invalidation, unless there is no Next request to run it in.
 *
 * This wrapper is not defensive padding. Payload fires collection hooks from
 * wherever the write happened, and a good half of the writes on this project do
 * not happen inside a request: `pnpm run seed`, a migration that backfills a
 * column, a one-off script in `payload run`. Outside a request there is no
 * static generation store, and `revalidateTag` does not degrade — it throws
 * `Invariant: static generation store missing`, which aborts the write that
 * triggered it.
 *
 * That is exactly how this was found: the first `pnpm run seed` created the
 * admin user, then died writing site settings, leaving a half-seeded database.
 *
 * Swallowing the error is correct rather than merely convenient, because there
 * is genuinely nothing to invalidate in that context: a CLI process has no page
 * cache, and the server that does will be started afterwards and build its own.
 *
 * Narrow on purpose. Only the missing-store invariant is swallowed; anything
 * else rethrows, so a real failure inside a real request is not hidden by a
 * guard aimed at scripts.
 */
function outsideRequest(error: unknown): boolean {
  return error instanceof Error && error.message.includes('static generation store')
}

function invalidate(run: () => void): void {
  try {
    run()
  } catch (error) {
    if (outsideRequest(error)) return
    throw error
  }
}

/**
 * Payload's hook signature is wider than these need. They take no arguments and
 * ignore the document deliberately: every one of these pages lists the
 * collection, so any change to any row changes all of them, and there is nothing
 * to be gained from working out which.
 */
export function revalidateGallery(): void {
  invalidate(() => {
    revalidateTag(CACHE_TAGS.photographs, UNTIL_CHANGED)
    // The home page shows the featured photographs, so it moves with the gallery.
    revalidatePath('/')
    revalidatePath('/gallery')
  })
}

export function revalidateMemories(): void {
  invalidate(() => {
    revalidateTag(CACHE_TAGS.memories, UNTIL_CHANGED)
    revalidatePath('/')
    revalidatePath('/memories')
  })
}

/**
 * Site settings feed every route's hero and the home page's two link labels, so
 * a change to them invalidates the lot. `layout` rather than `page`: the setting
 * is read above the page in the tree, and a page-scoped call leaves the layout's
 * copy of it cached.
 */
export function revalidateSite(): void {
  invalidate(() => {
    revalidateTag(CACHE_TAGS.siteSettings, UNTIL_CHANGED)
    revalidatePath('/', 'layout')
  })
}
