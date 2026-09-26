import { Heading } from '@/components/primitives/Heading'
import { PayloadImage } from '@/components/primitives/PayloadImage'
import { PayloadVideo } from '@/components/primitives/PayloadVideo'
import { Rule } from '@/components/primitives/Rule'
import type { Memory } from '@/payload-types'

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

      <div className="prose-body max-w-measure whitespace-pre-line">{memory.body}</div>

      {photos.length > 0 ? (
        <ul
          className={[
            'mt-8 grid gap-4',
            // One photograph runs wider; several sit in a row. A lone image
            // stretched across a three-column grid looks like a mistake, and
            // three images at full width would push the next memory off screen.
            photos.length === 1 ? 'max-w-feature grid-cols-1' : 'grid-cols-2 sm:grid-cols-3',
          ].join(' ')}
        >
          {photos.map((photo) => (
            <li key={photo.id}>
              <PayloadImage
                media={photo}
                sizes={
                  photos.length === 1
                    ? '(width >= 56rem) 56rem, 92vw'
                    : '(width >= 40rem) 30vw, 45vw'
                }
                className="w-full rounded-sm bg-surface-sunken object-cover"
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
