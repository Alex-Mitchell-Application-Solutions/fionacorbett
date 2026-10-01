import { describe, expect, it } from 'vitest'

import {
  AUTO_SCROLL_END_HOLD_MS,
  AUTO_SCROLL_MAX_FRAME_MS,
  AUTO_SCROLL_PX_PER_SECOND,
  AUTO_SCROLL_TOP_HOLD_MS,
  type AutoScrollState,
  startAutoScroll,
  stepAutoScroll,
} from '@/lib/auto-scroll'

/** Run whole frames of 16ms until `done`, returning the state and frames taken. */
function run(
  state: AutoScrollState,
  max: number,
  done: (s: AutoScrollState) => boolean,
  limit = 100_000,
) {
  let frames = 0
  while (!done(state) && frames < limit) {
    state = stepAutoScroll(state, 16, max)
    frames += 1
  }
  return { state, frames }
}

describe('startAutoScroll', () => {
  it('starts moving from where the reader already is', () => {
    expect(startAutoScroll(1200)).toEqual({ position: 1200, phase: 'moving', heldMs: 0 })
  })

  it('never starts above the top', () => {
    // iOS reports a negative scrollY while rubber-banding.
    expect(startAutoScroll(-30).position).toBe(0)
  })
})

describe('stepAutoScroll', () => {
  it('moves at the stated pace, a fraction of a pixel at a time', () => {
    const after = stepAutoScroll(startAutoScroll(0), 16, 5000)
    expect(after.position).toBeCloseTo((AUTO_SCROLL_PX_PER_SECOND * 16) / 1000)
    expect(after.position).toBeLessThan(1)
  })

  it('covers a second of frames at the pace per second', () => {
    const { state } = run(startAutoScroll(0), 5000, (s) => s.heldMs === 0 && s.position >= 39.9, 70)
    expect(state.position).toBeCloseTo(AUTO_SCROLL_PX_PER_SECOND, 0)
  })

  it('stops at the bottom rather than overshooting it', () => {
    const after = stepAutoScroll({ position: 999.9, phase: 'moving', heldMs: 0 }, 16, 1000)
    expect(after).toEqual({ position: 1000, phase: 'end', heldMs: 0 })
  })

  it('rests at the bottom, then goes back to the top, rests, and sets off again', () => {
    let state: AutoScrollState = { position: 1000, phase: 'end', heldMs: 0 }

    const atEnd = run(state, 1000, (s) => s.phase !== 'end')
    expect(atEnd.frames * 16).toBeGreaterThanOrEqual(AUTO_SCROLL_END_HOLD_MS)
    expect(atEnd.state).toEqual({ position: 0, phase: 'top', heldMs: 0 })

    state = atEnd.state
    const atTop = run(state, 1000, (s) => s.phase !== 'top')
    expect(atTop.frames * 16).toBeGreaterThanOrEqual(AUTO_SCROLL_TOP_HOLD_MS)
    expect(atTop.state).toEqual({ position: 0, phase: 'moving', heldMs: 0 })
  })

  it('caps a long frame, so a tab coming back from the background does not leap', () => {
    const after = stepAutoScroll(startAutoScroll(0), 60_000, 100_000)
    expect(after.position).toBeCloseTo(
      (AUTO_SCROLL_PX_PER_SECOND * AUTO_SCROLL_MAX_FRAME_MS) / 1000,
    )
  })

  it('ignores a negative frame time', () => {
    expect(stepAutoScroll(startAutoScroll(10), -16, 1000).position).toBe(10)
  })

  it('follows the page as it grows under the scroll', () => {
    // A lazy image arriving below makes the page taller: the end moves away
    // and the scroll keeps going rather than stopping at the old bottom.
    const near = { position: 999, phase: 'moving' as const, heldMs: 0 }
    expect(stepAutoScroll(near, 16, 1600).phase).toBe('moving')
  })

  it('treats a page that fits on screen as already at the end', () => {
    expect(stepAutoScroll(startAutoScroll(0), 16, 0).phase).toBe('end')
    expect(stepAutoScroll(startAutoScroll(0), 16, -50).position).toBe(0)
  })
})
