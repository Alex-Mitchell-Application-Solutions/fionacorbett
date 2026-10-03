/**
 * A short gold hairline, used to close a heading or separate a memory from the
 * one after it.
 *
 * Its own primitive rather than a border utility at the call site, because it is
 * the only place --color-brand-900 appears as ornament and it should look the
 * same in all of them. See tokens.css for why the ornament gold and the text
 * gold are two different values.
 */
export function Rule({
  tone = 'default',
  width = 'short',
  className,
}: {
  tone?: 'default' | 'inverse'
  /**
   * `short` is the hairline's own length. `fill` takes the width of whatever
   * holds it, so under a heading in a fit-content box it runs exactly as far
   * as the heading does. A prop rather than a width class at the call site,
   * so the element never carries two widths.
   */
  width?: 'short' | 'fill'
  className?: string
}) {
  return (
    <span
      // Decorative, and announced by nothing: the heading above it already says
      // what the section is.
      aria-hidden="true"
      className={[
        width === 'fill' ? 'block h-px w-full' : 'block h-px w-16',
        tone === 'inverse' ? 'bg-text-accent-inverse' : 'bg-brand-900',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
