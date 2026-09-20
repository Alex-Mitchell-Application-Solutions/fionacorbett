import type { ReactNode } from 'react'

import { type ContainerWidth, containerClasses } from '@/styles/variants'

/**
 * The default is `wide`, the page's own axis — the one the logo, the hero and
 * every full-bleed band begin on.
 *
 * A narrower width is right for centred copy: `measure` for a paragraph or a
 * memory's body, `feature` for a single photograph shown on its own, `content`
 * for a centred brief. Those call sites pass it explicitly, because a band held
 * to a reading measure is opting out of the page's axis and should have to say
 * so.
 */
export function Container({
  width = 'wide',
  children,
  className,
}: {
  width?: ContainerWidth
  children: ReactNode
  className?: string
}) {
  return (
    <div className={[containerClasses(width), className].filter(Boolean).join(' ')}>{children}</div>
  )
}
