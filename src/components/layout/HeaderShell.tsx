'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'

/**
 * Tracks whether the page has been scrolled away from the top, and nothing
 * else. All the appearance is in header.css, keyed off data-scrolled, so the
 * header's contents stay server-rendered.
 *
 * An IntersectionObserver on a zero-height sentinel rather than a scroll
 * listener: it reports the right state on arrival, so a reload part-way down
 * the page needs no separate first read. Ported from luxury-gardens.
 */
const SCROLL_THRESHOLD_PX = 150

export function HeaderShell({ children, className }: { children: ReactNode; className?: string }) {
  const [scrolled, setScrolled] = useState(false)
  const sentinel = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = sentinel.current
    if (!element) return

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry) setScrolled(!entry.isIntersecting)
      },
      // Growing the root upward keeps the sentinel "visible" until the reader
      // has scrolled this far.
      { rootMargin: `${SCROLL_THRESHOLD_PX}px 0px 0px 0px` },
    )

    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return (
    <>
      <div ref={sentinel} aria-hidden="true" />
      <header className={className} data-scrolled={scrolled ? 'true' : 'false'}>
        {children}
      </header>
    </>
  )
}
