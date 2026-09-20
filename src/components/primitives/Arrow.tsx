/**
 * The trailing arrow on a link-variant button.
 *
 * Part of the variant rather than the label. Leaving it to the caller means an
 * editor has to type it into the CMS, and the first one typed as a hyphen and a
 * chevron is the one that ships.
 *
 * currentColor throughout, so it inherits whatever tone the link is set in and
 * cannot go out of step with it on an inverse surface.
 */
export function Arrow({ className }: { className?: string }) {
  return (
    <svg
      // Decoration. The link's text already says where it goes, and an arrow
      // announced as "arrow" is noise in a screen reader.
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      className={['h-[0.7em] w-auto shrink-0', className].filter(Boolean).join(' ')}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  )
}
