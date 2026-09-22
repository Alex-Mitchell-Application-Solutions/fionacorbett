import type { Metadata } from 'next'

import { Outcome, OutcomeText } from '@/app/(frontend)/(site)/tell-fiona/outcome'

export const metadata: Metadata = { title: 'Something needs changing' }

/**
 * A validation failure on the no-JS path.
 *
 * It names no field, deliberately. The redirect that brings someone here cannot
 * carry the values they typed, so it could only say "your name is missing"
 * beside an empty page — and putting field names in a URL writes them into
 * access logs next to an IP address.
 *
 * "Go back" is the instruction rather than a link because the browser's back
 * button restores the form with everything still in it, and a link would not.
 */
export default function CheckPage() {
  return (
    <Outcome title="Something needs changing">
      <OutcomeText>
        That did not quite go through. Usually it is a missing name, or a message that is only a
        word or two long.
      </OutcomeText>
      <OutcomeText>
        Press your browser&rsquo;s back button — everything you wrote will still be there — then
        check those two and send it again.
      </OutcomeText>
    </Outcome>
  )
}
