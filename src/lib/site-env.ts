/**
 * Facts about the running instance that more than one place needs.
 *
 * This module used to carry a SITE_ENV discriminator so the human check could be
 * mandatory in production only. Turnstile is gone and nothing else asked the
 * question, so the discriminator went with it rather than sitting here looking
 * wired. If a genuine production-only behaviour appears, bring it back then —
 * reading SITE_ENV rather than NODE_ENV, which is `production` in a preview
 * deployment too and so cannot tell the two apart.
 */

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
 * The site's own origin, for absolute URLs in the head and in share metadata.
 *
 * The fallback is what Next would assume anyway, and keeps a checkout without
 * the variable building.
 */
export function siteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
}
