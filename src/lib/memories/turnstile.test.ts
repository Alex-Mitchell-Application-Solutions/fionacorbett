import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { verifyHuman } from '@/lib/memories/turnstile'

/**
 * The configuration matrix, which is where this has actually gone wrong.
 *
 * Not the Cloudflare round trip — that needs a network and proves little. What
 * matters is which of the four key combinations proceeds, which refuses, and
 * crucially which one is reported as misconfiguration rather than as a bot.
 */

const SITE = 'NEXT_PUBLIC_TURNSTILE_SITE_KEY'
const SECRET = 'TURNSTILE_SECRET_KEY'
const ENV = 'SITE_ENV'

let saved: Record<string, string | undefined>

beforeEach(() => {
  saved = { [SITE]: process.env[SITE], [SECRET]: process.env[SECRET], [ENV]: process.env[ENV] }
  delete process.env[SITE]
  delete process.env[SECRET]
  process.env[ENV] = 'development'
})

afterEach(() => {
  for (const [key, value] of Object.entries(saved)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
})

describe('verifyHuman configuration', () => {
  it('skips when neither key is set, so a checkout runs without Cloudflare', () => {
    return expect(verifyHuman(null, '203.0.113.1')).resolves.toBe('skipped')
  })

  it('reports misconfiguration when only the secret is set', async () => {
    // The real bug: a mistyped PUBLIC_TURNSTILE_SITE_KEY left the site key
    // undefined, so the widget never rendered, no token was ever produced, and
    // every genuine submission was discarded as a bot.
    process.env[SECRET] = 'secret'
    await expect(verifyHuman(null, '203.0.113.1')).resolves.toBe('misconfigured')
  })

  it('reports misconfiguration when only the site key is set', async () => {
    // The mirror image: a widget that renders and a server that cannot verify
    // anything it produces.
    process.env[SITE] = 'site'
    await expect(verifyHuman('a-token', '203.0.113.1')).resolves.toBe('misconfigured')
  })

  it('does not call it misconfigured once both are set', async () => {
    process.env[SITE] = 'site'
    process.env[SECRET] = 'secret'
    // No token, both keys present: a genuine failure, not a configuration fault.
    await expect(verifyHuman(null, '203.0.113.1')).resolves.toBe('failed')
  })

  it('fails closed in production when neither key is set', async () => {
    process.env[ENV] = 'production'
    await expect(verifyHuman(null, '203.0.113.1')).resolves.toBe('failed')
  })

  it('checks configuration before the token, so a half-configured pair is never a bot', async () => {
    // Ordering matters: were the token checked first, the missing-site-key case
    // would return 'failed' and the endpoint would answer a silent 200.
    process.env[SECRET] = 'secret'
    await expect(verifyHuman(null, '203.0.113.1')).resolves.toBe('misconfigured')
    await expect(verifyHuman('a-token', '203.0.113.1')).resolves.toBe('misconfigured')
  })
})
