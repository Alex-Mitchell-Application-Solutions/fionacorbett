import type { ReactNode } from 'react'

import { type EyebrowSize, type TextTone, eyebrowClasses } from '@/styles/variants'

/**
 * The small capitalised label above or below a heading.
 *
 * A <span> with `block`, not a heading tag: it names the section for a sighted
 * reader and would be noise in the document outline. Where the label genuinely
 * is the heading, use Heading with size 5 instead.
 */
export function Eyebrow({
  size = 'md',
  tone = 'subtle',
  children,
  className,
}: {
  size?: EyebrowSize
  tone?: TextTone
  children: ReactNode
  className?: string
}) {
  return (
    <span className={['block', eyebrowClasses(size, tone), className].filter(Boolean).join(' ')}>
      {children}
    </span>
  )
}
