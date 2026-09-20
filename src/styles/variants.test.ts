import { describe, expect, it } from 'vitest'

import {
  type ButtonSize,
  type ButtonVariant,
  type ContainerWidth,
  type HeadingLevel,
  buttonClasses,
  containerClasses,
  defaultFaceFor,
  eyebrowClasses,
  fieldClasses,
  headingClasses,
  sectionClasses,
  textClasses,
} from '@/styles/variants'

/**
 * What these tests are actually for.
 *
 * Not "does the button have the right shade of brown" — that is a design
 * judgement and a test asserting it just restates the recipe. They cover the
 * three ways this file has a history of going wrong across projects:
 *
 *   1. **A variant emits two utilities from the same layer**, so Tailwind's
 *      stylesheet order decides the winner rather than the call site. Two
 *      font-size or two font-family classes on one element is the bug.
 *   2. **A class is built by interpolation somewhere**, which compiles to no CSS
 *      at all because Tailwind scans source text.
 *   3. **A variant is missing from a record**, so a legal prop combination
 *      returns `undefined` and renders unstyled.
 */

const VARIANTS: ButtonVariant[] = ['primary', 'secondary', 'ghost', 'link']
const SIZES: ButtonSize[] = ['sm', 'md', 'lg', 'xl', '2xl']
const LEVELS: HeadingLevel[] = [1, 2, 3, 4, 5]
const WIDTHS: ContainerWidth[] = ['measure', 'feature', 'content', 'wide', 'full']

/** Every base font-size utility, ignoring breakpoint-prefixed ones. */
function unprefixedTextSizes(classes: string): string[] {
  return classes
    .split(' ')
    .filter((c) => /^text-(3xs|2xs|xs|sm|base|lg|lead|xl|2xl|3xl|4xl|5xl|6xl)$/.test(c))
}

function fontFamilies(classes: string): string[] {
  return classes
    .split(' ')
    .filter(
      (c) =>
        c === 'font-body' || c === 'font-heading' || c === 'display-face' || c === 'title-face',
    )
}

function fontWeights(classes: string): string[] {
  return classes.split(' ').filter((c) => /^font-(light|normal|bold)$/.test(c))
}

describe('buttonClasses', () => {
  it('returns a class string for every variant and size', () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        const classes = buttonClasses(variant, size)
        expect(classes, `${variant}/${size}`).not.toContain('undefined')
        expect(classes.trim().length).toBeGreaterThan(0)
      }
    }
  })

  it('emits exactly one font-weight, on every combination', () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        expect(fontWeights(buttonClasses(variant, size)), `${variant}/${size}`).toHaveLength(1)
      }
    }
  })

  it('emits exactly one unprefixed font-size, on every combination', () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        expect(
          unprefixedTextSizes(buttonClasses(variant, size)),
          `${variant}/${size}`,
        ).toHaveLength(1)
      }
    }
  })

  it('emits exactly one font family, on every combination', () => {
    for (const variant of VARIANTS) {
      for (const size of SIZES) {
        for (const face of ['sans', 'serif'] as const) {
          expect(fontFamilies(buttonClasses(variant, size, 'default', face))).toHaveLength(1)
        }
      }
    }
  })

  it('gives the link variant no horizontal padding, so it aligns with the copy above it', () => {
    expect(buttonClasses('link', 'md')).not.toMatch(/\bpx-\d/)
    expect(buttonClasses('primary', 'md')).toMatch(/\bpx-\d/)
  })

  it('keeps vertical padding on the link variant, which is what holds the touch target', () => {
    expect(buttonClasses('link', 'md')).toMatch(/\bpy-\d/)
  })

  it('restates every variant for the inverse surface', () => {
    // Without the inverse table, `secondary` is dark text on a transparent
    // background over a dark band: invisible until hover paints something
    // behind it.
    for (const variant of VARIANTS) {
      const normal = buttonClasses(variant, 'md', 'default')
      const inverse = buttonClasses(variant, 'md', 'inverse')
      expect(inverse, variant).not.toBe(normal)
    }
  })
})

describe('headingClasses', () => {
  it('returns a class string for every level', () => {
    for (const level of LEVELS) {
      const classes = headingClasses(level, defaultFaceFor(level))
      expect(classes, String(level)).not.toContain('undefined')
    }
  })

  it('emits one unprefixed font-size for a single size', () => {
    for (const level of LEVELS) {
      expect(unprefixedTextSizes(headingClasses(level, 'heading'))).toHaveLength(1)
    }
  })

  it('emits one unprefixed and one md font-size for a responsive size', () => {
    // The reason the responsive step lives in the recipe rather than as
    // `text-lg md:text-2xl` at a call site: both are font-size utilities in the
    // same layer, and written by hand the winner is decided by stylesheet order.
    const classes = headingClasses({ base: 2, md: 1 }, 'title')
    expect(unprefixedTextSizes(classes)).toHaveLength(1)
    expect(classes.split(' ').filter((c) => c.startsWith('md:text-'))).toHaveLength(1)
  })

  it('emits exactly one font-weight', () => {
    for (const weight of ['light', 'regular', 'bold'] as const) {
      expect(fontWeights(headingClasses(2, 'display', weight))).toHaveLength(1)
    }
  })

  it('gives level one the serif as authored and level two the capitalised serif', () => {
    // The site's one typographic rule: a capitalised heading is the serif,
    // everything else is the sans. Level two is the capitalised one.
    expect(defaultFaceFor(1)).toBe('title')
    expect(defaultFaceFor(2)).toBe('display')
    expect(defaultFaceFor(3)).toBe('heading')
  })
})

describe('textClasses', () => {
  it('emits one tone and one size for every combination', () => {
    for (const size of ['sm', 'base', 'lg', 'lead'] as const) {
      for (const tone of ['default', 'muted', 'subtle', 'inverse', 'accent', 'danger'] as const) {
        const classes = textClasses(size, tone)
        expect(classes).not.toContain('undefined')
        expect(
          classes.split(' ').filter((c) => c.startsWith('text-text') || c === 'text-danger'),
        ).toHaveLength(1)
      }
    }
  })

  it('uses the accessible gold for accent text, not the ornament one', () => {
    // brand-900 fails 4.5:1 on two of the four grounds. text-text-accent is the
    // darkened value that clears it on all of them.
    expect(textClasses('base', 'accent')).toContain('text-text-accent')
    expect(textClasses('base', 'accent')).not.toContain('brand-900')
  })
})

describe('eyebrowClasses', () => {
  it('bundles the face and emits one size', () => {
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      const classes = eyebrowClasses(size, 'subtle')
      expect(classes).toContain('eyebrow-face')
      expect(unprefixedTextSizes(classes)).toHaveLength(1)
    }
  })
})

describe('containerClasses', () => {
  it('returns a max-width for every width', () => {
    for (const width of WIDTHS) {
      expect(containerClasses(width), width).not.toContain('undefined')
    }
  })

  it('uses max-w-measure rather than Tailwind built-in max-w-prose', () => {
    // max-w-prose is a built-in fixed at 65ch that a theme token does not
    // override. Using it would silently ignore --container-measure.
    expect(containerClasses('measure')).toContain('max-w-measure')
    expect(containerClasses('measure')).not.toContain('max-w-prose')
  })
})

describe('sectionClasses', () => {
  it('pairs a ground with a text colour for every tone', () => {
    for (const tone of ['default', 'sunken', 'accent', 'inverse'] as const) {
      const classes = sectionClasses(tone)
      expect(classes, tone).toMatch(/\bbg-/)
      expect(classes, tone).toMatch(/\btext-/)
    }
  })
})

describe('fieldClasses', () => {
  it('marks an invalid field with more than a border colour', () => {
    // A colour difference alone is not an accessible signal (WCAG 1.4.1). The
    // tint widens the area carrying it; the message and aria-invalid do the rest.
    const invalid = fieldClasses('invalid')
    expect(invalid).toContain('border-danger')
    expect(invalid).toContain('bg-danger-soft')
  })

  it('uses the control line weight by default, which is the one that clears 3:1', () => {
    expect(fieldClasses('default')).toContain('border-line-control')
  })
})

describe('no interpolated classes anywhere in the recipes', () => {
  it('never returns a class containing a template placeholder', () => {
    // Tailwind scans source text, so `bg-${tone}` produces no CSS at all. The
    // symptom is a component rendering completely unstyled, with nothing in the
    // output to say why.
    const everything = [
      ...VARIANTS.flatMap((v) => SIZES.map((s) => buttonClasses(v, s))),
      ...LEVELS.map((l) => headingClasses(l, defaultFaceFor(l))),
      ...WIDTHS.map(containerClasses),
      fieldClasses('default'),
      fieldClasses('invalid'),
    ]

    for (const classes of everything) {
      expect(classes).not.toMatch(/[${}]/)
    }
  })
})
