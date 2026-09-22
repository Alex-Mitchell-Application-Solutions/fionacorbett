import { randomBytes } from 'node:crypto'
import sharp from 'sharp'
import { getPayload } from 'payload'

import config from '@payload-config'

/**
 * Bootstrap an empty database into a site that runs.
 *
 * `pnpm run seed`. Local only — nothing in the image or the pre-deploy command
 * runs this, and SEED_ADMIN_* are deliberately absent from the Railway service.
 *
 * What it creates:
 *   - one admin user
 *   - placeholder hero images, generated here rather than committed
 *   - site settings pointing at them
 *   - a few photographs across three decades, so the gallery's decade grouping
 *     is visible without anyone uploading anything
 *
 * **The placeholders are generated, not committed**, and that is the point of
 * the sharp call below. Committing four JPEGs to make a seed work means four
 * files in the repository forever that look like content and are not, and the
 * first person to see them on a staging URL has to be told they are fake. These
 * are flat warm-grey panels with the word PLACEHOLDER on them, so nobody has to
 * be told.
 *
 * Idempotent by skipping, and each step guards itself rather than the whole
 * script guarding on one check. That distinction was learned here: the first
 * version keyed everything off "does any media exist", the run died partway
 * through after the uploads, and the retry then skipped the settings and the
 * photographs it had never created. A seed whose idempotency is all-or-nothing
 * cannot recover from its own partial failure, which is the one situation it
 * needs to.
 */

/** The ivory and ink from tokens.css. A placeholder should still look like the site. */
const PLACEHOLDER_GROUND = { r: 232, g: 224, b: 211 }

async function placeholderImage(label: string, width: number, height: number): Promise<Buffer> {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <rect width="100%" height="100%" fill="rgb(232,224,211)"/>
      <text x="50%" y="50%" text-anchor="middle" dominant-baseline="middle"
            font-family="Georgia, serif" font-size="${Math.round(width / 22)}"
            letter-spacing="${Math.round(width / 180)}" fill="rgb(117,93,49)">${label}</text>
    </svg>`

  return sharp(Buffer.from(svg))
    .flatten({ background: PLACEHOLDER_GROUND })
    .jpeg({ quality: 82 })
    .toBuffer()
}

async function seed() {
  const payload = await getPayload({ config })

  // --- admin -------------------------------------------------------------
  const email = process.env.SEED_ADMIN_EMAIL ?? 'alex@example.com'
  // A random password rather than a memorable default. A seeded `password123`
  // is the kind of thing that survives all the way to production because it
  // worked and nobody looked at it again.
  const password = process.env.SEED_ADMIN_PASSWORD ?? randomBytes(12).toString('base64url')

  const existingUsers = await payload.find({ collection: 'users', limit: 1 })
  if (existingUsers.totalDocs === 0) {
    await payload.create({
      collection: 'users',
      data: { email, password, name: 'Alex' },
    })
    payload.logger.info(`Created admin ${email}`)
    if (!process.env.SEED_ADMIN_PASSWORD) {
      payload.logger.info(`Generated password: ${password}`)
      payload.logger.info('Write that down now — it is not stored anywhere else.')
    }
  } else {
    payload.logger.info('An admin already exists. Leaving it alone.')
  }

  // --- placeholder media -------------------------------------------------
  /**
   * Upload a placeholder, reusing the one already there if this is a re-run.
   *
   * Keyed on filename, which is stable across runs. Without the lookup a second
   * run would add a fourth copy of every hero and Payload would suffix the
   * filenames, so the settings below would keep pointing at the first set while
   * the library filled with duplicates.
   */
  async function upload(name: string, label: string, width: number, height: number) {
    const filename = `${name}.jpg`
    const existing = await payload.find({
      collection: 'media',
      limit: 1,
      where: { filename: { equals: filename } },
    })
    const found = existing.docs[0]
    if (found) return found

    const data = await placeholderImage(label, width, height)
    return payload.create({
      collection: 'media',
      data: { alt: 'Placeholder image — replace this with a real photograph of Fiona' },
      file: { data, mimetype: 'image/jpeg', name: filename, size: data.length },
    })
  }

  const homeHero = await upload('placeholder-home', 'PLACEHOLDER — HOME', 2400, 1600)
  const galleryHero = await upload('placeholder-gallery', 'PLACEHOLDER — GALLERY', 2400, 1600)
  const memoriesHero = await upload('placeholder-memories', 'PLACEHOLDER — MEMORIES', 2400, 1600)
  const shareHero = await upload('placeholder-share', 'PLACEHOLDER — SHARE', 2400, 1600)

  await payload.updateGlobal({
    slug: 'site-settings',
    data: {
      homeHero: homeHero.id,
      homeEyebrow: 'Sixty years',
      homeTitle: 'Fiona Corbett',
      homeLead: 'Replace this from the admin, under Site settings.',
      galleryLinkLabel: 'See the photographs',
      memoriesLinkLabel: 'Share a memory',
      galleryHero: galleryHero.id,
      galleryTitle: 'The photographs',
      galleryLead: null,
      memoriesHero: memoriesHero.id,
      memoriesTitle: 'Memories of Fiona',
      memoriesLead: null,
      shareHero: shareHero.id,
      shareTitle: 'Share a memory',
      shareLead: 'Write down something you remember about Fiona. It does not need to be long.',
      shareThanks:
        'That has been saved, and Fiona will read it on her birthday. Alex looks at everything before it goes up, so it will not appear straight away — nothing has gone wrong if you do not see it yet.',
    },
  })
  payload.logger.info('Site settings written.')

  // --- sample photographs ------------------------------------------------
  const existingPhotographs = await payload.find({ collection: 'photographs', limit: 1 })
  if (existingPhotographs.totalDocs > 0) {
    payload.logger.info('Photographs already present. Leaving them alone.')
    payload.logger.info('Done.')
    return
  }

  // Three decades with a gap, so the derived grouping and the skipped-decade
  // behaviour are both visible on a fresh checkout.
  const samples = [
    { title: 'Placeholder, early', year: 1968 },
    { title: 'Placeholder, mid', year: 1969 },
    { title: 'Placeholder, the eighties', year: 1984 },
    { title: 'Placeholder, later', year: 1987 },
    { title: 'Placeholder, recent', year: 2012 },
  ]

  for (const [index, sample] of samples.entries()) {
    const image = await upload(`placeholder-photo-${index + 1}`, String(sample.year), 1600, 2000)
    await payload.create({
      collection: 'photographs',
      data: {
        image: image.id,
        title: sample.title,
        description: 'Placeholder. Delete this once there are real photographs.',
        year: sample.year,
      },
    })
  }
  payload.logger.info(`Created ${samples.length} placeholder photographs.`)
  payload.logger.info('Done. Run `pnpm run dev` and sign in at /admin.')
}

await seed()
process.exit(0)
