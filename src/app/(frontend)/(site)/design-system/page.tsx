import type { Metadata } from 'next'

import { Entry, InverseEntry, Row, Section, Swatch } from '@/components/showcase/Showcase'
import { Button } from '@/components/primitives/Button'
import { Container } from '@/components/primitives/Container'
import { Eyebrow } from '@/components/primitives/Eyebrow'
import { Field } from '@/components/primitives/Field'
import { Heading } from '@/components/primitives/Heading'
import { PayloadVideo } from '@/components/primitives/PayloadVideo'
import { Rule } from '@/components/primitives/Rule'
import { Text } from '@/components/primitives/Text'

/**
 * The living showcase.
 *
 * Every primitive, every variant, every size, every state. The rule in AGENTS.md
 * is that a component is not done until it is on this page with all of them, in
 * the same change that introduced it — which only works if this page is cheap to
 * add to, so it is deliberately a flat list rather than a framework.
 *
 * noindex, because it is a development tool. The site is noindex everywhere
 * anyway; this page states it locally so the decision survives someone deciding
 * to open the rest of the site to search.
 */
export const metadata: Metadata = {
  title: 'Design system',
  robots: { index: false, follow: false },
}

export default function DesignSystemPage() {
  return (
    <Container width="content" className="pt-header pb-24">
      <div className="py-14">
        <Heading level={1} size={2}>
          Design system
        </Heading>
        <Rule className="mt-5" />
        <Text className="mt-5 max-w-measure">
          Every token and primitive on the site. If something here looks wrong, it is wrong
          everywhere. Tokens live in{' '}
          <code className="font-mono text-sm">src/styles/tokens.css</code> and the recipes in{' '}
          <code className="font-mono text-sm">src/styles/variants.ts</code>.
        </Text>
      </div>

      <Section title="Surfaces" importPath="src/styles/tokens.css">
        <Row label="Grounds">
          <Swatch className="bg-surface" name="--color-surface" note="the page" />
          <Swatch className="bg-surface-raised" name="--color-surface-raised" note="cards" />
          <Swatch className="bg-surface-sunken" name="--color-surface-sunken" note="bands" />
          <Swatch className="bg-surface-accent" name="--color-surface-accent" note="parchment" />
          <Swatch className="bg-surface-inverse" name="--color-surface-inverse" note="footer" />
          <Swatch className="bg-scrim" name="--color-scrim" note="over photographs" />
        </Row>
      </Section>

      <Section title="Brand ramp" importPath="src/styles/tokens.css">
        <Row label="Warm neutral, with the gold at 900">
          <Swatch className="bg-brand-50" name="brand-50" />
          <Swatch className="bg-brand-100" name="brand-100" />
          <Swatch className="bg-brand-200" name="brand-200" />
          <Swatch className="bg-brand-300" name="brand-300" />
          <Swatch className="bg-brand-400" name="brand-400" />
          <Swatch className="bg-brand-500" name="brand-500" />
          <Swatch className="bg-brand-600" name="brand-600" />
          <Swatch className="bg-brand-700" name="brand-700" />
          <Swatch className="bg-brand-800" name="brand-800" note="the ink" />
          <Swatch className="bg-brand-900" name="brand-900" note="ornament gold only" />
        </Row>
      </Section>

      <Section title="Text colours" importPath="src/styles/tokens.css">
        <Row label="On the page ground, with measured ratios">
          <Entry code="text-text · 14.89:1">
            <span className="text-text">The quick brown fox</span>
          </Entry>
          <Entry code="text-text-muted · 6.99:1">
            <span className="text-text-muted">The quick brown fox</span>
          </Entry>
          <Entry code="text-text-subtle · 5.70:1">
            <span className="text-text-subtle">The quick brown fox</span>
          </Entry>
          <Entry code="text-text-accent · 5.93:1">
            <span className="text-text-accent">The quick brown fox</span>
          </Entry>
        </Row>
        <Row label="On the dark ground">
          <InverseEntry code="text-text-inverse · 14.89:1">
            <span className="text-text-inverse">The quick brown fox</span>
          </InverseEntry>
          <InverseEntry code="text-text-accent-inverse · 6.93:1">
            <span className="text-text-accent-inverse">The quick brown fox</span>
          </InverseEntry>
        </Row>
        <Row label="Lines. The control weight is the only one that clears 3:1">
          <Swatch className="bg-line" name="--color-line" note="1.48:1 · dividers" />
          <Swatch
            className="bg-line-strong"
            name="--color-line-strong"
            note="2.12:1 · card edges"
          />
          <Swatch className="bg-line-control" name="--color-line-control" note="4.01:1 · inputs" />
        </Row>
        <Row label="Status">
          <Swatch className="bg-success" name="--color-success" />
          <Swatch className="bg-warning" name="--color-warning" />
          <Swatch className="bg-danger" name="--color-danger" />
          <Swatch className="bg-danger-soft" name="--color-danger-soft" note="field tint" />
          <Swatch className="bg-focus" name="--color-focus" note="the focus ring" />
        </Row>
      </Section>

      <Section title="Type scale" importPath="src/styles/tokens.css">
        <div className="flex flex-col gap-4">
          <p className="title-face text-6xl">6xl — the home page doorways</p>
          <p className="title-face text-5xl">5xl</p>
          <p className="title-face text-4xl">4xl — a level one heading</p>
          <p className="display-face text-3xl">3xl</p>
          <p className="display-face text-2xl">2xl — a level two heading</p>
          <p className="font-heading text-xl">xl</p>
          <p className="font-body text-lead">lead — the sentence that opens a page</p>
          <p className="font-body text-lg">lg</p>
          <p className="font-body text-base">base — body copy, 18px</p>
          <p className="font-body text-sm">sm</p>
          <p className="font-body text-xs">xs</p>
          <p className="font-body text-2xs">2xs</p>
          <p className="font-body text-3xs">3xs</p>
        </div>
      </Section>

      <Section title="Heading" importPath="src/components/primitives/Heading.tsx">
        <Row label="Levels, each with its default face">
          <Entry code="<Heading level={1} />">
            <Heading level={1}>Fiona Corbett</Heading>
          </Entry>
        </Row>
        <Row label="">
          <Entry code="<Heading level={2} />">
            <Heading level={2}>The 1970s</Heading>
          </Entry>
          <Entry code="<Heading level={3} />">
            <Heading level={3}>A section</Heading>
          </Entry>
          <Entry code="<Heading level={4} />">
            <Heading level={4}>A label</Heading>
          </Entry>
        </Row>
        <Row label="Weights">
          <Entry code='weight="light"'>
            <Heading level={3} weight="light">
              Light
            </Heading>
          </Entry>
          <Entry code='weight="regular"'>
            <Heading level={3} weight="regular">
              Regular
            </Heading>
          </Entry>
          <Entry code='weight="bold"'>
            <Heading level={3} weight="bold">
              Bold
            </Heading>
          </Entry>
        </Row>
        <Row label="Responsive size: one step on a phone, another from md">
          <Entry code="size={{ base: 2, md: 1 }}">
            <Heading level={1} size={{ base: 2, md: 1 }}>
              Narrow the window
            </Heading>
          </Entry>
        </Row>
      </Section>

      <Section title="Text" importPath="src/components/primitives/Text.tsx">
        <Row label="Sizes">
          <Entry code='size="xl"'>
            <Text size="xl">Extra large</Text>
          </Entry>
          <Entry code='size="lead"'>
            <Text size="lead">Lead copy</Text>
          </Entry>
          <Entry code='size="lg"'>
            <Text size="lg">Large</Text>
          </Entry>
          <Entry code='size="base"'>
            <Text>Base</Text>
          </Entry>
          <Entry code='size="sm"'>
            <Text size="sm">Small</Text>
          </Entry>
        </Row>
        <Row label="Tones">
          <Entry code='tone="default"'>
            <Text tone="default">Default</Text>
          </Entry>
          <Entry code='tone="muted"'>
            <Text tone="muted">Muted</Text>
          </Entry>
          <Entry code='tone="subtle"'>
            <Text tone="subtle">Subtle</Text>
          </Entry>
          <Entry code='tone="accent"'>
            <Text tone="accent">Accent</Text>
          </Entry>
          <Entry code='tone="danger"'>
            <Text tone="danger">Danger</Text>
          </Entry>
          <InverseEntry code='tone="inverse"'>
            <Text tone="inverse">Inverse</Text>
          </InverseEntry>
        </Row>
      </Section>

      <Section title="Eyebrow" importPath="src/components/primitives/Eyebrow.tsx">
        <Row label="Sizes">
          <Entry code='size="sm"'>
            <Eyebrow size="sm">Sixty years</Eyebrow>
          </Entry>
          <Entry code='size="md"'>
            <Eyebrow size="md">Sixty years</Eyebrow>
          </Entry>
          <Entry code='size="lg"'>
            <Eyebrow size="lg">Sixty years</Eyebrow>
          </Entry>
          <Entry code='size="xl"'>
            <Eyebrow size="xl">Sixty years</Eyebrow>
          </Entry>
        </Row>
        <Row label="On a dark ground">
          <InverseEntry code='tone="inverse"'>
            <Eyebrow tone="inverse" size="lg">
              Sixty years
            </Eyebrow>
          </InverseEntry>
        </Row>
      </Section>

      <Section title="Button" importPath="src/components/primitives/Button.tsx">
        <Row label="Variants">
          <Entry code='variant="primary"'>
            <Button variant="primary">Send it</Button>
          </Entry>
          <Entry code='variant="secondary"'>
            <Button variant="secondary">Secondary</Button>
          </Entry>
          <Entry code='variant="ghost"'>
            <Button variant="ghost">Ghost</Button>
          </Entry>
          <Entry code='variant="link"'>
            <Button variant="link">See them all</Button>
          </Entry>
        </Row>
        <Row label="Sizes, filled">
          <Entry code='size="sm"'>
            <Button size="sm">Small</Button>
          </Entry>
          <Entry code='size="md"'>
            <Button size="md">Medium</Button>
          </Entry>
          <Entry code='size="lg"'>
            <Button size="lg">Large</Button>
          </Entry>
          <Entry code='size="xl"'>
            <Button size="xl">Extra large</Button>
          </Entry>
        </Row>
        <Row label="Sizes, link variant. 2xl is the home page's doorways">
          <Entry code='variant="link" size="md"'>
            <Button variant="link" size="md">
              Medium
            </Button>
          </Entry>
          <Entry code='variant="link" size="lg"'>
            <Button variant="link" size="lg">
              Large
            </Button>
          </Entry>
          <Entry code='variant="link" size="xl"'>
            <Button variant="link" size="xl">
              Extra large
            </Button>
          </Entry>
        </Row>
        <Row label="">
          <Entry code='variant="link" size="2xl" face="serif"'>
            <Button variant="link" size="2xl" face="serif">
              Tell Fiona what she means to you
            </Button>
          </Entry>
        </Row>
        <Row label="On a dark ground">
          <InverseEntry code='surface="inverse" variant="primary"'>
            <Button surface="inverse" variant="primary">
              Primary
            </Button>
          </InverseEntry>
          <InverseEntry code='surface="inverse" variant="secondary"'>
            <Button surface="inverse" variant="secondary">
              Secondary
            </Button>
          </InverseEntry>
          <InverseEntry code='surface="inverse" variant="link"'>
            <Button surface="inverse" variant="link">
              Link
            </Button>
          </InverseEntry>
        </Row>
        <Row label="States">
          <Entry code="disabled">
            <Button disabled>Disabled</Button>
          </Entry>
          <Entry code='href="/gallery" · renders an anchor'>
            <Button href="/gallery" variant="secondary">
              As a link
            </Button>
          </Entry>
        </Row>
      </Section>

      <Section title="Field" importPath="src/components/primitives/Field.tsx">
        <div className="flex max-w-measure flex-col gap-8">
          <Field name="showcase-default" label="Your name" required>
            {(props) => <input {...props} type="text" />}
          </Field>
          <Field
            name="showcase-optional"
            label="How you know Fiona"
            hint="Her sister, a neighbour, a colleague."
          >
            {(props) => <input {...props} type="text" />}
          </Field>
          <Field
            name="showcase-invalid"
            label="Your email"
            required
            error="That does not look like an email address."
          >
            {(props) => <input {...props} type="email" defaultValue="margaret@" />}
          </Field>
          <Field
            name="showcase-textarea"
            label="Your message"
            required
            hint="However long you like."
          >
            {(props) => <textarea {...props} rows={4} className={`${props.className} resize-y`} />}
          </Field>
        </div>
      </Section>

      <Section title="PayloadVideo" importPath="src/components/primitives/PayloadVideo.tsx">
        {/* Test patterns, not anyone's footage. Served from public/showcase so
            the showcase needs no database row. */}
        <Row label="A landscape clip fills the reserved 16:9 box">
          <Entry code='video={{ url: "/showcase/landscape.mp4" }} label="Video from Margaret"'>
            <div className="w-full max-w-feature">
              <PayloadVideo
                video={{ url: '/showcase/landscape.mp4' }}
                label="Video from Margaret"
              />
            </div>
          </Entry>
        </Row>
        <Row label="A portrait clip is pillarboxed in the same box, so nothing shifts">
          <Entry code='video={{ url: "/showcase/portrait.mp4", description: "…" }}'>
            <div className="w-full max-w-feature">
              <PayloadVideo
                video={{
                  url: '/showcase/portrait.mp4',
                  description: 'A test pattern, filmed upright on a phone',
                }}
                label="Video from Margaret"
              />
            </div>
          </Entry>
        </Row>
        <Row label="States">
          <Entry code="video={42} · an unresolved id renders nothing">
            <Text size="sm">
              Nothing is rendered — a player with no source reads as broken. It means the query
              depth at the call site is too shallow.
            </Text>
          </Entry>
        </Row>
      </Section>

      <Section title="Rule" importPath="src/components/primitives/Rule.tsx">
        <Row label="The gold hairline that closes a heading">
          <Entry code="<Rule />">
            <Rule />
          </Entry>
          <InverseEntry code='<Rule tone="inverse" />'>
            <Rule tone="inverse" />
          </InverseEntry>
        </Row>
      </Section>

      <Section title="Elevation and radii" importPath="src/styles/tokens.css">
        <Row label="Shadows, warm-tinted so they read as depth rather than dirt">
          <Entry code="shadow-sm">
            <div className="h-20 w-32 rounded-sm bg-surface-raised shadow-sm" />
          </Entry>
          <Entry code="shadow-md">
            <div className="h-20 w-32 rounded-sm bg-surface-raised shadow-md" />
          </Entry>
          <Entry code="shadow-lg">
            <div className="h-20 w-32 rounded-sm bg-surface-raised shadow-lg" />
          </Entry>
          <Entry code="shadow-plate">
            <div className="h-20 w-32 rounded-sm bg-surface-raised shadow-plate" />
          </Entry>
        </Row>
        <Row label="Radii. Nearly square — a photograph in an album has corners">
          <Entry code="rounded-xs">
            <div className="h-16 w-24 rounded-xs bg-surface-accent" />
          </Entry>
          <Entry code="rounded-sm">
            <div className="h-16 w-24 rounded-sm bg-surface-accent" />
          </Entry>
          <Entry code="rounded-md">
            <div className="h-16 w-24 rounded-md bg-surface-accent" />
          </Entry>
          <Entry code="rounded-lg">
            <div className="h-16 w-24 rounded-lg bg-surface-accent" />
          </Entry>
        </Row>
      </Section>

      <Section title="Prose" importPath="src/styles/utilities.css">
        <div className="prose-body max-w-measure">
          <p>
            Guest-written copy is set with this. It has to hold up without anyone styling it,
            because nobody is going to.
          </p>
          <p>
            It handles <strong>strong text</strong>, <em>emphasis</em> and{' '}
            <a href="https://example.com">a link</a>, and keeps a comfortable measure at every
            width. The link here is external on purpose: an internal one is what a guest would never
            write, and the lint rule would want it routed through next/link.
          </p>
        </div>
      </Section>
    </Container>
  )
}
