import Link from 'next/link'

import { Container } from '@/components/primitives/Container'
import { Rule } from '@/components/primitives/Rule'
import { Text } from '@/components/primitives/Text'

/**
 * The foot of every page.
 *
 * Carries one thing that matters: the invitation to add a memory, repeated. Most
 * people arrive on the gallery from a link, scroll to the end of it, and that is
 * the moment they are most likely to want to write something. Making them find
 * the header again is how a submission does not happen.
 */
export function SiteFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-surface-inverse text-text-inverse">
      <Container width="wide" className="section-y">
        <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
          <div>
            <Rule tone="inverse" />
            <p className="title-face mt-6 text-2xl text-text-inverse">
              Know Fiona? Tell her what she means to you.
            </p>
            <Text tone="inverse" className="mt-3 max-w-md">
              A few lines is plenty. A photograph, if you have one.
            </Text>
          </div>

          <Link
            href="/tell-fiona"
            className="font-heading tracking-heading shrink-0 text-sm uppercase text-text-inverse underline underline-offset-8 decoration-line-inverse hover:decoration-text-inverse"
          >
            Tell Fiona what she means to you
          </Link>
        </div>

        <div className="mt-16 border-t border-line-inverse pt-6">
          <Text tone="inverse" size="sm" className="opacity-dimmed">
            {/* No "all rights reserved" and no company line. This is a birthday
                present, not a business, and boilerplate would make it read like
                one. */}
            fionacorbett.co.uk — made for Fiona&rsquo;s 60th, {year}
          </Text>
        </div>
      </Container>
    </footer>
  )
}
