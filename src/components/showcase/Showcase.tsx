import type { ReactNode } from 'react'

/**
 * The showcase's own furniture.
 *
 * Deliberately plain, and deliberately not built from the site's primitives. A
 * showcase that renders itself with the components it is displaying cannot show
 * you a broken one: the page breaks with it, and you lose the tool at exactly
 * the moment you need it. These use raw tags and a handful of tokens.
 */

export function Section({
  title,
  importPath,
  children,
}: {
  title: string
  /** Where the thing being shown actually lives, so it can be opened. */
  importPath: string
  children: ReactNode
}) {
  const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <section id={id} className="scroll-mt-header border-t border-line py-14">
      <h2 className="font-heading tracking-heading text-xl font-bold text-text">{title}</h2>
      <code className="mt-1 block font-mono text-xs text-text-subtle">{importPath}</code>
      <div className="mt-8 flex flex-col gap-10">{children}</div>
    </section>
  )
}

export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <h3 className="font-heading tracking-heading text-xs uppercase text-text-subtle">{label}</h3>
      <div className="mt-4 flex flex-wrap items-end gap-8">{children}</div>
    </div>
  )
}

export function Entry({ code, children }: { code: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div>{children}</div>
      <code className="font-mono text-2xs text-text-subtle">{code}</code>
    </div>
  )
}

/** A band that owns a dark ground, for checking the inverse variants. */
export function InverseEntry({ code, children }: { code: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="rounded-sm bg-surface-inverse p-6">{children}</div>
      <code className="font-mono text-2xs text-text-subtle">{code}</code>
    </div>
  )
}

/**
 * A token swatch.
 *
 * The class is passed as a complete literal string by every call site, never
 * built from the token name. Tailwind scans source text, so `bg-${name}`
 * produces no CSS at all and every swatch on the page comes out transparent.
 * This is the single most common way a showcase silently lies.
 */
export function Swatch({
  className,
  name,
  note,
}: {
  className: string
  name: string
  note?: string
}) {
  return (
    <div className="w-40">
      <div className={`h-16 w-full rounded-sm border border-line ${className}`} />
      <code className="mt-2 block font-mono text-2xs text-text">{name}</code>
      {note ? <span className="block font-body text-2xs text-text-subtle">{note}</span> : null}
    </div>
  )
}
