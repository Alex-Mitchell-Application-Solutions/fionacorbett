import { z } from 'zod'

import {
  MAX_MEMORY_BODY_LENGTH,
  MAX_MEMORY_NAME_LENGTH,
  MAX_MEMORY_TITLE_LENGTH,
} from '@/lib/memories/limits'

/**
 * One schema, used by the form and by the endpoint.
 *
 * Shared rather than duplicated so the two cannot disagree. A client that
 * accepts what the server rejects produces a submission that vanishes with no
 * message, which on this site means somebody's memory of Fiona is simply lost
 * and nobody finds out.
 *
 * The messages are written to be read by whoever is filling the form in, not by
 * a developer reading a log. They appear under the field verbatim.
 */

/**
 * Trim, then treat an empty string as absent.
 *
 * An unfilled optional text input posts `''`, not `undefined`, so without this
 * every optional field arrives as an empty string and gets stored as one. The
 * difference shows up on the page, where `title && <Heading>` renders an empty
 * heading for `''` and nothing for `undefined`.
 */
const optionalText = (max: number, tooLong: string) =>
  z
    .string()
    .trim()
    .max(max, tooLong)
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional()

export const memorySubmissionSchema = z.object({
  fromName: z
    .string()
    .trim()
    .min(1, 'Please add your name, so Fiona knows who this is from.')
    .max(
      MAX_MEMORY_NAME_LENGTH,
      `Please keep your name under ${MAX_MEMORY_NAME_LENGTH} characters.`,
    ),

  relationship: optionalText(
    MAX_MEMORY_NAME_LENGTH,
    `Please keep this under ${MAX_MEMORY_NAME_LENGTH} characters.`,
  ),

  title: optionalText(
    MAX_MEMORY_TITLE_LENGTH,
    `Please keep the title under ${MAX_MEMORY_TITLE_LENGTH} characters.`,
  ),

  body: z
    .string()
    .trim()
    .min(10, 'Please write a little more — even a sentence or two is lovely.')
    .max(
      MAX_MEMORY_BODY_LENGTH,
      `That is longer than the form can take. Please keep it under ${MAX_MEMORY_BODY_LENGTH} characters.`,
    ),

  /**
   * Optional, and only so Alex can reply. Never shown on the site.
   *
   * Validated when present rather than merely stored: an address with a typo is
   * worse than no address, because it looks like a way to reach someone.
   */
  email: z
    .string()
    .trim()
    .transform((value) => (value.length === 0 ? undefined : value))
    .optional()
    .pipe(z.email('That does not look like an email address.').optional()),
})

export type MemorySubmission = z.infer<typeof memorySubmissionSchema>

/** Field-keyed messages, the shape the form renders directly. */
export type MemoryFieldErrors = Partial<Record<keyof MemorySubmission | 'photos', string>>

/**
 * Flatten a Zod failure to one message per field.
 *
 * One rather than all of them: a field showing three messages at once is a field
 * nobody reads, and the first failure is the one to fix.
 */
export function toFieldErrors(error: z.ZodError<MemorySubmission>): MemoryFieldErrors {
  const errors: MemoryFieldErrors = {}

  for (const issue of error.issues) {
    const key = issue.path[0]
    if (typeof key !== 'string') continue
    const field = key as keyof MemorySubmission
    if (errors[field] === undefined) errors[field] = issue.message
  }

  return errors
}
