import { describe, expect, it } from 'vitest'

import { GET } from '@/app/(frontend)/health/route'

describe('GET /health', () => {
  it('answers 200 so the container probe passes', async () => {
    const response = GET()
    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
  })
})
