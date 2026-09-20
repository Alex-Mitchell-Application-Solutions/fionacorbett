import type { ReactNode, Ref } from 'react'

import {
  type HeadingFace,
  type HeadingSize,
  type HeadingWeight,
  defaultFaceFor,
  headingClasses,
} from '@/styles/variants'

type HeadingProps = {
  /** The tag. 1 to 4 only: 5 is a size, not a level. */
  level: 1 | 2 | 3 | 4
  /**
   * Visual size, when it must differ from the semantic level. Takes one value or
   * one per breakpoint, as `{ base, md }`.
   */
  size?: HeadingSize
  face?: HeadingFace
  /**
   * Bold for a heading that labels the content beneath it rather than making a
   * statement of its own. Light otherwise, which is every heading's default.
   */
  weight?: HeadingWeight
  children: ReactNode
  className?: string
  id?: string
  /**
   * -1 where a script moves focus to the heading — the memory form does this on
   * submission — so a screen reader announces where the reader has landed.
   */
  tabIndex?: -1
  /**
   * Paired with `tabIndex={-1}` by whatever needs to move focus here.
   *
   * A plain prop, not forwardRef: since React 19 a function component receives
   * `ref` like any other prop, and the wrapper forwardRef existed for is gone.
   */
  ref?: Ref<HTMLHeadingElement>
}

/**
 * `level` sets the tag and `size` sets the appearance, so the document outline
 * and the visual hierarchy can differ without resorting to a wrong heading tag.
 */
export function Heading({
  level,
  size,
  face,
  weight,
  children,
  className,
  id,
  tabIndex,
  ref,
}: HeadingProps) {
  const Tag = `h${level}` as const
  // The face follows the level unless a caller overrides it, so a level one is
  // set as written and a level two capitalised without either having to ask.
  const classes = [headingClasses(size ?? level, face ?? defaultFaceFor(level), weight), className]
    .filter(Boolean)
    .join(' ')

  return (
    <Tag className={classes} id={id} tabIndex={tabIndex} ref={ref}>
      {children}
    </Tag>
  )
}
