## 1. Verify the assumptions this rests on

- [x] 1.1 Read the Railway service's memory limit from the dashboard; if under 1 GB, raise it or lower `MAX_MEMORY_VIDEO_BYTES` before going further, and record the figure in design.md
- [ ] 1.2 Record the `File.type` a real iPhone `.mov`, an Android `.mp4` and a `.mov` on Windows Chrome report in the browser, and confirm the allow-list covers all three
  - Open: needs the physical devices. Payload's own content sniffing was probed with ffmpeg-made files (HEVC and H.264 `.mov` → `video/quicktime`, `.mp4` → `video/mp4`, WebM → `video/webm`, 3GP-branded → `video/3gpp`, refused with the field error)

## 2. Rename the attachment predicate

- [x] 2.1 Rename `isAttachedPhoto` to `isAttachedFile` in `src/lib/memories/limits.ts`, the endpoint, `MemoryForm` and `limits.test.ts`, with no behaviour change; gate green

## 3. Limits and schema

- [x] 3.1 Add `MAX_MEMORY_VIDEO_BYTES`, `MAX_MEMORY_VIDEOS`, `ACCEPTED_MEMORY_VIDEO_TYPES`, `MEMORY_VIDEO_ACCEPT` and `MAX_SUBMISSION_BYTES` to `limits.ts`, with the video error messages exported from one place
- [x] 3.2 Tests: `MEMORY_VIDEO_ACCEPT` excludes any wildcard, `MAX_SUBMISSION_BYTES` is derived from the others, and `isAttachedFile` rejects an empty video part

## 4. Collection, field and migration

- [x] 4.1 Add `src/collections/MemoryVideos.ts` (`memory-videos`, optional `description`, access identical to `memory-photos`, exact mime list, no `imageSizes`) and register it in `payload.config.ts`
- [x] 4.2 Add `memory-videos` to `UPLOAD_COLLECTIONS`; add `IMAGE_UPLOAD_COLLECTIONS` and derive `uploadImagePatterns()` from it; extend `uploads.test.ts` so video collections cannot reach `localPatterns`
- [x] 4.3 Add the `video` upload field (`hasMany: false`) to `memories`
- [x] 4.4 `pnpm run generate:types`, generate the migration, confirm it only adds things (new table, nullable column) and commit both

## 5. Submission endpoint

- [x] 5.1 Add the `Content-Length` ceiling between the rate limit and the honeypot: 413 with a message over the ceiling, pass-and-log when absent
- [x] 5.2 Add the video checks after the photo checks: at most one, size, exact type, each returning a field error on `video`
- [x] 5.3 Write the video before the photographs and the memory, with the default `description`, and attach it to the memory; a Payload `ValidationError` on the video (content sniffing) becomes the `video` field error, not a 500
- [x] 5.4 Extract the pure checks (ceiling decision, video validation) so they are unit-testable, and test the failure modes: over the ceiling, missing header, two videos, 100 MB + 1 byte, `image/svg+xml`, `application/octet-stream`, the empty part
- [x] 5.5 Update the `not-sent` page copy to mention an oversized video
- [x] 5.6 Update the endpoint's layer comment and the submission-path table in AGENTS.md

## 6. The form

- [x] 6.1 Add the video `Field` under the photographs field in `MemoryForm`, outside the `<details>`, with the hint and derived `accept`
- [x] 6.2 Add the client pre-send checks using the shared limits and messages
- [x] 6.3 Add the "a video can take a minute or two" sending state when a video is attached
- [x] 6.4 Verify at 320px first, then wider; keyboard path; no-JS post with a video lands on `thank-you`; an oversized no-JS post lands on `not-sent`

## 7. Rendering

- [x] 7.1 Add `src/components/primitives/PayloadVideo.tsx` as a server component, with its `/design-system` entry showing landscape, portrait and the unresolved case, using two small sample clips in `public/showcase/`
- [x] 7.2 Render the video in `MemoryCard` after the photographs, only when resolved to a document
- [ ] 7.3 Verify on the running app: approve a memory with a video, confirm it appears after revalidation, plays in Safari (206 responses on the file route) and Chrome, shows a first frame on iOS, reserves its box, and downloads nothing but metadata before play
  - Verified locally: approval → appears; Range → 206; box reserved at 16:9; WebKit loads the HEVC `.mov` and shows a first frame (ranges `0-1`, then the file); Chromium plays WebM. Open: real Chrome on H.264/HEVC (Playwright's Chromium has no proprietary codecs) and a real iPhone

## 8. Close out

- [ ] 8.1 Test end to end against a real bucket (`S3_BUCKET` set): the video lands in the bucket, not on disk, and Range requests return 206 through `/api/memory-videos/file/…`
- [x] 8.2 `pnpm run ci:quality`, reporting the real result
- [x] 8.3 Sweep AGENTS.md: feature list (video on memories ✅, upload progress 🔵, transcoding 🔵), the fields paragraph, repo tree, the three-client-components line unchanged, the privacy known limit now covering videos, captions as a known limit, and the memory limit figure
