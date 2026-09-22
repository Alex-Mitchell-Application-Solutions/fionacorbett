import type { ComponentProps, Ref } from 'react'

/**
 * The menu button, and its two marks.
 *
 * Rendered twice: in the header, where it opens the drawer, and as the first
 * thing inside the drawer, where it closes it. The two land on the same spot, so
 * it reads as one control that changed. That is forced rather than chosen: a
 * modal <dialog> paints in the top layer, above everything whatever its z-index,
 * so a button in the header cannot appear over the drawer it opened.
 *
 * Colour is inherited, never set here: white over a hero in the header, ink
 * inside the drawer. Ported from luxury-gardens.
 */
function Bars(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      {...props}
    >
      <line x1="3" y1="7" x2="21" y2="7" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="17" x2="21" y2="17" />
    </svg>
  )
}

function Cross(props: ComponentProps<'svg'>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="square"
      aria-hidden="true"
      {...props}
    >
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  )
}

export function NavTrigger({
  action,
  expanded,
  controls,
  onClick,
  ref,
}: {
  action: 'open' | 'close'
  expanded: boolean
  controls: string
  onClick: () => void
  ref?: Ref<HTMLButtonElement>
}) {
  const Mark = action === 'open' ? Bars : Cross

  return (
    <button
      ref={ref}
      type="button"
      // Named for what it does, not for the mark, because the mark changes.
      aria-label={action === 'open' ? 'Open the menu' : 'Close the menu'}
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      // -mr-3 pulls the padding back out of the layout, so the 44px touch target
      // does not push the mark off the page's right-hand edge.
      className="-mr-3 inline-flex items-center p-3"
    >
      <Mark className="h-6 w-6" />
    </button>
  )
}
