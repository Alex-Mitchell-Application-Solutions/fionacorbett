import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'

import { Arrow } from '@/components/primitives/Arrow'
import {
  type ButtonFace,
  type ButtonSize,
  type ButtonSurface,
  type ButtonVariant,
  type ButtonWeight,
  buttonClasses,
} from '@/styles/variants'

type CommonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Set by anything that owns a dark background, so contrast holds. */
  surface?: ButtonSurface
  /** The label's family. Serif for the hero's link and the home page's two
   * doorways, sans everywhere else. */
  face?: ButtonFace
  weight?: ButtonWeight
  children: ReactNode
  className?: string
}

type ButtonAsButton = CommonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & { href?: never }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & { href: string }

/**
 * Renders an <a> when given href, a <button> otherwise.
 *
 * Deliberately not an `as` prop: a link that looks like a button must still be a
 * link, so it opens in a new tab, shows its target on hover and behaves under
 * keyboard navigation the way a link is expected to.
 */
export function Button(props: ButtonAsButton | ButtonAsLink) {
  const {
    variant = 'primary',
    size = 'md',
    surface = 'default',
    face = 'sans',
    weight = 'light',
    children,
    className,
    ...rest
  } = props
  const classes = [buttonClasses(variant, size, surface, face, weight), className]
    .filter(Boolean)
    .join(' ')

  const content = (
    <>
      {children}
      {variant === 'link' ? <Arrow /> : null}
    </>
  )

  if ('href' in rest && typeof rest.href === 'string') {
    return (
      <a {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)} className={classes}>
        {content}
      </a>
    )
  }

  return (
    <button {...(rest as ButtonHTMLAttributes<HTMLButtonElement>)} className={classes}>
      {content}
    </button>
  )
}
