import { FeaturedStrip } from '@/components/gallery/FeaturedStrip'
import { PageHero } from '@/components/layout/PageHero'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Rule } from '@/components/primitives/Rule'
import { Text } from '@/components/primitives/Text'
import { getFeaturedPhotographs, getSiteSettings } from '@/lib/content'

/**
 * The home page.
 *
 * Three things, in this order: the photograph, the two doorways, a handful of
 * pictures to prove there are more.
 *
 * The doorways are the page. Everything else on this site hangs off them, and
 * they are sized as a statement rather than as navigation — `2xl` on the link
 * variant, which is the type scale's largest step. There is no third link and
 * there should not be: a choice between two things is an invitation, and a
 * choice between five is a menu.
 */
export default async function HomePage() {
  const [settings, featured] = await Promise.all([getSiteSettings(), getFeaturedPhotographs()])

  return (
    <>
      <PageHero
        image={settings.homeHero}
        eyebrow={settings.homeEyebrow}
        title={settings.homeTitle}
        lead={settings.homeLead}
      />

      <Container width="wide" className="section-y">
        <nav aria-label="The two things to do here">
          {/*
            Stacked at every width, not side by side from md.

            Two columns was the first build and it was wrong: at this type size
            the two labels set to very different lengths, so the columns were
            visibly unbalanced, and the pair read as a comparison — this or that
            — rather than as two invitations. Stacked, each one gets a full line
            and its own moment.
          */}
          {/*
            Button with href, not a bare next/link with the recipe's classes
            applied. Going through the primitive is what attaches the trailing
            arrow, which belongs to the link variant rather than to the label;
            applying `buttonClasses` by hand gets the type and loses the arrow,
            and then the two doorways differ from every other link-variant
            control on the site.

            The cost is a full page load rather than a client-side transition,
            because Button renders an anchor. That is accepted: there are four
            routes, each one opens on a different full-bleed photograph it has to
            fetch anyway, and a prefetched route boundary would save very little.
          */}
          <ul className="flex flex-col gap-6 md:gap-10">
            <li>
              <Button href="/gallery" variant="link" size="2xl" face="serif">
                {settings.galleryLinkLabel}
              </Button>
            </li>
            <li>
              <Button href="/share-a-memory" variant="link" size="2xl" face="serif">
                {settings.memoriesLinkLabel}
              </Button>
            </li>
          </ul>
        </nav>

        <Rule className="mt-14" />
        <Text size="lead" className="mt-6 max-w-measure">
          Everything here was put together for Fiona&rsquo;s sixtieth. If you know her, there is a
          space below for whatever you would like to say.
        </Text>
      </Container>

      {featured.length > 0 ? <FeaturedStrip photographs={featured} /> : null}
    </>
  )
}
