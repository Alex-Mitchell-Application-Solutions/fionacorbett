import { describe, expect, it } from 'vitest'

import { MEMORY_PHOTO_ACCEPT, formatMegabytes, isAttachedPhoto } from '@/lib/memories/limits'

/**
 * `isAttachedPhoto` exists because of a bug that reached the browser: a
 * submission with no photograph attached was rejected with "Photographs only,
 * please — JPEG, PNG, WebP or HEIC".
 *
 * The cause is the first test below. Every browser sends a part for an empty
 * file input rather than sending nothing, and that part has no name, no bytes
 * and no content type — so a plain `instanceof File` check treats it as a file
 * and the mime check then rejects it.
 */
describe('isAttachedPhoto', () => {
  it('rejects the empty part a browser sends for an unfilled file input', () => {
    // Exactly what arrives: empty filename, zero bytes, no type.
    expect(isAttachedPhoto(new File([], '', { type: '' }))).toBe(false)
  })

  it('rejects a zero-byte file that does have a name', () => {
    expect(isAttachedPhoto(new File([], 'empty.png', { type: 'image/png' }))).toBe(false)
  })

  it('accepts a real photograph', () => {
    expect(
      isAttachedPhoto(new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' })),
    ).toBe(true)
  })

  it('rejects a plain text field, which getAll also returns', () => {
    expect(isAttachedPhoto('some-string')).toBe(false)
  })

  it('narrows the type, so callers get File without a cast', () => {
    const entries: FormDataEntryValue[] = [
      'not a file',
      new File([], '', { type: '' }),
      new File([new Uint8Array([1])], 'b.jpg', { type: 'image/jpeg' }),
    ]
    const files = entries.filter(isAttachedPhoto)
    expect(files).toHaveLength(1)
    expect(files[0]?.name).toBe('b.jpg')
  })
})

describe('MEMORY_PHOTO_ACCEPT', () => {
  it('is derived from the accepted types, so the input cannot drift from the check', () => {
    expect(MEMORY_PHOTO_ACCEPT).toContain('image/jpeg')
    expect(MEMORY_PHOTO_ACCEPT).not.toContain('image/svg+xml')
  })
})

describe('formatMegabytes', () => {
  it('reports in units a person thinks in', () => {
    expect(formatMegabytes(12 * 1024 * 1024)).toBe('12 MB')
  })
})
