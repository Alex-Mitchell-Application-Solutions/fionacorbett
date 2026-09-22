import type { ReactNode } from 'react'

import { Container } from '@/components/primitives/Container'
import { Heading } from '@/components/primitives/Heading'
import { Rule } from '@/components/primitives/Rule'
import { Text } from '@/components/primitives/Text'

/**
 * What the form without JavaScript lands on.
 *
 * Three outcomes, three pages, one shape. They exist because a native form post
 * has to be answered with a page rather than a JSON body — a browser would just
 * display the JSON. With JavaScript none of these is ever reached: the form
 * swaps its own content in place.
 *
 * `check` and `not-sent` deliberately tell the reader to go back rather than
 * offering a link: back restores everything they typed, and a link would lose
 * it.
 */
export function Outcome({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Container width="content" className="pt-header section-y">
      <div className="max-w-measure">
        <Rule />
        <Heading level={1} size={2} className="mt-6">
          {title}
        </Heading>
        <div className="mt-6 flex flex-col gap-5">{children}</div>
      </div>
    </Container>
  )
}

export function OutcomeText({ children }: { children: ReactNode }) {
  return <Text size="lead">{children}</Text>
}
