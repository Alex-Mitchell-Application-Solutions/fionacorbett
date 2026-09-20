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
  className,
}: {
  tone?: 'default' | 'inverse'
  className?: string
}) {
  return (
    <span
      // Decorative, and announced by nothing: the heading above it already says
      // what the section is.
      aria-hidden="true"
      className={[
        'block h-px w-16',
        tone === 'inverse' ? 'bg-text-accent-inverse' : 'bg-brand-900',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    />
  )
}
