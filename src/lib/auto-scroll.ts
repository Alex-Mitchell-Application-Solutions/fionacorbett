/**
 * The gallery's slow auto-scroll, as a pure step function.
 *
 * The component calls this once a frame with the time since the last one and
 * applies the position it returns. Everything about pace and the pauses lives
 * here, so it is testable without a browser and the component is left holding
 * only a frame loop.
 *
 * Four phases:
 *
 *   top     resting at the top before setting off, when it starts there
 *   moving  down the page at a fixed pace
 *   end     resting at the bottom, so the last photographs are seen
 *   done    back at the top, finished: the component hands over to the
 *           slideshow, which hands back when it has played through
 */

/** A slow reading pace: a gallery row of about 500px takes ten seconds. */
export const AUTO_SCROLL_PX_PER_SECOND = 50
export const AUTO_SCROLL_END_HOLD_MS = 4000
export const AUTO_SCROLL_TOP_HOLD_MS = 3000
/**
 * The longest frame counted. A tab in the background stops animation frames;
 * coming back, the gap since the last one would otherwise be applied all at
 * once and the page would leap.
 */
export const AUTO_SCROLL_MAX_FRAME_MS = 100

export type AutoScrollState = {
  /** Fractional, unlike scrollY: at 50px a second most frames move under a pixel. */
  position: number
  phase: 'top' | 'moving' | 'end' | 'done'
  /** Time spent in the current hold. */
  heldMs: number
}

export function startAutoScroll(position: number): AutoScrollState {
  return { position: Math.max(0, position), phase: 'moving', heldMs: 0 }
}

/** From the top, resting there first: the start after the slideshow hands back. */
export function startAutoScrollFromTop(): AutoScrollState {
  return { position: 0, phase: 'top', heldMs: 0 }
}

/**
 * Advance by one frame.
 *
 * `maxPosition` is read fresh every frame, because the page grows under the
 * scroll as lazy images and late fonts arrive.
 */
export function stepAutoScroll(
  state: AutoScrollState,
  frameMs: number,
  maxPosition: number,
): AutoScrollState {
  const elapsed = Math.min(Math.max(frameMs, 0), AUTO_SCROLL_MAX_FRAME_MS)
  const max = Math.max(maxPosition, 0)

  switch (state.phase) {
    case 'moving': {
      const position = state.position + (AUTO_SCROLL_PX_PER_SECOND * elapsed) / 1000
      if (position >= max) return { position: max, phase: 'end', heldMs: 0 }
      return { position, phase: 'moving', heldMs: 0 }
    }
    case 'end': {
      const heldMs = state.heldMs + elapsed
      if (heldMs >= AUTO_SCROLL_END_HOLD_MS) return { position: 0, phase: 'done', heldMs: 0 }
      return { ...state, position: max, heldMs }
    }
    case 'top': {
      const heldMs = state.heldMs + elapsed
      if (heldMs >= AUTO_SCROLL_TOP_HOLD_MS) return { position: 0, phase: 'moving', heldMs: 0 }
      return { ...state, position: 0, heldMs }
    }
    case 'done':
      return state
  }
}
