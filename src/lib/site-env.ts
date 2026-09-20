/**
 * What the running instance is, and what follows from it.
 *
 * Read from SITE_ENV rather than NODE_ENV. NODE_ENV is `production` in every
 * built deployment, including a preview, so a check written against it cannot
 * tell production from anything else — which is exactly the distinction both
 * callers here need.
 */

export type SiteEnv = 'development' | 'preview' | 'production'

export function siteEnv(): SiteEnv {
  const value = process.env.SITE_ENV
  if (value === 'production' || value === 'preview' || value === 'development') return value
  // Anything unset or unrecognised is treated as the least privileged. A typo in
  // the variable must not be the thing that opens the site to crawlers.
  return 'development'
}

/**
 * Whether search engines may index this instance.
 *
 * False everywhere, including production, and that is the decision rather than
 * an oversight. The site is shared by link with family and friends. It has
 * photographs of a private person across sixty years and messages written to her
 * by people who did not expect an audience beyond the party. None of that has
 * any reason to be findable by a stranger searching her name, and "it is on the
 * internet so it may as well be indexed" is not a reason.
 *
 * The consequence is accepted deliberately: the site will never rank for
 * anything, and it does not need to. Everyone who should see it is being sent
 * the address.
 *
 * Kept as a function returning a constant, rather than inlining `false` at the
 * call site, so the decision has somewhere to live and can be reversed in one
 * place if Alex ever wants it public.
 */
export function isIndexable(): boolean {
  return false
}

/**
 * Whether the human check is mandatory.
 *
 * True in production only. Locally and in preview the form works without
 * Turnstile keys, so a checkout runs with nothing but Postgres; in production a
 * missing key is refused rather than silently skipped, because a bot check that
 * quietly turns itself off when misconfigured is worse than none — it reports
 * that it is protecting something.
 */
export function requiresHumanCheck(): boolean {
  return siteEnv() === 'production'
}

/**
 * The site's own origin, for absolute URLs in the head and in share metadata.
 *
 * The fallback is what Next would assume anyway, and keeps a checkout without
 * the variable building.
 */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}
