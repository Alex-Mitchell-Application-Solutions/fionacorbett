/**
 * Style recipes. One per primitive, defined exactly once.
 *
 * Pure functions returning class strings, so every build of a primitive imports
 * the same recipe and a variant cannot drift between them.
 *
 * Classes are written as complete literal strings on purpose. Tailwind scans
 * source text, so `bg-${tone}` produces no CSS at all. This bites every time.
 */

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'link'
/**
 * Which family the label takes.
 *
 * A prop rather than a class at the call site: the base recipe already sets a
 * family, and a second font-family utility beside it is resolved by stylesheet
 * order rather than by the order the two were written in.
 */
export type ButtonFace = 'sans' | 'serif'
export type ButtonSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl'
/** Which surface the control sits on. Contrast depends on it. */
export type ButtonSurface = 'default' | 'inverse'
export type ButtonWeight = 'light' | 'regular' | 'bold'

const BUTTON_BASE =
  'site-button inline-flex gap-3 rounded-sm border transition-colors ' +
  'duration-base ease-out disabled:pointer-events-none disabled:opacity-50'

/**
 * Every button stays on one line, except the home page's `2xl` links, which
 * wrap.
 *
 * A label like "Tell Fiona what she means to you" at display size is wider than
 * any screen, and on one line it ran off the page. Chosen here rather than by
 * passing `whitespace-normal` at the call site, because two whitespace utilities
 * on one element are resolved by stylesheet order, not by which was written last.
 */
const BUTTON_ONE_LINE = 'whitespace-nowrap items-center justify-center'
/*
 * `items-baseline`, not `items-center`: flex baseline alignment uses each item's
 * first baseline, so the arrow sits on the first line of a wrapped label, where
 * a reader's eye starts. Centred, it floated in the gap between the lines. No
 * offset to tune either — the arrow rests on the baseline like a character.
 */
const BUTTON_WRAPS = 'text-left text-balance items-baseline justify-start'

const BUTTON_WEIGHTS: Record<ButtonWeight, string> = {
  light: 'font-light',
  regular: 'font-normal',
  bold: 'font-bold',
}

const BUTTON_FACES: Record<ButtonFace, string> = {
  sans: 'font-heading tracking-heading',
  serif: 'title-face',
}

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-surface-inverse text-text-inverse border-surface-inverse hover:bg-brand-700 hover:border-brand-700',
  secondary: 'bg-transparent text-text border-line-control hover:bg-surface-accent',
  ghost: 'bg-transparent text-text border-transparent hover:bg-surface-sunken',
  // The quiet call to action: a text link with a trailing rule, used where a
  // filled button would shout. Still a Button rather than a bare anchor, so it
  // gets the same sizes, focus handling and disabled behaviour as every other
  // control on the site.
  link: 'bg-transparent text-text border-transparent underline underline-offset-4 decoration-line-strong hover:decoration-text',
}

/**
 * The same variants, restated for a dark background.
 *
 * Without these, `secondary` renders dark text on a transparent background over
 * an inverse band: unreadable until hover paints a light surface behind it. Any
 * block that owns a dark surface passes surface="inverse", so an illegible
 * combination is not reachable.
 */
const BUTTON_VARIANTS_INVERSE: Record<ButtonVariant, string> = {
  primary: 'bg-surface text-text border-surface hover:bg-brand-100 hover:border-brand-100',
  secondary: 'bg-transparent text-text-inverse border-text-inverse hover:bg-brand-700',
  ghost: 'bg-transparent text-text-inverse border-transparent hover:bg-brand-700',
  link: 'bg-transparent text-text-inverse border-transparent underline underline-offset-4 decoration-line-inverse hover:decoration-text-inverse',
}

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: 'text-xs px-4 py-2',
  md: 'text-sm px-6 py-3',
  lg: 'text-base px-8 py-4',
  xl: 'text-lg px-10 py-5',
  '2xl': 'text-xl px-12 py-6',
}

/**
 * A link button has no box, so it takes the vertical padding without the
 * horizontal — otherwise it sits out of alignment with the copy above it. The
 * vertical padding stays, because that is what holds the 44px touch target the
 * base layer requires.
 *
 * Its type also runs larger at the same size name, since there is no fill to
 * find it by.
 *
 * `2xl` is the home page's two doorways — "See the photographs" and "Tell Fiona
 * what she means to you" — which are the page's entire navigation and are sized as a statement
 * rather than as a control. It steps down twice on a phone: at --text-6xl a
 * 390px screen gets about four words a line, and two of these stacked would be
 * the whole first screen with no photograph left.
 */
const BUTTON_SIZES_LINK: Record<ButtonSize, string> = {
  sm: 'text-xs py-2',
  md: 'text-sm py-3',
  lg: 'text-base md:text-xl py-4',
  xl: 'text-lg md:text-2xl py-4',
  '2xl': 'text-3xl md:text-5xl lg:text-6xl py-5',
}

export function buttonClasses(
  variant: ButtonVariant,
  size: ButtonSize,
  surface: ButtonSurface = 'default',
  face: ButtonFace = 'sans',
  weight: ButtonWeight = 'light',
): string {
  const tones = surface === 'inverse' ? BUTTON_VARIANTS_INVERSE : BUTTON_VARIANTS
  const sizes = variant === 'link' ? BUTTON_SIZES_LINK : BUTTON_SIZES
  const wraps = variant === 'link' && size === '2xl'
  return [
    BUTTON_BASE,
    wraps ? BUTTON_WRAPS : BUTTON_ONE_LINE,
    BUTTON_FACES[face],
    BUTTON_WEIGHTS[weight],
    tones[variant],
    sizes[size],
  ].join(' ')
}

/**
 * 1 to 4 are the semantic heading levels. 5 is a size only: there is no h5 on
 * this site, and it exists so a level-2 heading can drop a step on a phone.
 */
export type HeadingLevel = 1 | 2 | 3 | 4 | 5
/** One size, or one per breakpoint. */
export type HeadingSize = HeadingLevel | { base: HeadingLevel; md: HeadingLevel }
export type HeadingFace = 'display' | 'title' | 'heading'
export type HeadingWeight = 'light' | 'regular' | 'bold'

/**
 * Three weights, and each one is a face already loaded.
 *
 * Lato ships 300, 400 and 700 — see fonts.css, which loads exactly the weights
 * used and no more. Nothing here costs a byte that was not already fetched.
 *
 * A `semibold` step is deliberately absent. CSS font matching resolves a
 * requested 600 upward to the 700 face, so it would render identically to bold
 * while claiming to be a distinct step, and an alias that looks like a decision
 * is worse than no step at all. A real one means shipping lato-600.woff2, about
 * 14 KB on the critical path, and nothing has asked for it.
 */
const HEADING_WEIGHTS: Record<HeadingWeight, string> = {
  light: 'font-light',
  regular: 'font-normal',
  bold: 'font-bold',
}

const HEADING_SIZES: Record<HeadingLevel, string> = {
  1: 'text-4xl',
  2: 'text-2xl',
  3: 'text-xl',
  4: 'text-lg',
  5: 'text-base',
}

/**
 * The same scale as a breakpoint variant, so a heading can take one size on a
 * phone and another from md.
 *
 * The type scale is already fluid, which handles most cases, but a clamp has a
 * floor: --text-2xl bottoms out at 24px, and there are titles here that will not
 * hold one line at 390px. Stepping down is the only way, and it belongs in this
 * file rather than as `text-lg md:text-2xl` at a call site: both are font-size
 * utilities in the same layer, so the winner would be decided by Tailwind's
 * stylesheet order rather than by the order they were written in.
 */
const HEADING_SIZES_MD: Record<HeadingLevel, string> = {
  1: 'md:text-4xl',
  2: 'md:text-2xl',
  3: 'md:text-xl',
  4: 'md:text-lg',
  5: 'md:text-base',
}

const HEADING_FACES: Record<HeadingFace, string> = {
  // The serif, capitalised. This is the level-two treatment.
  display: 'display-face',
  // The serif as authored. This is the level-one treatment.
  title: 'title-face',
  // The sans, for a heading that labels rather than states. The weight comes
  // from the weight axis rather than from here, so bold and light are the same
  // recipe with one value changed.
  heading: 'font-heading tracking-heading',
}

/**
 * The face a level takes when none is given.
 *
 * One rule decides it, and it is the rule the whole type system runs on: a
 * capitalised heading is the serif, everything else is the sans.
 *
 * Level one is the exception, and it is deliberate. On luxury-gardens a level
 * one takes the sans; here it takes the serif as authored, because every level
 * one on this site is either a person's name or the title of a photograph, and
 * both want the serif's lowercase rather than a sans statement.
 *
 * Expressed here rather than as a prop at every call site, because a face passed
 * per component drifts one component at a time, and the next heading someone
 * adds gets whichever family they happened to think of.
 */
const DEFAULT_FACES: Record<HeadingLevel, HeadingFace> = {
  1: 'title',
  2: 'display',
  3: 'heading',
  4: 'heading',
  5: 'heading',
}

export function defaultFaceFor(level: HeadingLevel): HeadingFace {
  return DEFAULT_FACES[level]
}

export function headingClasses(
  size: HeadingSize,
  face: HeadingFace,
  weight: HeadingWeight = 'light',
): string {
  const steps =
    typeof size === 'number'
      ? [HEADING_SIZES[size]]
      : [HEADING_SIZES[size.base], HEADING_SIZES_MD[size.md]]

  return ['text-balance', ...steps, HEADING_FACES[face], HEADING_WEIGHTS[weight]].join(' ')
}

export type TextSize = 'sm' | 'base' | 'lg' | 'lead'
export type TextTone = 'default' | 'muted' | 'subtle' | 'inverse' | 'accent' | 'danger'

const TEXT_SIZES: Record<TextSize, string> = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  lead: 'text-lead leading-relaxed',
}

/** Shared by Text and Eyebrow, so a tone means the same thing in both. */
const TEXT_TONES: Record<TextTone, string> = {
  default: 'text-text',
  muted: 'text-text-muted',
  subtle: 'text-text-subtle',
  inverse: 'text-text-inverse',
  // --color-text-accent, the darkened gold, not --color-brand-900. See the
  // comment on both in tokens.css: brand-900 fails 4.5:1 on two of our four
  // grounds and is for ornament.
  accent: 'text-text-accent',
  // A tone rather than a className override: passing `text-danger` alongside
  // Text's own tone class puts two colour utilities in the same layer, and
  // stylesheet order decides the winner rather than attribute order.
  danger: 'text-danger',
}

export function toneClasses(tone: TextTone): string {
  return TEXT_TONES[tone]
}

export function textClasses(size: TextSize, tone: TextTone): string {
  return ['font-body leading-normal', TEXT_SIZES[size], TEXT_TONES[tone]].join(' ')
}

/**
 * Named for the type scale step each one takes, so the prop and the token agree.
 * xl jumps past base and lg on the scale: it is the hero's, where the eyebrow
 * sits under a display heading and has to hold its own against it.
 */
export type EyebrowSize = 'sm' | 'md' | 'lg' | 'xl'

const EYEBROW_SIZES: Record<EyebrowSize, string> = {
  sm: 'text-2xs',
  md: 'text-xs',
  lg: 'text-sm',
  xl: 'text-xl',
}

export function eyebrowClasses(size: EyebrowSize, tone: TextTone): string {
  return ['eyebrow-face', EYEBROW_SIZES[size], TEXT_TONES[tone]].join(' ')
}

export type ContainerWidth = 'measure' | 'feature' | 'content' | 'wide' | 'full'

const CONTAINER_WIDTHS: Record<ContainerWidth, string> = {
  // max-w-measure, not max-w-prose: the latter is a Tailwind built-in fixed at
  // 65ch that a theme token cannot override. See --container-measure.
  measure: 'max-w-measure',
  feature: 'max-w-feature',
  content: 'max-w-content',
  wide: 'max-w-wide',
  full: 'max-w-none',
}

export function containerClasses(width: ContainerWidth): string {
  return ['mx-auto w-full gutter', CONTAINER_WIDTHS[width]].join(' ')
}

export type SectionTone = 'default' | 'sunken' | 'accent' | 'inverse'

const SECTION_TONES: Record<SectionTone, string> = {
  default: 'bg-surface text-text',
  sunken: 'bg-surface-sunken text-text',
  accent: 'bg-surface-accent text-text',
  inverse: 'bg-surface-inverse text-text-inverse',
}

export function sectionClasses(tone: SectionTone): string {
  return ['section-y', SECTION_TONES[tone]].join(' ')
}

export type FieldState = 'default' | 'invalid'

const FIELD_BASE =
  'block w-full rounded-sm border bg-surface-raised px-4 py-3 font-body text-base ' +
  'text-text transition-colors duration-base ease-out placeholder:text-text-subtle ' +
  'disabled:cursor-not-allowed disabled:opacity-50'

/**
 * The invalid state carries a tint as well as a border, and both are needed.
 *
 * A border alone is a colour difference, and a colour difference alone is not an
 * accessible signal — WCAG 1.4.1. The tint widens the area carrying it, the
 * message under the field states it in words, and aria-invalid states it to a
 * screen reader. Three channels, because the form is the one place on this site
 * where a person can be stopped from doing what they came to do.
 */
const FIELD_STATES: Record<FieldState, string> = {
  default: 'border-line-control hover:border-text-subtle focus:border-text',
  invalid: 'border-danger bg-danger-soft',
}

export function fieldClasses(state: FieldState): string {
  return [FIELD_BASE, FIELD_STATES[state]].join(' ')
}
