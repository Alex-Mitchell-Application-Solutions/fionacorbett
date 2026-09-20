'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/primitives/Button'
import { Field } from '@/components/primitives/Field'
import { Heading } from '@/components/primitives/Heading'
import { Rule } from '@/components/primitives/Rule'
import { Text } from '@/components/primitives/Text'
import {
  MAX_MEMORY_PHOTOS,
  MAX_MEMORY_PHOTO_BYTES,
  MEMORY_PHOTO_ACCEPT,
  formatMegabytes,
  isAttachedPhoto,
} from '@/lib/memories/limits'
import {
  type MemoryFieldErrors,
  memorySubmissionSchema,
  toFieldErrors,
} from '@/lib/memories/schema'

/**
 * The memory form.
 *
 * **It works with no JavaScript at all, and that is the point of its shape.**
 *
 * The `<form>` has a real `action`, `method` and `encType`, so a browser that
 * runs none of this still posts to `/submit-memory` and is answered with a
 * redirect. The client code below is an enhancement: it validates before the
 * round trip, shows field errors in place, and swaps in a thank-you without a
 * navigation.
 *
 * This was not the original shape, and the difference mattered. The form used to
 * rely entirely on `onSubmit`, with no action — so any time hydration did not
 * happen, the browser fell back to its default, which is a GET to the current
 * URL. Every field ended up in the address bar, nothing was stored, and the page
 * appeared to simply reload. A dead dev server did it; so would a slow phone
 * where someone taps before the bundle lands, a bundle blocked by an extension,
 * or any error thrown earlier in the tree.
 *
 * A form whose only submit path is JavaScript has a single point of failure
 * between a person's memory of Fiona and the database. This one does not.
 * Modelled on luxury-gardens' consultation form, which is built the same way for
 * the same reason.
 *
 * The dwell token follows from that: one is rendered into the HTML so a no-JS
 * post carries a valid one, and the client replaces it with a fresher one on
 * mount. See the `dwellToken` prop and the effect below.
 *
 * There is no CAPTCHA. Turnstile was here and was removed; the reasoning is on
 * the endpoint, and the short version is that a moderation queue makes it
 * unnecessary and its failure modes were silent.
 *
 * The tone throughout is the point. Whoever is on this page was sent a link and
 * is doing a favour, possibly on a phone, possibly at seventy. Every message is
 * written to be read by them and not by a developer.
 */
export function MemoryForm({
  thanksMessage,
  dwellToken,
}: {
  thanksMessage: string
  /**
   * Minted on the server and rendered into a hidden input, so the form without
   * JavaScript posts a valid token.
   *
   * The page revalidates hourly to keep this fresh; the token's own window is
   * six hours, so a baked one is never close to expiring. It is shared by
   * everyone who loaded the page in that hour, which is weaker than a
   * per-visitor token — which is exactly why the client fetches its own and
   * overwrites this one whenever it can.
   */
  dwellToken: string
}) {
  const [fieldErrors, setFieldErrors] = useState<MemoryFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [state, setState] = useState<'editing' | 'sending' | 'sent'>('editing')
  const thanksRef = useRef<HTMLHeadingElement>(null)
  /**
   * The hidden token input, written to directly rather than held in state.
   *
   * It has to be a real input so the no-JS post carries it, and an uncontrolled
   * one so the server-rendered value survives when no script runs. Driving it
   * from state would mean React owning a value the form must have before React
   * exists.
   */
  const dwellRef = useRef<HTMLInputElement>(null)

  /**
   * Replace the baked-in token with a fresh, per-visitor one.
   *
   * Best-effort on purpose. If this fails — offline, blocked, server restarting
   * — the server-rendered token is still in the input and the form still works.
   * That is the whole reason it is written into the DOM rather than held in
   * state: the fallback has to survive this never running.
   *
   * `no-store` on both sides, because a token served from a cache is the same
   * timestamp for everyone who opened the form.
   */
  useEffect(() => {
    let cancelled = false

    async function mint() {
      try {
        const response = await fetch('/memory-token', { cache: 'no-store' })
        if (!response.ok) return
        const data: unknown = await response.json()
        if (cancelled || !dwellRef.current) return
        if (
          typeof data === 'object' &&
          data !== null &&
          typeof (data as { token?: unknown }).token === 'string'
        ) {
          dwellRef.current.value = (data as { token: string }).token
        }
      } catch {
        // Swallowed deliberately. The baked token remains and is valid.
      }
    }

    void mint()
    return () => {
      cancelled = true
    }
  }, [state])

  // Move focus to the confirmation once it replaces the form, so a screen reader
  // announces that something happened rather than leaving focus on a button
  // that no longer exists.
  useEffect(() => {
    if (state === 'sent') thanksRef.current?.focus()
  }, [state])

  if (state === 'sent') {
    return (
      /*
       * The confirmation.
       *
       * It links nowhere, and that is deliberate rather than unfinished. This
       * page is shared on its own while the rest of the site is being built, so
       * "read the others" would send someone to a page that is not ready — and
       * the moment just after someone has written something personal is the
       * worst moment to hand them a half-finished site.
       *
       * "Write another" is a button, not a link: it resets the form in place.
       * Several people do send more than one, and making them reload the page to
       * do it is how the second one does not get written.
       *
       * The heading takes focus because the form it replaced is gone. Without
       * that, a screen reader user is left on a submit button that no longer
       * exists and has no idea whether anything happened.
       */
      <div className="max-w-measure">
        <Rule />
        <Heading level={2} size={2} tabIndex={-1} ref={thanksRef} className="mt-6">
          Thank you
        </Heading>
        <Text size="lead" className="mt-5 whitespace-pre-line">
          {thanksMessage}
        </Text>
        <Text className="mt-6">You can close this page now — there is nothing else to do.</Text>
        <div className="mt-10">
          <Button
            variant="secondary"
            size="md"
            onClick={() => {
              setFieldErrors({})
              setFormError(null)
              setState('editing')
            }}
          >
            Write another
          </Button>
        </div>
      </div>
    )
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    setFormError(null)

    // Validate with the same schema the server uses, so nobody makes a round
    // trip to be told their name is missing.
    const parsed = memorySubmissionSchema.safeParse({
      fromName: data.get('fromName') ?? '',
      relationship: data.get('relationship') ?? '',
      title: data.get('title') ?? '',
      body: data.get('body') ?? '',
      email: data.get('email') ?? '',
    })

    if (!parsed.success) {
      setFieldErrors(toFieldErrors(parsed.error))
      return
    }

    // The same predicate the endpoint uses, so the client cannot accept what the
    // server rejects or vice versa.
    const realPhotos = data.getAll('photos').filter(isAttachedPhoto)

    if (realPhotos.length > MAX_MEMORY_PHOTOS) {
      setFieldErrors({ photos: `Please attach no more than ${MAX_MEMORY_PHOTOS} photographs.` })
      return
    }
    if (realPhotos.some((photo) => photo.size > MAX_MEMORY_PHOTO_BYTES)) {
      setFieldErrors({
        photos: `One of those is larger than ${formatMegabytes(MAX_MEMORY_PHOTO_BYTES)}. Please send a smaller version.`,
      })
      return
    }

    setFieldErrors({})
    setState('sending')

    try {
      const response = await fetch('/submit-memory', {
        method: 'POST',
        body: data,
        // What tells the endpoint to answer with JSON rather than a redirect.
        // A native post sends no such header and gets a 303 to a real page.
        headers: { accept: 'application/json' },
      })
      const result: unknown = await response.json()
      const payload = (typeof result === 'object' && result !== null ? result : {}) as {
        ok?: boolean
        fields?: MemoryFieldErrors
        message?: string
        expired?: boolean
      }

      if (payload.ok) {
        form.reset()
        setState('sent')
        return
      }

      setState('editing')
      if (payload.fields) setFieldErrors(payload.fields)
      setFormError(payload.message ?? 'That did not send. Please try again.')
    } catch {
      setState('editing')
      setFormError('That did not send — check your connection and try again.')
    }
  }

  return (
    <form
      /*
       * A real action, method and encType, so this posts without JavaScript.
       * `onSubmit` calls preventDefault and takes over when it can; when it
       * cannot, the browser does exactly what these three attributes say.
       *
       * encType is not optional here — the default is urlencoded, which cannot
       * carry a file, so photographs would silently not be sent.
       */
      action="/submit-memory"
      method="post"
      encType="multipart/form-data"
      onSubmit={handleSubmit}
      noValidate
      className="max-w-measure"
    >
      {/* Rendered by the server so a no-JS post carries a valid token; replaced
          with a per-visitor one by the effect above when script runs. */}
      <input ref={dwellRef} type="hidden" name="dwell" defaultValue={dwellToken} />

      {/*
        The honeypot.

        Named `website`, because that is a field name a form filler expects to
        find and will complete. Hidden from everyone who is not one: off-screen
        rather than display:none, since some bots skip what is not rendered;
        aria-hidden and tabIndex -1 so a screen reader never reaches it;
        autoComplete off so a browser does not helpfully fill it in and get a
        real person silently rejected.
      */}
      <div
        aria-hidden="true"
        className="absolute left-[-9999px] top-auto h-px w-px overflow-hidden"
      >
        <label htmlFor="website">Website</label>
        <input id="website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="flex flex-col gap-8">
        <Field name="fromName" label="Your name" required error={fieldErrors.fromName}>
          {(props) => <input {...props} type="text" autoComplete="name" maxLength={80} />}
        </Field>

        <Field
          name="relationship"
          label="How you know Fiona"
          hint="Her sister, next door at Elm Road, worked with her at the surgery — whatever fits."
          error={fieldErrors.relationship}
        >
          {(props) => <input {...props} type="text" maxLength={80} />}
        </Field>

        <Field name="title" label="Give it a title" error={fieldErrors.title}>
          {(props) => <input {...props} type="text" maxLength={120} />}
        </Field>

        <Field
          name="body"
          label="Your memory"
          required
          hint="A fond memory, something she did, or just what she means to you. However long you like."
          error={fieldErrors.body}
        >
          {(props) => (
            <textarea
              {...props}
              rows={10}
              maxLength={5000}
              className={`${props.className} min-h-56 resize-y`}
            />
          )}
        </Field>

        <Field
          name="photos"
          label="Photographs"
          hint={`Up to ${MAX_MEMORY_PHOTOS}, ${formatMegabytes(MAX_MEMORY_PHOTO_BYTES)} each. Straight from your phone is fine.`}
          error={fieldErrors.photos}
        >
          {(props) => (
            <input
              {...props}
              type="file"
              multiple
              accept={MEMORY_PHOTO_ACCEPT}
              // The recipe's padding is for a text input and leaves the file
              // button crowded against the border.
              className={`${props.className} px-3 py-2 file:mr-4 file:rounded-sm file:border file:border-line-control file:bg-surface-sunken file:px-4 file:py-2 file:text-sm file:text-text`}
            />
          )}
        </Field>

        <Field
          name="email"
          label="Your email"
          hint="Never shown on the site. Only so Alex can reply if he needs to."
          error={fieldErrors.email}
        >
          {(props) => <input {...props} type="email" autoComplete="email" />}
        </Field>
      </div>

      {formError ? (
        <p
          role="alert"
          className="mt-8 rounded-sm bg-danger-soft px-4 py-3 font-body text-sm text-danger"
        >
          {formError}
        </p>
      ) : null}

      <div className="mt-10">
        <Button type="submit" variant="primary" size="lg" disabled={state === 'sending'}>
          {state === 'sending' ? 'Sending…' : 'Send it'}
        </Button>
        <Text size="sm" className="mt-4">
          Alex reads everything before it goes up, so it will not appear straight away.
        </Text>
      </div>
    </form>
  )
}
