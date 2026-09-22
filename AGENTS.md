# fionacorbett.co.uk

A private site for Fiona Corbett's 60th birthday: a gallery of photographs
spanning her life, and memories written by the people who know her.

**Any feature or behaviour change goes through an OpenSpec proposal first.**
Proposing and applying are separate turns. See [Working with OpenSpec](#working-with-openspec).

OpenSpec generates skills and commands into `.claude/` and `.agents/`. Those are
generated files — do not hand-edit them. Project context and per-artifact rules
live in `openspec/config.yaml`; everything else lives here.

---

## Implementation status legend

Used on every feature line below.

| Mark | Meaning                                                    |
| ---- | ---------------------------------------------------------- |
| ✅   | Implemented and shipped                                    |
| 🟡   | Planned for launch — non-negotiable                        |
| 🔵   | Backlog — explicitly out of scope for now                  |
| 🧪   | Needs a decision before it can be built                    |
| 🧱   | Pre-launch hardening — must exist before the link goes out |

---

## Product context

**Who it is for.** Fiona's family, friends and colleagues — perhaps sixty to a
hundred people, a good share of them over sixty themselves, most arriving on a
phone from a link forwarded in WhatsApp. Nobody will type the address in. Nobody
will search for it.

**What it does.** Two things, and the home page is two large links to them:

1. **See the photographs.** A curated gallery of Fiona across six decades,
   grouped into decades, each photograph on its own page with a title and the
   story behind it.
2. **Tell Fiona what she means to you.** Anyone with the link can write something — a fond memory,
   what she means to them — and optionally attach photographs. Nothing appears
   until Alex approves it.

**What it is not.** Not a social network. There are no accounts for visitors, no
comments, no likes, no replies, no notifications. The only account on the system
is Alex's admin login. A visitor's entire interaction is reading, and writing one
thing that a human then reads before anyone else sees it.

**How success is measured.** Fiona is moved by it on the day, and enough people
write something that the memories page feels full rather than sparse. There is no
analytics on this site and there should not be: measuring engagement on a
birthday present is measuring the wrong thing, and it would mean putting a
third-party script in front of a private family archive.

**Ownership.** Alex Mitchell, personally. This is not an Open Waters client
project, and the Open Waters analytics and SEO conventions deliberately do not
apply — see [Tech stack](#tech-stack).

🧪 **The birthday date is not recorded anywhere in this repo.** It is the one
piece of information that determines every deadline below, and nobody has stated
it. Put it here.

---

## Feature scope

### The gallery

- ✅ **Photographs collection** — image, title, description, year, optional
  manual order. `src/collections/Photographs.ts`.
- ✅ **Decades derived from year, not filed by hand.** There is no `chapters`
  collection and there should not be. The section structure of `/gallery` falls
  out of each photograph's year through `src/lib/gallery.ts`. A hand-maintained
  chapter is a value beside the thing it describes, so it drifts, and a
  photograph filed in the wrong decade is worse than one with no decade at all
  because it gets trusted.
- ✅ **A decade with nothing in it does not render.** A gap closes up. An empty
  heading reads as a loading failure.
- ✅ **One route per photograph** (`/gallery/[id]`), not a lightbox overlay.
  Every photograph has its own address so it can be sent to someone; back goes
  back one photograph; previous and next are anchors and work with no JavaScript.
- ✅ **Ordering is defined once.** `groupByDecade` sorts by year, then manual
  order, then title. The single-photograph page derives its sequence from the
  same function, so previous and next cannot walk a different order from the
  page. Blank manual order sorts last, not first — see the test.
- 🔵 **View Transitions between photographs.** Would give back the sense of
  staying in place that an overlay has, without giving up the addressable route.
  Deferred because it is an enhancement to a page that already works.

### Memories

- ✅ **Public submission at `/tell-fiona`**, with `/share` redirecting to it.
  The short form is for saying out loud and printing; the long one is canonical,
  because a bare `/share` in a forwarded message tells the recipient nothing.
- ✅ **Fields**, in this order: name and the memory (both required), up to six
  photographs (optional, kept in plain view), then an "Add more if you like"
  `<details>` holding how they know Fiona, a title and an email address that is
  never shown. The section opens itself if one of its fields has an error.
- ✅ **Approval-gated.** New memories are `pending` and appear nowhere —
  not on the page, not in the REST list, not by a guessed id. Verified against
  the running server, not assumed.
- ✅ **The email address never leaves the admin**, enforced by field-level read
  access rather than by remembering to omit it.
- ✅ **The form works with no JavaScript.** Real `action`, `method` and
  `encType`, a dwell token rendered into the HTML, and three pages for the
  native path to land on: `thank-you`, `check`, `not-sent`. The client code is an
  enhancement over a form that already works.

  This is not a nicety. The form previously had no `action` and relied entirely
  on `onSubmit`, so whenever hydration did not happen the browser did its default
  — a GET to the current URL — and every field ended up in the address bar with
  nothing stored and no error. A dead dev server did it; so would a slow phone
  where someone taps before the bundle lands. A form whose only submit path is
  JavaScript has one point of failure between a person's memory of Fiona and the
  database. Modelled on luxury-gardens' consultation form.

- ✅ **Four layers in front of the write** — rate limit, honeypot, signed dwell
  token, shared Zod schema. See [The submission path](#the-submission-path).
- ✅ **No CAPTCHA, deliberately.** Turnstile was built and removed on 20
  September 2026. It cost more than it protected: a single mistyped variable
  name silently discarded every submission, and the widget was one more thing to
  fail in front of people being asked to do a favour. The moderation queue is
  what makes that affordable — nothing reaches the site without approval, so the
  worst a bot achieves is a row Alex deletes.
- ✅ **Plain text, not rich text.** A rich text editor for a stranger means
  storing markup a stranger supplied, which means sanitising it correctly
  forever. Line breaks are all this needs.
- ✅ **A thank-you state that stands on its own.** Confirms it is saved, says it
  is read before it goes up so nobody resends, and offers "write another" as a
  button that resets the form in place. Focus moves to the heading, because the
  form it replaced no longer exists. The wording is `shareThanks` in site
  settings, editable without a deploy.
- 🟡 **Notify Alex when a memory arrives.** Without it, approval depends on him
  remembering to check the admin, and the failure mode is someone's memory
  sitting unapproved through the party. 🧪 Vendor not chosen — see
  [Open questions](#open-questions).
- 🔵 **Let a submitter edit or withdraw what they sent.** Needs a token per
  submission and a route to redeem it. The cheap version is that they email Alex.

### The site itself

- ✅ **Four routes**: home, gallery, memories, share. Plus `/gallery/[id]`,
  `/design-system`, `/health` and the two endpoints.
- ✅ **Two layouts.** `(frontend)/layout.tsx` is the document — language, font
  preload, metadata base — and carries no chrome. `(site)/layout.tsx` adds the
  header, footer and skip link, and every public page is in that group.
  `/tell-fiona` was outside it, with its own chrome and a gate check, while the
  link was being shared ahead of the rest of the site; that is over and both are
  gone.
- ✅ **Every page opens on a full-bleed photograph** through one `PageHero`.
- ✅ **Site settings as a global**, so every hero image and the two home-page
  link labels change without a deploy.
- ✅ **No page builder.** luxury-gardens has one and earns it with a dozen pages
  and a founder adding more. This has four fixed routes and one editor who can
  ask for a fifth.
- ✅ **Not indexed, anywhere, production included.** `isIndexable()` returns
  false and says why. Family photographs and messages written for a party have no
  reason to be findable by a stranger searching her name.

---

## Delivery order

Locked. Revisited only if a dependency changes.

1. ✅ Toolchain, quality gate, container, Railway config
2. ✅ Design tokens, fonts, base layer
3. ✅ Primitives, variant recipes, `/design-system` showcase
4. ✅ Payload schema, access control, migrations, seed
5. ✅ Site chrome — header, footer, `PageHero`
6. ✅ Home page and the two doorways
7. ✅ Gallery, decade grouping, single-photograph route
8. ✅ Memory submission path and the memories page
9. 🟡 Real content — Fiona's photographs, real hero images, the real copy
10. 🟡 Domain, and the first deploy
11. 🧱 Pre-launch hardening (see below)

Steps 1–8 are done and verified. **Step 9 is the long pole and it is not an
engineering task** — it is scanning and captioning photographs, and it is the
thing most likely to be late.

---

## Repo overview

```
src/
  app/
    (frontend)/            layout.tsx is the document only — no chrome
      (site)/              everything that carries the navigation
        layout.tsx         skip link, SiteHeader, main, SiteFooter
        page.tsx           home: hero, two doorways, featured strip
        gallery/           the gallery and one route per photograph
        memories/          approved memories
        design-system/     the showcase. noindex
        tell-fiona/        the form, and the three pages a no-JS post lands on
      tell-fiona/      OUTSIDE (site), on purpose. Links nowhere
      submit-memory/       POST endpoint — the only write path for a stranger
      memory-token/        mints the signed dwell token
      health/              liveness probe for the container and Railway
    (payload)/             admin and Payload's API. Mostly generated
  collections/             Payload schema and access control
  components/
    primitives/            Button, Heading, Text, Field, PayloadImage, …
    layout/                SiteHeader, HeaderShell, NavDrawer, NavTrigger,
                           SiteFooter, PageHero
    gallery/ memories/     feature components
    showcase/              the showcase's own furniture
  globals/SiteSettings.ts  hero images and copy, editable without a deploy
  lib/
    gallery.ts             decade grouping. The gallery's whole data model
    content.ts             every read the public pages make
    revalidate.ts          cache invalidation as Payload hooks
    memories/              limits, shared Zod schema
    dwell-token.ts         HMAC'd timestamp
    rate-limit.ts          in-memory fixed window
    site-env.ts            what this instance is and what follows
    storage.ts             S3, registered always and enabled conditionally
  styles/
    tokens.css             START HERE for anything visual
    variants.ts            one style recipe per primitive
    base.css               accessibility and motion floor
    utilities.css          what Tailwind has no namespace for
    header.css             the header receding over a hero, ported from luxury-gardens
    nav-drawer.css         the menu drawer, ported from luxury-gardens
  migrations/              generated, committed, applied by the deploy
scripts/seed.ts            bootstrap an empty database
.railway/railway.ts        deploy config as code. NOT applied on push
```

**Start from `src/styles/tokens.css` for anything visual** and
`src/lib/gallery.ts` for anything about how the gallery is structured.

---

## Tech stack

| Concern         | Choice                                                            | Status |
| --------------- | ----------------------------------------------------------------- | ------ |
| Language        | TypeScript strict, `noUncheckedIndexedAccess`                     | ✅     |
| Framework       | Next.js 16, App Router, Turbopack                                 | ✅     |
| Rendering       | Static everywhere except the admin, the API and the two endpoints | ✅     |
| CMS and data    | Payload 3.90.1 on Postgres                                        | ✅     |
| Migrations      | Payload migrations, committed                                     | ✅     |
| Media           | S3 in deployed environments, disk locally                         | ✅     |
| Auth            | Payload's, for the admin only                                     | ✅     |
| Styling         | Tailwind v4, token-first                                          | ✅     |
| Validation      | Zod, one schema shared by client and server                       | ✅     |
| Package manager | pnpm 11.5.2, pinned                                               | ✅     |
| Tests           | Vitest                                                            | ✅     |
| Deploy          | Railway, from a Dockerfile                                        | ✅     |
| Human check     | None. The moderation queue does this job                          | ✅     |
| Analytics       | None, deliberately                                                | ✅     |
| Error tracking  | None yet                                                          | 🧱     |

### Why Payload, and what would undo it

The obvious lighter alternative is photographs committed to the repo as files
with a JSON manifest, and a single small table for submissions. It would be
faster and there would be far less of it.

It was rejected because of what the second feature actually needs: strangers
uploading images, a moderation queue, and a non-developer approving things from a
phone. Every one of those is a hand-built admin screen in the lighter version,
and the moderation UI is the part that has to exist on the day.

**What would undo the benefit:** using Payload as a page builder. The moment
someone adds a `pages` collection with a block builder because luxury-gardens has
one, this stops being four routes and a queue and becomes a CMS project. The four
routes are fixed. A fifth is a proposal.

### Why this is not an Open Waters client project

No PostHog, no sitemap, no SEO work, no indexing. The `seo-foundations` and
`openwaters-analytics` conventions are deliberately not applied. This is a
private family site distributed by link; search reputation is not a goal and
never will be, and analytics on it would mean a third-party script watching
people read messages they wrote to Fiona.

---

## Schema and data-layer conventions

- **Two upload collections, deliberately.** `media` is what Alex uploads and
  `memory-photos` is what strangers attach. One collection would have to be
  governed by whichever needs the stricter rule, and in practice the strict rule
  gets relaxed the first time it is inconvenient for the trusted case.
- **Access control is declarative and lives on the collection.** `read` on
  `memories` returns a query constraint rather than a boolean, so it applies to
  `findByID` as well as to a list — that is what makes a guessed id a 404 rather
  than a leak.
- **Reads go through `src/lib/content.ts`**, through the Local API, with no user
  and `overrideAccess` left false. Access control therefore applies to the page
  by the same rule it applies to the API, rather than by a filter someone has to
  remember to write.
- **`depth: 2` is stated on every query.** Too shallow returns a number where a
  document was expected and `PayloadImage` renders nothing at all — a blank page
  with no error.
- **An upload collection is added in `src/lib/uploads.ts`, not in three places.**
  `UPLOAD_COLLECTIONS` feeds the image optimiser's allow-list in
  `next.config.ts`, the S3 plugin's managed collections in `storage.ts`, and the
  test that checks the list against the collection source. Adding
  `memory-photos` updated two of those and not the third, which produced a page
  that built cleanly and threw `Invalid src prop … does not match
images.localPatterns` on the first request rendering a guest's photograph —
  past lint, typecheck, the build and the container check. `uploads.test.ts`
  fails now if a collection declares an `upload` block and is not in the list.
- **Migrations are generated, committed, and applied by the deploy.** Never on
  container start: a multi-replica deploy would race, and "we only run one
  replica" is a thing that changes without anyone remembering.
- **Migrations must be additive.** The build applies them before the new
  container takes traffic, so the previous container is briefly running old code
  against the new schema. Drops and renames go across two deploys.
- **Payload hooks fire outside a request.** `revalidate.ts` guards for this:
  `revalidateTag` throws `Invariant: static generation store missing` in a CLI
  process, and an unguarded call aborts the write that triggered it. This was
  found by `pnpm run seed` dying halfway through.

---

## The submission path

`POST /submit-memory` is the only way a stranger writes to this system. The
collection's `create` access requires a signed-in user, so these layers are
mandatory rather than advisory.

Cheapest first, so a bot costs as little as possible:

| #   | Layer         | Rejects                                      | Response              |
| --- | ------------- | -------------------------------------------- | --------------------- |
| 1   | IP rate limit | 5 per 10 minutes per address                 | 429 with a message    |
| 2   | Honeypot      | an off-screen field bots fill                | silent 200            |
| 3   | Dwell token   | HMAC'd timestamp: forged, replayed, too fast | silent 200            |
| 4   | Zod schema    | the same one the form used                   | 400 with field errors |
| 5   | Photo checks  | count, size, exact mime type                 | 400 with a message    |

Non-obvious things that matter, all of which have bitten somewhere:

- **Bot rejections return 200 `{ok: true}`.** Telling a scraper which layer
  caught it is free tuning information. A human never trips these.
- **The cost of that is a false positive disappearing silently**, which on this
  site means someone's memory of Fiona is lost and nobody finds out. That is why
  the dwell window is six hours rather than the usual one, why an expired token
  returns a recoverable 409 instead of a silent success, and why every rejection
  logs its layer.
- **`silentOk()` is a function, not a shared constant.** A `Response` body is a
  stream consumed once; a module-level instance serves a correct body to the
  first caller and an empty one to everyone after. Found by firing four
  rejections in a row at the built server.
- **The dwell token must be signed.** A client-supplied `renderedAt` is trivially
  forged. HMAC'd with `PAYLOAD_SECRET`, which already exists everywhere, rather
  than adding another variable to have missing in production.
- **The share page is static, so the token cannot be baked in.** It would be
  identical for every visitor and stale within the hour. The form fetches one
  from a `no-store` endpoint on mount.
- **Mime types are checked against an exact list, never `image/*`.** That
  wildcard admits SVG, which is a document that can carry script, served from our
  own origin.
- **No PII in logs, ever.** Not names, not addresses, not memory bodies, and not
  filenames — a filename from a phone carries a date and sometimes a location.
- **Two kinds of caller, discriminated on `Accept`.** The enhanced form sends
  `application/json` and reads the answer; a native post gets a 303 to a page,
  because a browser would otherwise just display the JSON. Not discriminated on
  `Content-Type`: both send multipart, one because the browser does and one
  because the form carries files.
- **A page that renders a dwell token must revalidate.** `/tell-fiona` sets
  `revalidate = 3600`. Prerendered once at build time the baked token would be
  months old and every no-JS submission would be rejected as expired.
- **An empty file input is not an empty submission.** Every browser sends a part
  for `<input type="file">` with nothing chosen: empty name, zero bytes, no
  content type. An `instanceof File` check treats it as a file, the mime check
  then rejects it, and someone who attached no photograph is told "Photographs
  only, please". `isAttachedPhoto` in `limits.ts` is the one predicate both sides
  use — the client had the filter and the server did not, which is exactly how
  this shipped.
- **A `NEXT_PUBLIC_` value must carry the prefix in full.** `PUBLIC_FOO` is not
  exposed to the browser, reads as `undefined`, and nothing warns. That mistyped
  prefix silently discarded every memory submitted while Turnstile was still in
  place, which is a large part of why it is no longer in place.

---

## Engineering standards

Checkable. A reviewer should be able to point at a line.

### Rendering and performance

- **Static by default.** An on-demand route needs a reason stated in the file.
  Today only the admin, Payload's API, `/health`, `/memory-token` and
  `/submit-memory` are dynamic.
- **Nothing above the fold may be a client component.** React would have to
  download, parse and hydrate before the image request started. On a site that is
  almost entirely photographs, that is the whole performance story.
- **Exactly one preloaded image per page.** More than one and they compete for
  bandwidth, which makes LCP worse rather than better.
- **Every image goes through `PayloadImage`**, which takes width and height from
  the document so the box is reserved before the bytes arrive. Layout shift is a
  bug.
- **`sizes` is stated on every image** and should match the grid it sits in.
- **There are exactly three client components on this site**: `MemoryForm`,
  `NavDrawer` and `HeaderShell`. `HeaderShell` holds one boolean — scrolled or
  not — and header.css does the rest. The drawer is a modal `<dialog>` holding one boolean; its links
  are rendered on the server and passed in, so they cost no client JavaScript.
  Adding a third needs a reason.

### Types

- Strict, `noUncheckedIndexedAccess` on.
- No `any` and no non-null assertions on anything crossing a boundary. Both are
  ESLint errors, not warnings.
- Validate at the boundary and trust the types inside.
- `satisfies` is an expression operator. For a type-level assignability check use
  a constrained type parameter — see `MustFit` in `PayloadImage.tsx`.

### Server routes are security boundaries

- Re-validate every input with the shared schema. The client having checked it
  is not a check.
- Fail closed. A check that cannot complete has not passed.
- Every outbound call gets a timeout — `AbortSignal.timeout`, as in
  `turnstile.ts`. An upstream that hangs must not hang the request.
- Generic errors to the client, detail to the logs, and never the submitted
  content in either.
- Secrets read server-side only.

### Design system

- **Feature code references tokens, never a literal.** ESLint fails on a hex
  literal in `src/**/*.{ts,tsx}`, exempting `src/styles/**` and the showcase.
  `src/app/(payload)/custom.css` restates the palette as literals because it is
  outside the Tailwind cascade; that duplication is known and is maintained by
  hand.
- **One recipe per primitive, in `variants.ts`**, as pure functions returning
  class strings.
- **Classes are complete literal strings.** Tailwind scans source text, so
  `bg-${tone}` produces no CSS at all and the component renders unstyled with
  nothing in the output to say why. `variants.test.ts` asserts this.
- **Never two utilities from the same layer on one element.** Two font-size or
  two font-family classes means stylesheet order decides the winner rather than
  the call site. This is why responsive sizes live in the recipe and why `face`
  and `weight` are props rather than classes passed in.
- **`max-w-prose` is a Tailwind built-in fixed at 65ch that a theme token does
  not override.** The token here is `--container-measure`.
- **Mobile first, mechanically.** Base styles are the phone; add `md:` and `lg:`
  upward. A `max-*:` utility is evidence the layout was designed desktop-down —
  rework it. Nothing may depend on hover to be usable or discoverable.
- **Colour alone is never a signal** (WCAG 1.4.1). The invalid field state
  carries a border, a tint, a message in words and `aria-invalid`.
- **Contrast is measured, not estimated.** Every ratio in `tokens.css` was
  computed. `--color-brand-900` is ornament only; `--color-text-accent` is the
  text weight.

### Testing

The critical path is the submission endpoint and the gallery's ordering. Both
have tests, and the tests cover the failure modes rather than the happy path:
forged and replayed tokens, the rate-limit boundary, schema edges, blank sort
keys, a deleted photograph's neighbours.

### Dependencies

Every addition needs a reason; anything reaching the client bundle needs a strong
one. Lockfile committed, CI installs frozen.

---

## Design system and UI standards

**The ethos: an album on a table, not a brand.** Warm ivory ground, near-black
ink, one antique-gold accent, generous white space, nearly square corners. The
photographs carry the page and nothing competes with them.

The structure — type scale, spacing, container axis, hero treatment, the variant
layer — is lifted from luxury-gardens deliberately. The colours are not: that is
a landscaping brand's sage and olive, and this site's job is showing photographs
taken across six decades on film, early digital and phones. A warm neutral ground
flatters all of them; a green one fights the older ones.

**Copy conventions.** British English, `lang="en-GB"`. Sentence case everywhere
except the capitalised serif headings. Warm and plain, never corporate — the
reader is doing a favour, not using a product. No "submit", no "testimonial", no
"all rights reserved".

**Type.** One rule: a capitalised heading is the serif, everything else is the
sans. Level one is the serif as authored, because every level one on this site is
a person's name or a photograph's title.

**The showcase.** `/design-system`. **A component is not done until it is there
with every variant, size and state, in the same change that introduced it.**

---

## Working with OpenSpec

```
/opsx:propose "…"     start a change
/opsx:apply           implement an approved change
/opsx:archive         close it out
```

Proposing and applying are separate turns. A proposal is reviewed before it is
built.

**What skips a proposal:** bug fixes, typos, copy corrections, dependency bumps,
tests for behaviour that already exists, and adding a photograph or approving a
memory through the admin.

**What does not:** a new route, a new collection or field, anything touching the
submission path, anything adding a client component, and any change to the design
tokens.

---

## Definition of done

All of these, every time:

1. `pnpm run ci:quality` passes and **the real result is reported**, failures
   included.
2. The narrowest viewport was opened before any wider one.
3. Any new primitive is on `/design-system` with every variant, size and state.
4. No new literal colours and no arbitrary-value utilities.
5. The keyboard path works: focus is visible, order is sensible, nothing is
   reachable only by hover.
6. New logic has tests, and they cover the failure modes.
7. Any new JavaScript shipped to the client is justified in the change.
8. If the Payload config changed, `pnpm run generate:types` was run and the
   result committed. CI fails on a stale `payload-types.ts`.
9. If the schema changed, a migration is committed and it is additive.
10. OpenSpec tasks ticked and archived.
11. **This document swept** — statuses flipped, delivery order updated, repo tree
    refreshed, resolved questions removed.

---

## Privacy and compliance

This site holds photographs of a private person across sixty years, and messages
written about her by people who expected an audience of her family.

- **Collected:** what a submitter types, any photographs they attach, and their
  email address if they give one. Nothing else. No cookies beyond Payload's admin
  session, no analytics, and no third-party scripts at all.
- **Where it goes:** Postgres and an S3 bucket, both on Railway, both private to
  this project. Nothing is sent anywhere else.
- **Retention:** indefinite. It is a keepsake. There is no expiry and there
  should not be.
- **Never:** no PII in logs. No email addresses in any public response. No
  indexing. No selling, sharing or exporting anything anyone wrote.

**Known limit, accepted rather than overlooked:** a photograph attached to a
still-pending memory is retrievable by anyone who knows its URL, because
`memory-photos` has public read and next/image fetches it as an ordinary URL.
Nothing links to it and the filename is not published. Signing every image URL
was judged not worth it on a site whose purpose is showing photographs to people
who were sent a link. If that judgement changes, it changes here first.

---

## Pre-launch hardening

Every 🧱 item, so the path to production is visible in one place.

- 🧱 **Security headers and a CSP.** The site takes public uploads and serves
  them back; a CSP is what stops a stored-content surprise becoming script
  execution.
- 🧱 **Error tracking with an alert.** Right now a failing submission logs to a
  container nobody is watching. A silently broken form on this site is a lost
  memory that nobody learns about.
- 🧱 **Move the rate limiter to a shared store** before ever running a second
  replica. It is an in-memory map: a second replica halves its effect with no
  signal. `.railway/railway.ts` pins replicas to 1 for this reason.
- 🧱 **A real OG image.** The entire distribution of this site is a link pasted
  into WhatsApp. The preview card is the first impression, and right now there is
  no image behind it.
- 🧱 **Accessibility audit on a real device**, with a screen reader, at 320px,
  and at 200% zoom. The audience skews older; this is not a box to tick.
- 🧱 **Test the submission path from a phone on mobile data**, including a HEIC
  photograph straight from an iPhone camera roll.
- 🧱 **Back up the database and the bucket.** Railway's Postgres has backups;
  confirm they are on and confirm the bucket is covered too. The photographs may
  be the only digital copies in existence.
- 🧱 **Check the site with images blocked and with JavaScript off.** The gallery
  should still be navigable; the form should at least explain itself.
- 🧱 **Shrink the share page's bundle.** Measured on the production build by
  gzipping every chunk the page references: 179 KB gzipped on every page, which
  is the App Router's floor and not something this project introduced, and
  **272 KB on `/tell-fiona`**. The extra 92.6 KB is a single chunk and it is
  mostly Zod, pulled in because the form shares `memorySubmissionSchema` with the
  server.

  Sharing the schema is the right call and should not be undone — a client that
  accepts what the server rejects loses somebody's memory silently. But 92.6 KB
  on the one page an older relative opens on mobile data is worth attacking.
  `zod/mini` is the obvious first thing to try, and the schema uses nothing
  exotic. Measure before and after; do not assume.

---

## Open questions

Everything assumed or undecided. Be specific about the file that carries it.

- 🧪 **The birthday date.** Not recorded anywhere. Every deadline depends on it.
- 🧪 **Notification vendor for a new memory.** Resend is the obvious choice and
  matches luxury-gardens, but it needs an account, a verified domain and
  SPF/DKIM/DMARC. Nothing is wired yet; `src/app/(frontend)/submit-memory/route.ts`
  writes the memory and tells nobody.
- 🧪 **The real copy.** `homeLead`, `shareLead` and `shareThanks` in
  `src/globals/SiteSettings.ts` carry placeholder wording that reads as
  placeholder. The share page's lead is the one that matters most — it is what a
  stranger reads before deciding whether to write anything.
- 🧪 **Whether the gallery needs named eras** rather than "The 1970s". The
  derived decade is deliberate and the reasoning is in
  `src/collections/Photographs.ts`. If a hand-written name is wanted, it should be
  an optional label on a derived decade, never a second hierarchy.
- 🧪 **Whether Fiona should see it before the day**, which decides whether this
  deploys to a public domain now or sits on a Railway subdomain until then.
- 🧪 **Who else, if anyone, gets an admin login** to help approve memories.
  `Users` supports more than one and `approvedBy` records which.
- 🧪 **Photograph provenance.** Some photographs will involve other people who
  are alive and did not ask to be on a website. No position has been taken on
  whether that matters here. It probably does for a handful of them.
- ✅ ~~Turnstile keys~~ — removed entirely; there is no CAPTCHA.
- ✅ ~~Domain~~ — fionacorbett.co.uk, purchased.
- ✅ ~~Feature name~~ — "Memories", not "testimonials".
- ✅ ~~Font licensing~~ — Cormorant Garamond and Lato, both SIL OFL 1.1,
  self-hosted, licence committed at `public/fonts/LICENSE.txt`.

---

## Maintaining this document

This is the source of truth. **Sweep it after every shipped change**: flip
statuses, update the delivery order, refresh the repo tree, delete resolved
questions.

Drift is a bug. A document describing a system that no longer exists is worse
than no document, because it is trusted.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
