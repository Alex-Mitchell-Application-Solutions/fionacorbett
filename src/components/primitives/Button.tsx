import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode, Ref } from 'react'

import { Arrow } from '@/components/primitives/Arrow'
import {
  type ButtonFace,
  type ButtonSize,
  type ButtonSurface,
  type ButtonVariant,
  type ButtonWeight,
  buttonClasses,
  buttonWraps,
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
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof CommonProps> & {
    href?: never
    ref?: Ref<HTMLButtonElement>
  }

type ButtonAsLink = CommonProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof CommonProps> & {
    href: string
    /** A plain prop since React 19; spread onto the element with the rest. */
    ref?: Ref<HTMLAnchorElement>
  }

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

  const content = buttonWraps(variant, size) ? (
    <WrappingLabel>{children}</WrappingLabel>
  ) : (
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

/**
 * A label that may wrap, with the arrow set inline after its last word.
 *
 * The last word and the arrow are held together with `whitespace-nowrap`, so the
 * arrow can never be left alone at the start of a line. For a label that is not a
 * plain string there is no last word to find, and the arrow simply follows.
 */
function WrappingLabel({ children }: { children: ReactNode }) {
  const arrow = <Arrow className="ms-3 inline-block align-baseline" />

  if (typeof children !== 'string') {
    return (
      <>
        {children}
        {arrow}
      </>
    )
  }

  const cut = children.trimEnd().lastIndexOf(' ')
  const head = cut === -1 ? '' : children.slice(0, cut + 1)
  const last = cut === -1 ? children : children.slice(cut + 1)

  return (
    <>
      {head}
      <span className="whitespace-nowrap">
        {last}
        {arrow}
      </span>
    </>
  )
}
