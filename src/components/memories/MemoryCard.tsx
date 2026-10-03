import { Heading } from '@/components/primitives/Heading'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { PayloadVideo } from '@/components/primitives/PayloadVideo'
import { Rule } from '@/components/primitives/Rule'
import type { Memory } from '@/payload-types'
import { buttonClasses } from '@/styles/variants'

/**
 * One memory, as it appears on /memories.
 *
 * The attribution is at the foot rather than the head, and that ordering is the
 * one deliberate thing here. A memory reads as a piece of writing that turns out
 * to be from someone, which is how a letter reads; putting the name first makes
 * it a list entry with a byline, which is how a comment section reads.
 *
 * The body is plain text with `whitespace-pre-line`. The field is a textarea and
 * never rich text — storing markup a stranger supplied would mean sanitising it
 * correctly forever — so this is the only thing keeping someone's paragraphs
 * from collapsing into one block. React escapes the content, so there is no
 * injection surface to close.
 *
 * A memory written in another language can carry a translation, added by Alex
 * in the admin. It sits behind a "See translation" control that swaps the text
 * in place and becomes "See original". A <details> rather than a button with
 * state: the browser does the toggling and announces it as expanded or
 * collapsed, so this stays a server component, adds no client JavaScript and
 * works with it turned off. The control sits above the text so it stays in one
 * place whichever version is showing. memory-card.css does the swap.
 */
export function MemoryCard({ memory }: { memory: Memory }) {
  const photos = (memory.photos ?? []).filter((photo) => typeof photo !== 'number')

  return (
    <article className="border-t border-line pt-10 first:border-t-0 first:pt-0">
      {memory.title ? (
        <Heading level={2} size={3} className="mb-5">
          {memory.title}
        </Heading>
      ) : null}

      {memory.translation ? (
        <details className="memory-translation">
          <summary className={buttonClasses('secondary', 'sm', 'default', 'sans', 'light')}>
            <span className="memory-translation-show">See translation</span>
            <span className="memory-translation-hide">See original</span>
          </summary>
          <div className="prose-body mt-6 max-w-measure whitespace-pre-line">
            {memory.translation}
          </div>
        </details>
      ) : null}

      <div
        className={[
          'memory-original prose-body max-w-measure whitespace-pre-line',
          memory.translation ? 'mt-6' : '',
        ].join(' ')}
      >
        {memory.body}
      </div>

      {photos.length > 0 ? (
        // Every photograph in the gallery's 4:5 crop, so a row lines up however
        // many there are and whatever shape each was taken in. On a phone a lone
        // photograph takes the full width, as it does in the gallery: half a
        // phone's width beside an empty column looks like something failed to load.
        <ul
          className={[
            'mt-8 grid gap-4 sm:grid-cols-3',
            photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
          ].join(' ')}
        >
          {photos.map((photo) => (
            <li key={photo.id}>
              <PayloadImage
                media={photo}
                sizes={
                  photos.length === 1
                    ? '(width >= 40rem) 30vw, 92vw'
                    : '(width >= 40rem) 30vw, 45vw'
                }
                className="aspect-[4/5] w-full rounded-sm bg-surface-sunken object-cover"
              />
            </li>
          ))}
        </ul>
      ) : null}

      {/* After the photographs and before the name: it belongs to the memory,
          and the attribution still closes it. PayloadVideo renders nothing for
          an unresolved id, so no check is needed here. */}
      <PayloadVideo
        video={memory.video}
        label={`Video from ${memory.fromName}`}
        className="mt-8 max-w-feature"
      />

      <footer className="mt-8">
        <Rule />
        <p className="title-face mt-4 text-lg text-text">{memory.fromName}</p>
        {memory.relationship ? (
          <p className="font-body text-sm text-text-subtle">{memory.relationship}</p>
        ) : null}
      </footer>
    </article>
  )
}
