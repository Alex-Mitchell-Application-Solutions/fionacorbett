import type { Metadata } from 'next'

import { Outcome, OutcomeText } from '@/app/(frontend)/(site)/tell-fiona/outcome'

export const metadata: Metadata = { title: 'That did not send' }

/**
 * A failure that is ours, not the sender's.
 *
 * The one thing this page must not do is imply the memory arrived. Somebody has
 * just written something personal; telling them it is safe when it is not is the
 * single worst outcome this whole pipeline exists to avoid.
 */
export default function NotSentPage() {
  return (
    <Outcome title="That did not send">
      <OutcomeText>
        Something went wrong at our end, and what you wrote was not saved — so please do not assume
        it arrived.
      </OutcomeText>
      <OutcomeText>
        Press your browser&rsquo;s back button, where everything you wrote will still be, and try
        again in a moment. If it keeps happening, send it to Alex any way you like and he will add
        it himself.
      </OutcomeText>
    </Outcome>
  )
}
