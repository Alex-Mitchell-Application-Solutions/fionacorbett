import type { Metadata } from 'next'

import { Outcome, OutcomeText } from '@/app/(frontend)/(site)/tell-fiona/outcome'
import { MAX_MEMORY_VIDEO_BYTES, formatMegabytes } from '@/lib/memories/limits'

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
      {/* The one cause here that is the sender's to fix: a request larger than
          the form can take is refused before it is read, and without
          JavaScript it lands on this page rather than beside the field. */}
      <OutcomeText>
        If you attached a video, it may be longer than the form can take. Videos can be up to{' '}
        {formatMegabytes(MAX_MEMORY_VIDEO_BYTES)} — about a minute from a phone. A shorter clip, or
        sending your memory without it, will go through.
      </OutcomeText>
    </Outcome>
  )
}
