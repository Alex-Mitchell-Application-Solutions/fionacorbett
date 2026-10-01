'use client'

import { type MouseEvent, useCallback, useEffect, useRef, useState } from 'react'

import { Button } from '@/components/primitives/Button'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { Text } from '@/components/primitives/Text'
import type { Slide } from '@/lib/gallery'

/**
 * The gallery, played: every photograph full screen in gallery order, moving on
 * by itself after a pause Alex sets in site settings.
 *
 * A client component, the fourth on the site, because nothing else can move on
 * a timer. What it holds is an index, whether it is playing, and which
 * photographs have arrived. The single-photograph routes are untouched and
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
 * way to pause it. Pause is the first control and takes focus on opening.
 */
export function GallerySlideshow({ slides, intervalMs }: { slides: Slide[]; intervalMs: number }) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggerRef = useRef<HTMLAnchorElement>(null)
  const pauseRef = useRef<HTMLButtonElement>(null)
  const touchStartX = useRef<number | null>(null)

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
  const currentReady = current ? settled.has(current.id) : false
  useEffect(() => {
    if (!open || !playing || !currentReady || count < 2) return
    const timer = window.setTimeout(() => step(1), intervalMs)
    return () => window.clearTimeout(timer)
  }, [open, playing, currentReady, count, index, intervalMs, step])

  const markSettled = useCallback((id: number) => {
    setSettled((previous) => (previous.has(id) ? previous : new Set(previous).add(id)))
  }, [])

  const openSlideshow = useCallback((event: MouseEvent<HTMLAnchorElement>) => {
    // Let a modified click through, so it still opens the first photograph in
    // a new tab the way any other link does.
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    event.preventDefault()

    setIndex(0)
    setPlaying(true)
    setOpen(true)
    const dialog = dialogRef.current
    if (dialog && !dialog.open) dialog.showModal()
    pauseRef.current?.focus()
  }, [])

  const close = useCallback(() => dialogRef.current?.close(), [])

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

      <dialog
        ref={dialogRef}
        aria-label="Slideshow of the photographs"
        className="gallery-slideshow"
        // Fires for Escape and for close(), so state and element cannot disagree.
        onClose={() => {
          setOpen(false)
          triggerRef.current?.focus()
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
            size="sm"
            className="opacity-dimmed self-start md:absolute md:bottom-5 md:left-gutter-lg"
          >
            fionacorbett.co.uk
          </Text>
        </div>
      </dialog>
    </>
  )
}
