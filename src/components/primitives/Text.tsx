import type { ElementType, ReactNode } from 'react'

import { type TextSize, type TextTone, textClasses } from '@/styles/variants'

/**
 * Body copy.
 *
 * `as` exists because the same treatment is wanted on a <p>, a <span> inside a
 * caption and a <div> wrapping rich text, and the tag is a semantic decision
 * rather than a visual one. It is not a styling escape hatch: the size and tone
 * axes are, and they are closed sets.
 */
export function Text({
  as: Tag = 'p',
  size = 'base',
  tone = 'muted',
  children,
  className,
  id,
}: {
  as?: ElementType
  size?: TextSize
  tone?: TextTone
  children: ReactNode
  className?: string
  id?: string
}) {
  return (
    <Tag className={[textClasses(size, tone), className].filter(Boolean).join(' ')} id={id}>
      {children}
    </Tag>
  )
}
