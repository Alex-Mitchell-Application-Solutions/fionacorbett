import type { Metadata } from 'next'

import { Outcome, OutcomeText } from '@/app/(frontend)/(site)/tell-fiona/outcome'
import { getSiteSettings } from '@/lib/content'

export const metadata: Metadata = { title: 'Thank you' }

/**
 * Where a memory sent without JavaScript lands.
 *
 * Uses the same `shareThanks` wording as the enhanced form's in-place
 * confirmation, so the two cannot drift and Alex edits one field rather than
 * two.
 */
export default async function ThankYouPage() {
  const settings = await getSiteSettings()

  return (
    <Outcome title="Thank you">
      <OutcomeText>{settings.shareThanks}</OutcomeText>
      <OutcomeText>You can close this page now — there is nothing else to do.</OutcomeText>
    </Outcome>
  )
}
