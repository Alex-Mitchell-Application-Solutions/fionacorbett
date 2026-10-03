'use client'

import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/primitives/Button'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Text } from '@/components/primitives/Text'
import { startAutoScroll, startAutoScrollFromTop, stepAutoScroll } from '@/lib/auto-scroll'
import type { Slide } from '@/lib/gallery'

/**
 * The gallery, played, two ways:
 *
 *   - **A slideshow**: every photograph full screen in gallery order, moving on
 *     by itself after a pause Alex sets in site settings.
 *   - **A slow scroll** down /gallery as it is, which rests at the bottom and
 *     goes back to the top. The page itself.
 *
 * Whichever is started, the two then take turns for as long as nobody touches
 * anything, for a screen left running at the party: the slideshow, once it has
 * played its last photograph, closes and the scroll sets off from the top; the
 * scroll, once it has rested at the bottom, goes back up and the slideshow
 * opens on the first photograph. Closing the slideshow or touching the page
 * during the scroll ends it.
 *
 * One client component, the fourth on the site, rather than one each: both are
 * the same kind of thing — the gallery moving by itself — and the triggers sit
 * together. The slideshow holds an index, whether it is playing, and which
 * photographs have arrived; the scroll holds one boolean and a frame loop,
 * with its pacing in src/lib/auto-scroll.ts. The single-photograph routes are untouched and
 * remain how a photograph is linked to; this is a way of watching, not a second
 * way of addressing.
 *
 * The trigger is an anchor to the first photograph's page. With JavaScript it
 * opens the slideshow instead; without it, it still goes somewhere useful —
 * the first photograph, with "next" underneath — rather than being a button
 * that does nothing.
 *
 * A modal <dialog>, like the menu drawer, for the same reasons: focus trap,
 * inert page, Escape and the top layer come from the browser.
 *
 * WCAG 2.2.2: anything that moves by itself for more than five seconds needs a
 * way to pause it. In the slideshow, pause is the first control and takes focus
 * on opening. The scroll stops at any touch, click, wheel or key. It used to
 * show a "Stop scrolling" button as well; Alex had it removed, because on a
 * screen at the party it sat over the photographs, and any input already stops
 * the scroll.
 *
 * The scroll trigger is an anchor to the first decade, so without JavaScript it
 * still goes to the photographs.
 */
export function GalleryPlayback({
  slides,
  intervalMs,
  scrollStartHref,
}: {
  slides: Slide[]
  intervalMs: number
  /** The first decade's fragment: where the scroll link goes with no JavaScript. */
  scrollStartHref: string
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const pauseRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)
  // Set while the slideshow closes itself to hand over to the scroll, so the
  // close handler can tell that from someone closing it.
  const handingOver = useRef(false)

  // Where the scroll starts: from wherever the reader is when they ask for it,
  // or from the top, resting there first, when the slideshow hands over.
  const [scrolling, setScrolling] = useState<'here' | 'top' | null>(null)

  const [open, setOpen] = useState(false)
  const [playing, setPlaying] = useState(true)
  const [index, setIndex] = useState(0)
  // Ids, not indexes: an image keeps its element (and its load) as it moves
  // from "next" to "current", so it is only ever loaded once.
  const [settled, setSettled] = useState<ReadonlySet<number>>(() => new Set())

  const count = slides.length
  const current = slides[index]

  const step = useCallback(
    (by: number) => setIndex((at) => (count === 0 ? 0 : (at + by + count) % count)),
    [count],
  )

  // The clock. Re-armed on every change of photograph, so pressing next gives
  // the new one its full time rather than whatever was left of the old one's.
  // It does not start until the photograph has actually arrived: on a phone on
  // mobile data, five seconds can pass before a large scan has drawn at all.
  // The last photograph's time running out is the slideshow finishing: it
  // closes and hands over to the scroll rather than going round again.
  const currentReady = current ? settled.has(current.id) : false
  useEffect(() => {
    if (!open || !playing || !currentReady) return
    const last = index === count - 1
    const timer = window.setTimeout(() => {
      if (!last) return step(1)
      handingOver.current = true
      dialogRef.current?.close()
    }, intervalMs)
    return () => window.clearTimeout(timer)
  }, [open, playing, currentReady, count, index, intervalMs, step])

  const markSettled = useCallback((id: number) => {
    setSettled((previous) => (previous.has(id) ? previous : new Set(previous).add(id)))
  }, [])

  const showSlideshow = useCallback(() => {
    setIndex(0)
    setPlaying(true)
    setOpen(true)
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    pauseRef.current?.focus()
  }, [])

  const openSlideshow = useCallback(
    (event: MouseEvent<HTMLAnchorElement>) => {
      // Let a modified click through, so it still opens the first photograph in
      // a new tab the way any other link does.
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
      event.preventDefault()
      showSlideshow()
    },
    [showSlideshow],
  )

  const close = useCallback(() => dialogRef.current?.close(), [])

  const startScrolling = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()
    setScrolling('here')
  }, [])

  // The scroll. One frame loop, the position kept as a fraction because at 50px
  // a second most frames move less than a pixel and scrollY would round every
  // one of them to nothing. Any sign of the reader taking over stops it; the
  // scroll's own movement is not listened for, only input. Finished, back at
  // the top, it hands over to the slideshow.
  useEffect(() => {
    if (!scrolling) return

    let state = scrolling === 'top' ? startAutoScrollFromTop() : startAutoScroll(window.scrollY)
    let last = performance.now()
    let frame = requestAnimationFrame(function tick(now) {
      const max = document.documentElement.scrollHeight - window.innerHeight
      state = stepAutoScroll(state, now - last, max)
      last = now
      // instant, so a page with smooth scrolling set does not ease every frame.
      window.scrollTo({ top: state.position, behavior: 'instant' })
      if (state.phase === 'done') {
        setScrolling(null)
        showSlideshow()
        return
      }
      frame = requestAnimationFrame(tick)
    })

    const onInput = () => setScrolling(null)
    const inputs = ['wheel', 'touchstart', 'pointerdown', 'keydown'] as const
    for (const type of inputs) window.addEventListener(type, onInput, { passive: true })

    return () => {
      cancelAnimationFrame(frame)
      for (const type of inputs) window.removeEventListener(type, onInput)
    }
  }, [scrolling, showSlideshow])

  if (!current) return null

  // Only the photographs either side of the current one are in the document:
  // the next so it has loaded by the time it is shown, the previous so going
  // back is instant and so the one just left can fade out rather than vanish.
  // A Map on id, because with two photographs "previous" and "next" are the
  // same one.
  const windowed = new Map<number, Slide>()
  for (const offset of [-1, 0, 1]) {
    const slide = slides[(index + offset + count) % count]
    if (slide) windowed.set(slide.id, slide)
  }

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button
          ref={triggerRef}
          href={`/gallery/${current.id}`}
          onClick={openSlideshow}
          variant="secondary"
          surface="inverse"
          size="sm"
          aria-haspopup="dialog"
        >
          Play as a slideshow
        </Button>
        <Button
          href={scrollStartHref}
          onClick={startScrolling}
          variant="secondary"
          surface="inverse"
          size="sm"
        >
          Scroll through slowly
        </Button>
      </div>

      <dialog
        ref={dialogRef}
        aria-label="Slideshow of the photographs"
        className="gallery-slideshow"
        // Fires for Escape and for close(), so state and element cannot disagree.
        onClose={() => {
          setOpen(false)
          if (!handingOver.current) {
            triggerRef.current?.focus()
            return
          }
          // Played through: the scroll takes over from the top. Focus goes back
          // to the trigger without moving the page, which the scroll now owns.
          handingOver.current = false
          triggerRef.current?.focus({ preventScroll: true })
          window.scrollTo({ top: 0, behavior: 'instant' })
          setScrolling('top')
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight') step(1)
          else if (event.key === 'ArrowLeft') step(-1)
        }}
      >
        <div className="gutter flex items-center justify-between py-3">
          <p className="font-heading tracking-heading text-xs uppercase">
            {index + 1} of {count}
          </p>
          <Button variant="ghost" surface="inverse" size="sm" onClick={close}>
            Close
          </Button>
        </div>

        {open ? (
          <div
            className="gallery-slideshow-stage"
            onTouchStart={(event) => {
              touchStartX.current = event.changedTouches[0]?.clientX ?? null
            }}
            onTouchEnd={(event) => {
              const start = touchStartX.current
              const end = event.changedTouches[0]?.clientX
              touchStartX.current = null
              if (start === null || end === undefined) return
              // Far enough to be a swipe, not a wobble on a tap.
              if (end - start < -48) step(1)
              else if (end - start > 48) step(-1)
            }}
          >
            {[...windowed.values()].map((slide) => (
              <div
                key={slide.id}
                className="gallery-slideshow-slide"
                data-current={slide.id === current.id ? '' : undefined}
                aria-hidden={slide.id === current.id ? undefined : true}
              >
                {/* The same 4:5 crop as the gallery grid, as large as the
                    stage allows, so every photograph is the same size on
                    screen whatever its resolution or orientation. */}
                <div className="gallery-slideshow-frame">
                  <PayloadImage
                    media={slide.image}
                    sizes="100vw"
                    className="gallery-slideshow-image"
                    onSettled={() => markSettled(slide.id)}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="gallery-slideshow-stage" />
        )}

        <div className="gutter relative flex flex-col items-center gap-4 py-5 text-center">
          {/* Announced only when the reader is driving. While it plays, a
              title read out every few seconds talks over everything else. */}
          <p aria-live={playing ? 'off' : 'polite'} aria-atomic="true">
            <span className="title-face block text-xl">{current.title}</span>
            <span className="font-body block text-sm">{current.year}</span>
          </p>

          <div className="flex items-center gap-2">
            <Button variant="ghost" surface="inverse" size="sm" onClick={() => step(-1)}>
              Previous
            </Button>
            <Button
              ref={pauseRef}
              variant="secondary"
              surface="inverse"
              size="sm"
              onClick={() => setPlaying((was) => !was)}
              // The label changes, so it is not also a toggle: a pressed
              // "Pause" reads as paused when it means playing.
            >
              {playing ? 'Pause' : 'Play'}
            </Button>
            <Button variant="ghost" surface="inverse" size="sm" onClick={() => step(1)}>
              Next
            </Button>
          </div>

          {/* Where it came from, for anyone watching it on a screen at the
              party. Set as the footer sets it. On a phone it takes its own line
              under the controls, which would otherwise run into it; from md
              there is room in the corner. */}
          <Text
            tone="inverse"
            size="xl"
            className="opacity-dimmed self-start md:absolute md:bottom-5 md:left-gutter-lg"
          >
            fionacorbett.co.uk
          </Text>
        </div>
      </dialog>
    </>
  )
}
