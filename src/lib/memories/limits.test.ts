import { describe, expect, it } from 'vitest'

import {
  MAX_MEMORY_PHOTOS,
  MAX_MEMORY_PHOTO_BYTES,
  MAX_MEMORY_VIDEO_BYTES,
  MAX_SUBMISSION_BYTES,
  MEMORY_PHOTO_ACCEPT,
  MEMORY_VIDEO_ACCEPT,
  declaredSize,
  formatMegabytes,
  isAttachedFile,
  videoProblem,
} from '@/lib/memories/limits'

/**
 * `isAttachedFile` exists because of a bug that reached the browser: a
 * submission with no photograph attached was rejected with "Photographs only,
 * please — JPEG, PNG, WebP or HEIC".
 *
 * The cause is the first test below. Every browser sends a part for an empty
 * file input rather than sending nothing, and that part has no name, no bytes
 * and no content type — so a plain `instanceof File` check treats it as a file
 * and the mime check then rejects it.
 */
describe('isAttachedFile', () => {
  it('rejects the empty part a browser sends for an unfilled file input', () => {
    // Exactly what arrives: empty filename, zero bytes, no type.
    expect(isAttachedFile(new File([], '', { type: '' }))).toBe(false)
  })

  it('rejects a zero-byte file that does have a name', () => {
    expect(isAttachedFile(new File([], 'empty.png', { type: 'image/png' }))).toBe(false)
  })

  it('accepts a real photograph', () => {
    expect(
      isAttachedFile(new File([new Uint8Array([1, 2, 3])], 'a.png', { type: 'image/png' })),
    ).toBe(true)
  })

  it('rejects a plain text field, which getAll also returns', () => {
    expect(isAttachedFile('some-string')).toBe(false)
  })

  it('narrows the type, so callers get File without a cast', () => {
    const entries: FormDataEntryValue[] = [
      'not a file',
      new File([], '', { type: '' }),
      new File([new Uint8Array([1])], 'b.jpg', { type: 'image/jpeg' }),
    ]
    const files = entries.filter(isAttachedFile)
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

/**
 * A file of a given size without allocating it. A real 100 MB buffer in a unit
 * test is slow and proves nothing the size property does not.
 */
function fileOfSize(size: number, name: string, type: string): File {
  const file = new File([new Uint8Array([1])], name, { type })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('isAttachedFile, for the video input', () => {
  it('rejects the empty part an unfilled video input sends', () => {
    expect(isAttachedFile(new File([], '', { type: '' }))).toBe(false)
  })
})

describe('MEMORY_VIDEO_ACCEPT', () => {
  it('lists exact types and no wildcard', () => {
    expect(MEMORY_VIDEO_ACCEPT).toContain('video/quicktime')
    expect(MEMORY_VIDEO_ACCEPT).not.toContain('*')
  })
})

describe('videoProblem', () => {
  it('accepts no video at all', () => {
    expect(videoProblem([])).toBeUndefined()
  })

  it('accepts an iPhone .mov at the cap exactly', () => {
    expect(
      videoProblem([fileOfSize(MAX_MEMORY_VIDEO_BYTES, 'IMG_0001.MOV', 'video/quicktime')]),
    ).toBeUndefined()
  })

  it('refuses one byte over the cap, naming the cap', () => {
    const problem = videoProblem([fileOfSize(MAX_MEMORY_VIDEO_BYTES + 1, 'long.mp4', 'video/mp4')])
    expect(problem).toMatch(/larger than 100 MB/)
  })

  it('refuses two videos', () => {
    const a = fileOfSize(1024, 'a.mp4', 'video/mp4')
    const b = fileOfSize(1024, 'b.mp4', 'video/mp4')
    expect(videoProblem([a, b])).toMatch(/just one video/)
  })

  it.each(['image/svg+xml', 'application/octet-stream', 'text/html', ''])(
    'refuses a file declared as %j',
    (type) => {
      expect(videoProblem([fileOfSize(1024, 'x', type)])).toMatch(/Videos only/)
    },
  )
})

describe('MAX_SUBMISSION_BYTES', () => {
  it('leaves room for every photograph and the video at their caps', () => {
    expect(MAX_SUBMISSION_BYTES).toBeGreaterThan(
      MAX_MEMORY_PHOTOS * MAX_MEMORY_PHOTO_BYTES + MAX_MEMORY_VIDEO_BYTES,
    )
  })
})

describe('declaredSize', () => {
  it('passes a request within the ceiling', () => {
    expect(declaredSize(String(MAX_SUBMISSION_BYTES))).toBe('ok')
  })

  it('refuses a request declared over the ceiling', () => {
    expect(declaredSize(String(400 * 1024 * 1024))).toBe('too-large')
  })

  it('treats a missing header as absent, not as too large', () => {
    expect(declaredSize(null)).toBe('absent')
  })

  it('treats a header that is not a number as absent', () => {
    expect(declaredSize('lots')).toBe('absent')
    expect(declaredSize('-5')).toBe('absent')
  })
})
