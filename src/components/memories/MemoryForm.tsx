'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/primitives/Button'
import { Field } from '@/components/primitives/Field'
import { Heading } from '@/components/primitives/Heading'
import { Text } from '@/components/primitives/Text'
import {
  MAX_MEMORY_PHOTOS,
  MAX_MEMORY_PHOTO_BYTES,
  MEMORY_PHOTO_ACCEPT,
  formatMegabytes,
} from '@/lib/memories/limits'
import {
  type MemoryFieldErrors,
  memorySubmissionSchema,
  toFieldErrors,
} from '@/lib/memories/schema'

/**
 * The memory form.
 *
 * A client component, and the only one on the site. Everything else is server
 * rendered; this needs state for the dwell token, the field errors and the
 * success view.
 *
 * It is a real <form> with real inputs, posting FormData. That means the browser
 * does the file picking, the required-field focus and the submit, and the
 * JavaScript only enhances it. The one thing that genuinely needs script is the
 * dwell token — which is a bot check, so a submission without it being fetched
 * is one the server would reject anyway.
 *
 * The tone throughout is the point. Whoever is on this page was sent a link and
 * is doing a favour, possibly on a phone, possibly at seventy. Every message is
 * written to be read by them and not by a developer.
 */
export function MemoryForm({
  thanksMessage,
  turnstileSiteKey,
}: {
  thanksMessage: string
  /** Absent in development. The widget renders only when there is a key. */
  turnstileSiteKey: string | null
}) {
  const [dwell, setDwell] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<MemoryFieldErrors>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [state, setState] = useState<'editing' | 'sending' | 'sent'>('editing')
  const thanksRef = useRef<HTMLHeadingElement>(null)

  /**
   * Fetch a token on mount, and again after a successful send.
   *
   * `no-store` on both sides: the route sets it and this asks for it, because a
   * token served from a cache is the same timestamp for everyone who opens the
   * form.
   */
  useEffect(() => {
    let cancelled = false

    async function mint() {
      try {
        const response = await fetch('/memory-token', { cache: 'no-store' })
        if (!response.ok) return
        const data: unknown = await response.json()
        if (cancelled) return
        if (
          typeof data === 'object' &&
          data !== null &&
          typeof (data as { token?: unknown }).token === 'string'
        ) {
          setDwell((data as { token: string }).token)
        }
      } catch {
        // Swallowed on purpose. A failed mint leaves the token null, the submit
        // below tells the person to reload, and there is nothing useful to say
        // about it at this moment.
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
      <div className="max-w-measure">
        <Heading level={2} size={3} tabIndex={-1} ref={thanksRef}>
          Thank you
        </Heading>
        <Text size="lead" className="mt-5 whitespace-pre-line">
          {thanksMessage}
        </Text>
        <div className="mt-8 flex flex-wrap gap-8">
          <Button href="/memories" variant="link" size="md">
            Read the others
          </Button>
          <Button
            variant="link"
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

    const photos = data.getAll('photos').filter((entry): entry is File => entry instanceof File)
    const realPhotos = photos.filter((photo) => photo.size > 0)

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

    if (!dwell) {
      setFormError('Please reload the page and try again — something did not load properly.')
      return
    }

    setFieldErrors({})
    setState('sending')
    data.set('dwell', dwell)

    try {
      const response = await fetch('/submit-memory', { method: 'POST', body: data })
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
      // An expired token is recoverable: the effect above mints a fresh one and
      // everything they typed is still on screen, so sending again works.
      if (payload.expired) setDwell(null)
      setFormError(payload.message ?? 'That did not send. Please try again.')
    } catch {
      setState('editing')
      setFormError('That did not send — check your connection and try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="max-w-measure">
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

      {turnstileSiteKey ? (
        <>
          <div className="mt-8 cf-turnstile" data-sitekey={turnstileSiteKey} data-theme="light" />
          <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />
        </>
      ) : null}

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
          Alex reads everything before it goes on the site, so it will not appear straight away.
        </Text>
      </div>
    </form>
  )
}
