## Why

A lot of what people have of Fiona from the last fifteen years is on their
phones as video, not as photographs — a speech, a toast, her laughing at
something off camera. The memory form only takes photographs, so the most vivid
thing someone has is the one thing they cannot send.

## What Changes

- The `/tell-fiona` form takes **one optional video** per memory, beside the
  existing six photographs, in plain view under the photographs field.
- Videos go through the **same `POST /submit-memory` endpoint** as everything
  else, as part of the same multipart post, so the form still works with no
  JavaScript and every existing layer still stands in front of the write.
- Accepted by exact mime type — `video/mp4`, `video/quicktime`, `video/webm` —
  and capped at **100 MB**, which is roughly a minute of 1080p from a phone.
  Over the cap gets a message in words, not a silent failure.
- **Stored as sent.** No transcoding, no poster generation, no new server
  dependency.
- A new **request-size ceiling** is checked from `Content-Length` before the
  body is parsed, so an oversized post is refused before the server buffers it.
- A new upload collection, **`memory-videos`**, separate from `memory-photos`
  and `media`, with a `video` upload field on `memories`.
- An approved memory with a video renders it on `/memories` in a native
  `<video controls>` element through a new **`PayloadVideo`** primitive. It is a
  server component; no new client JavaScript.
- `PayloadVideo` goes on `/design-system` with every state, in this change.

## Capabilities

### New Capabilities

- `memory-submission`: what a stranger may send with a memory and how the
  endpoint accepts or refuses it. Only the video requirements are written here;
  the existing photograph and text rules are unchanged and not restated.
- `memory-display`: how an approved memory is rendered on `/memories`. Only the
  video requirements are written here.

### Modified Capabilities

None. There are no main specs yet — `openspec/specs/` is empty.

## Impact

**This touches the memory submission path.** It is the only place a stranger
writes to this system, so here are its failure modes:

| Failure                                              | What it looks like                                       | What stops it                                                                                                            |
| ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Someone attaches a video over the cap                | Rejected without explanation                             | Checked on the client before sending, and again on the server with a message naming the size                             |
| A 400 MB clip is posted directly, bypassing the form | The server buffers it into memory before any check runs  | `Content-Length` ceiling checked before `request.formData()`                                                             |
| A browser reports a `.mov` with an empty or odd type | "Videos only, please" for a real iPhone video            | Verified against a real iPhone and Android file before shipping; the allow-list is widened if needed, never to `video/*` |
| A slow phone upload takes minutes                    | The person thinks it hung and leaves                     | The sending state says a video can take a minute or two                                                                  |
| The video uploads and the memory write fails         | An orphaned video with no memory                         | The same ordering as photographs: uploads first, memory last. An orphan is tidier than a broken memory                   |
| An HEVC `.mov` will not play in a given browser      | A player that shows an error on `/memories`              | Accepted. Alex sees it on approval and can hide it; see design.md                                                        |
| An empty file input for the video                    | "Videos only, please" on a submission that sent no video | `isAttachedPhoto` is renamed `isAttachedFile` and used for both fields, on both sides                                    |

**Cost.**

- One collection, one field, one migration, one primitive, one showcase entry,
  plus changes to `limits.ts`, the schema tests, the endpoint and the form. No
  new dependencies and nothing added to the client bundle beyond a few lines in
  `MemoryForm`.
- **Memory on the one replica.** `request.formData()` buffers the whole body and
  the write copies it again, so a 100 MB video costs roughly 200–300 MB of heap
  while it is being saved. The rate limit (5 per 10 minutes per address) bounds
  how many one person can start. Several people uploading at once could push the
  container past its memory limit. Named, not solved here — see design.md.
- **Storage.** A hundred guests each sending a 100 MB video is 10 GB in the
  bucket. Trivial on Railway's pricing; mentioned because the photo cap was
  12 MB and this is not.
- **Accessibility.** Guest videos arrive without captions. WCAG 1.2.2 asks for
  them on prerecorded video. The written memory beside the video carries its
  context. Captioning a hundred clips before the party is not realistic; it is
  recorded as a known limit.

**Not in scope:** more than one video per memory, upload progress bars,
transcoding, poster frames, direct-to-bucket uploads, video in the curated
gallery (`media` / `photographs`).
