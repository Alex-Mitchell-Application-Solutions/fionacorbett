import { describe, expect, it } from 'vitest'

import { memorySubmissionSchema, toFieldErrors } from '@/lib/memories/schema'

/**
 * The schema's edges.
 *
 * The empty-string cases carry the most weight here. An unfilled optional input
 * posts `''`, never `undefined`, so if the transform is ever dropped the schema
 * still passes and the bug only shows on the page — as an empty heading above a
 * memory, or an empty relationship line under it.
 */

const VALID = {
  fromName: 'Margaret',
  relationship: 'Her sister',
  title: 'The caravan',
  body: 'We took that caravan to Wales every August for eleven years and it rained in nine of them.',
  email: 'margaret@example.com',
}

describe('memorySubmissionSchema', () => {
  it('accepts a complete submission', () => {
    const result = memorySubmissionSchema.safeParse(VALID)
    expect(result.success).toBe(true)
  })

  it('accepts one with only the two required fields', () => {
    const result = memorySubmissionSchema.safeParse({
      fromName: 'Margaret',
      relationship: '',
      title: '',
      body: 'A short but perfectly good memory about Fiona.',
      email: '',
    })
    expect(result.success).toBe(true)
  })

  it('turns an unfilled optional field into undefined, not an empty string', () => {
    // The whole reason optionalText exists. `''` reaching the database renders
    // an empty <h2> above the memory, because '' is falsy in JSX but is still a
    // stored value someone has to explain later.
    const result = memorySubmissionSchema.parse({
      fromName: 'Margaret',
      relationship: '',
      title: '   ',
      body: 'A short but perfectly good memory about Fiona.',
      email: '',
    })
    expect(result.title).toBeUndefined()
    expect(result.relationship).toBeUndefined()
    expect(result.email).toBeUndefined()
  })

  it('trims surrounding whitespace rather than storing it', () => {
    const result = memorySubmissionSchema.parse({ ...VALID, fromName: '  Margaret  ' })
    expect(result.fromName).toBe('Margaret')
  })

  it('rejects a missing name', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, fromName: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(toFieldErrors(result.error).fromName).toMatch(/add your name/i)
  })

  it('rejects a name that is only whitespace', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, fromName: '     ' })
    expect(result.success).toBe(false)
  })

  it('rejects a body too short to be a memory', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, body: 'Hi' })
    expect(result.success).toBe(false)
    if (!result.success) expect(toFieldErrors(result.error).body).toMatch(/a little more/i)
  })

  it('rejects a body past the stored maximum', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, body: 'a'.repeat(5001) })
    expect(result.success).toBe(false)
  })

  it('accepts a body exactly at the maximum', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, body: 'a'.repeat(5000) })
    expect(result.success).toBe(true)
  })

  it('rejects an email with a typo rather than storing an unusable address', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, email: 'margaret@' })
    expect(result.success).toBe(false)
    if (!result.success) expect(toFieldErrors(result.error).email).toMatch(/email address/i)
  })

  it('rejects a name past the field length', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, fromName: 'a'.repeat(81) })
    expect(result.success).toBe(false)
  })

  it('rejects a title past the field length', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, title: 'a'.repeat(121) })
    expect(result.success).toBe(false)
  })

  it('keeps line breaks in the body, since the page depends on them', () => {
    const body = 'First paragraph about Fiona.\n\nSecond paragraph about Fiona.'
    expect(memorySubmissionSchema.parse({ ...VALID, body }).body).toBe(body)
  })

  it('stores angle brackets verbatim rather than mangling them', () => {
    // React escapes on render and the field is plain text, so there is nothing
    // to sanitise here. This test exists to record that as the decision: if
    // someone later adds stripping, it should be a deliberate change with a
    // reason, not a silent one.
    const body = 'She always said <it will be fine> and it always was, eventually.'
    expect(memorySubmissionSchema.parse({ ...VALID, body }).body).toBe(body)
  })
})

describe('toFieldErrors', () => {
  it('reports one message per field rather than all of them', () => {
    const result = memorySubmissionSchema.safeParse({ ...VALID, fromName: '', body: '' })
    expect(result.success).toBe(false)
    if (result.success) return

    const errors = toFieldErrors(result.error)
    expect(Object.keys(errors).sort()).toEqual(['body', 'fromName'])
    expect(typeof errors.fromName).toBe('string')
  })

  it('returns nothing for a submission that passed', () => {
    const result = memorySubmissionSchema.safeParse(VALID)
    expect(result.success).toBe(true)
  })
})
