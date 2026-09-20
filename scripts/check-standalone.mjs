/**
 * Fail the build if /share-a-memory links anywhere on this site.
 *
 * That page is shared on its own while the rest of the site is being built, so
 * every link on it has to stay on the page. This is a rule about rendered
 * output, not about one component: a link could arrive from the layout, from a
 * primitive's default, from a CMS field, or from someone moving the route back
 * into the `(site)` group without noticing what that inherits. A comment cannot
 * catch any of those. Grepping the prerendered HTML catches all of them.
 *
 * Runs after `next build`, as the last step of `ci:quality`.
 *
 * When the site is finished and this page can join the rest of it, delete this
 * script and its line in package.json — do not weaken it to a warning.
 */
import { readFileSync, existsSync } from 'node:fs'

const PAGE = '.next/server/app/share-a-memory.html'

/**
 * Fragments are fine: they stay on the page, and the skip link needs one.
 * Everything else that starts with / or is a bare relative path is a way off.
 */
const ALLOWED = (href) => href.startsWith('#')

if (!existsSync(PAGE)) {
  console.error(
    `check-standalone: ${PAGE} not found. This runs after \`next build\` — if the\n` +
      'route was renamed or moved, update this script rather than deleting it.',
  )
  process.exit(1)
}

const html = readFileSync(PAGE, 'utf8')
const hrefs = [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1])

const offenders = hrefs.filter((href) => {
  if (ALLOWED(href)) return false
  // Absolute URLs to somewhere else entirely are not this rule's business — the
  // Turnstile script tag and any future external reference are fine.
  if (/^https?:\/\//.test(href)) {
    try {
      const url = new URL(href)
      const site = process.env.NEXT_PUBLIC_SITE_URL
      // An absolute URL pointing back at our own origin is still a way off the
      // page, and is exactly what a hand-written full URL would look like.
      return site ? url.origin === new URL(site).origin : false
    } catch {
      return false
    }
  }
  // Stylesheets and fonts are hrefs too, and they are not navigation.
  if (/\.(css|woff2?|ico|png|jpg|svg)$/.test(href)) return false
  if (href.startsWith('/_next/')) return false
  return true
})

if (offenders.length > 0) {
  console.error('check-standalone: /share-a-memory must not link into the rest of the site.')
  console.error('This page is shared on its own while the site is unfinished.\n')
  for (const href of [...new Set(offenders)]) console.error(`  ${href}`)
  console.error('\nSee src/components/layout/StandaloneFrame.tsx.')
  process.exit(1)
}

console.log(
  `check-standalone: /share-a-memory links nowhere off the page (${hrefs.length} hrefs checked).`,
)
