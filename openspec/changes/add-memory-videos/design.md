## Context

Observed in the code today:

- `POST /submit-memory` (`src/app/(frontend)/submit-memory/route.ts`) calls
  `request.formData()` and then `Buffer.from(await photo.arrayBuffer())` per
  file before `payload.create`. Everything is held in memory. At 12 MB per
  photograph that has never mattered.
- There is no `proxy.ts`, so Next's `proxyClientMaxBodySize` (default 10 MB)
  does not apply to this route. Route handlers have no body cap of their own.
- Payload's file endpoint handles `Range` requests on both paths: the disk
  fallback (`payload/dist/uploads/endpoints/getFile.js`, `parseRangeHeader`) and
  S3 (`@payloadcms/storage-s3/dist/getFile.js`, `getRangeRequestInfo`). Safari
  will not play a `<video>` without 206 responses, so this is what makes serving
  video through `/api/<slug>/file/…` viable at all. Still to verify on the
  deployed bucket, not only by reading the code.
- `UPLOAD_COLLECTIONS` in `src/lib/uploads.ts` feeds three things: the storage
  plugin, `images.localPatterns`, and `uploads.test.ts`.
- `isAttachedPhoto` in `limits.ts` is the one predicate for "is this a real
  file" and it is not photo-specific.
- Railway runs one replica. Its memory limit is not in `.railway/railway.ts`;
  read with `railway metrics --memory` on 26 September 2026 it is **24 GB**,
  with a 7-day average of 99 MB and a peak of 224 MB.

Decided with Alex before this proposal: same endpoint with a cap, stored as
sent, one video per memory.

## Goals / Non-Goals

**Goals:**

- A person can attach one phone video to a memory, with or without JavaScript.
- Every existing layer on the submission path still runs in front of it, in the
  same order.
- An approved video plays on `/memories` on current iOS Safari and Chrome on
  Android, with no new client JavaScript.

**Non-Goals:**

- Transcoding, poster frames, adaptive streaming.
- Upload progress. `fetch` has no upload progress event; getting it means
  swapping to `XMLHttpRequest` in `MemoryForm`. Backlog.
- Video in the curated gallery.
- Captions.

## Decisions

### A third upload collection, `memory-videos`

Not a widened `memory-photos`. That collection has `imageSizes`, a photograph
alt default, and a mime list the whole codebase reads as "photographs". Putting
video in it would make every one of those conditional. The reason `media` and
`memory-photos` are split applies again here: each collection is governed by one
rule.

Fields: `description` (text, optional, admin-editable, used as the accessible
name when set). Access identical to `memory-photos`: public read, signed-in
create, update and delete. `upload.mimeTypes` from `ACCEPTED_MEMORY_VIDEO_TYPES`.
No `imageSizes`.

`memories` gains `video`: `type: 'upload'`, `relationTo: 'memory-videos'`,
`hasMany: false`. The migration only adds things: a table and a nullable
foreign-key column.

### `UPLOAD_COLLECTIONS` grows, and the image allow-list gets a subset

`memory-videos` joins `UPLOAD_COLLECTIONS` so the storage plugin sends it to the
bucket. Leave it out and videos land on the container disk and vanish on the
next deploy.

It does **not** join `images.localPatterns`: feeding video paths to the image
optimiser only widens its surface. `uploads.ts` gains `IMAGE_UPLOAD_COLLECTIONS`
(`media`, `memory-photos`), and `uploadImagePatterns()` maps that list.
`uploads.test.ts` gets a second assertion: every image collection is also an
upload collection, and `memory-videos` is not an image collection.

### Limits in `limits.ts`, predicate renamed

```ts
export const MAX_MEMORY_VIDEO_BYTES = 100 * 1024 * 1024
export const MAX_MEMORY_VIDEOS = 1
export const ACCEPTED_MEMORY_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const
export const MEMORY_VIDEO_ACCEPT = ACCEPTED_MEMORY_VIDEO_TYPES.join(',')
export const MAX_SUBMISSION_BYTES =
  MAX_MEMORY_PHOTOS * MAX_MEMORY_PHOTO_BYTES + MAX_MEMORY_VIDEO_BYTES + 1024 * 1024
```

`isAttachedPhoto` becomes `isAttachedFile`. It is the same function under a name
that fits both callers, and the existing tests move with it. The rename is
mechanical, done in its own task so the rest of the diff is not noise.

**100 MB** because it covers roughly 60–90 s of 1080p or 20–30 s of 4K from a
current phone. That is the length of a toast or a speech excerpt. It also keeps
the worst-case heap cost of one request in the low hundreds of MB.

### `Content-Length` ceiling before `formData()`

A new check sits between the rate limit and the honeypot. If `Content-Length`
is present and greater than `MAX_SUBMISSION_BYTES`, the endpoint returns a 413
through `reply.failed` and never parses the body.

When the header is absent it lets the request through and logs that. This check
guards resources; it does not decide whether the submission is genuine, and
every per-file limit still applies after parsing. Rejecting on absence would
mean refusing a real person's memory whenever some intermediary re-chunks the
body. Browsers always send the header for a `FormData` body, native or fetched,
so absence is either a bot or a proxy, and the per-file checks cover both.

The native (no-JS) reply for 413 goes to `/tell-fiona/not-sent`. That page's
copy gains a line about large videos, so someone who hits the cap without
JavaScript learns why.

### Endpoint order

```
1   rate limit
1a  Content-Length ceiling           new
2   honeypot
3   dwell token
4   schema
5   photo checks                     unchanged
5a  video checks: count ≤ 1, size, exact type   new
6   write: video, then photos, then the memory
```

The video is written first, then the photographs, then the memory. A memory
must still never reference an upload that failed. Video goes first because of
something found during implementation: Payload sniffs every upload's bytes
(`checkFileRestrictions`, via `file-type`) and throws a `ValidationError` when
the content is not on the collection's list. Probed with ffmpeg-made clips,
HEVC and H.264 `.mov` are detected as `video/quicktime`, `.mp4` as `video/mp4`
and WebM as `video/webm`. A 3GP-branded file labelled `.mp4` is detected as
`video/3gpp` and refused. Writing the video first means that refusal orphans
no photographs. The endpoint catches that one error type and returns the same
`video` field error the form's own check gives, so the person doesn't get a
generic "something went wrong".

The default `description` is "A video shared by <fromName>". That is a name in
a stored field, not in a log.

### `PayloadVideo`, a server-rendered primitive

`src/components/primitives/PayloadVideo.tsx`, the sibling of `PayloadImage`:

```tsx
<video
  controls
  playsInline
  preload="metadata"
  src={`${doc.url}#t=0.001`}
  aria-label={label}
  className="aspect-video w-full rounded-sm bg-surface-sunken object-contain"
/>
```

- **No `'use client'`.** A `<video>` element needs no hydration, so the "three
  client components" rule holds.
- **`#t=0.001`** makes iOS Safari decode and show the first frame. Without it,
  `preload="metadata"` shows a black box on iOS and there is no poster to fall
  back on.
- **Fixed `aspect-video` box with `object-contain`.** We don't know the
  dimensions: Payload records none for non-images, and reading them means either
  ffprobe (rejected with transcoding) or parsing the MP4 `tkhd` box together
  with iPhone's rotation matrix, which is too error-prone to justify. So the box
  is reserved at 16:9 and a portrait clip is pillarboxed on the sunken surface.
  Nothing shifts, and a portrait clip displays smaller than it could. Both
  tokens used here already exist.
- **Accessible name:** the video's `description` if Alex has set one, otherwise
  "Video from <fromName>".
- Focus ring comes from `base.css`. Verify it shows on the `<video>` element in
  Safari and Chrome, where native controls sometimes swallow it.

On `/design-system` it shows: a landscape clip, a portrait clip (pillarboxed),
and the "unresolved id renders nothing" case described in words. Two short
sample clips of a few hundred KB each go in `public/showcase/`. They are not
Fiona and not a guest's upload.

### `MemoryCard`

After the photographs `<ul>` and before the `<footer>`:
`memory.video && typeof memory.video !== 'number' ? <PayloadVideo … /> : null`.
The width is `max-w-feature`, the same as a single photograph.

### `MemoryForm`

- A second `Field`, `name="video"`, `type="file"`, no `multiple`,
  `accept={MEMORY_VIDEO_ACCEPT}`. The hint reads "One short video, up to
  100 MB. About a minute from a phone." It sits directly under the photographs
  field and outside the `<details>`, for the same reason the photographs do.
- The same pre-send checks as photographs: at most one attached file, under the
  cap, of an accepted type. Error messages match the server's word for word and
  are imported from one place.
- The sending state: when a video is attached, the button label and live region
  say "Sending — a video can take a minute or two." A person on mobile data then
  knows the page has not hung.
- The `fieldErrors` type gains `video`, which falls out of `MemoryFieldErrors`.

## Risks / Trade-offs

- **HEVC playback outside Apple.** An iPhone `.mov` is usually HEVC. Chrome
  plays HEVC where the device can decode it in hardware, which covers most
  phones and computers from the last few years but not all. → Accepted: storing
  as sent was the explicit choice. Alex previews every video at approval in the
  admin, and can hide a memory's video by clearing the field. If this turns out
  to matter, the change is transcoding, a separate proposal.
- **Heap pressure on one replica.** Three people uploading 100 MB each at the
  same moment is roughly 600–900 MB. → The service limit is 24 GB, so this is
  comfortable. Buffers live outside V8's old space, so Node's heap flag is not
  the constraint. Streaming the multipart body straight to S3 is the real fix if
  the cap ever rises by an order of magnitude.
- **Upload time on mobile data.** 100 MB at a 5 Mbps uplink is under three
  minutes, which is within Railway's request timeout but long enough to look
  broken. → Addressed by the sending-state copy. A progress bar is backlog.
- **Bucket growth from abuse.** A bot that passes every layer can store 100 MB
  per accepted request. → The rate limit and dwell token already make this
  slow. Moderation does not stop storage, so orphaned and rejected videos are
  deleted in the admin. Accepted.
- **Videos on a pending memory are fetchable by URL.** This is the same known
  limit as `memory-photos`, now covering video. → The privacy section of
  AGENTS.md is updated to say so, rather than leaving it implied.
- **No captions.** → Recorded as a known limit in AGENTS.md. `description` gives
  Alex somewhere to summarise a clip if he wants to.

## Migration Plan

One generated migration: create `memory_videos` and add a nullable `video_id` to
`memories`. It only adds things, so the old container runs happily against the
new schema during the deploy. `pnpm run generate:types` output is committed.
Rollback means reverting the code. The unused table and column are harmless and
are dropped in a later deploy if ever needed.

## Open Questions

- Whether Windows Chrome reports a `.mov` as `video/quicktime` or as an empty
  type. If it is empty, a real person's video is refused. Verify with a real
  file before shipping. The allow-list does not widen to accept an empty type.
