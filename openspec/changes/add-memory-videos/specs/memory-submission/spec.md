## ADDED Requirements

### Requirement: A memory may carry one optional video

The `/tell-fiona` form SHALL offer a single optional video input, in plain view
beneath the photographs input, whose `accept` attribute is derived from the
accepted video types. A memory SHALL carry at most one video. Sending no video
SHALL be exactly as valid as sending one.

#### Scenario: Submission with a video

- **WHEN** a visitor submits a valid memory with one MP4 video of 40 MB
- **THEN** the video is stored in `memory-videos`, the memory is stored as
  `pending` with that video attached, and the visitor sees the thank-you state

#### Scenario: Submission with no video

- **WHEN** a visitor submits a valid memory and leaves the video input empty, so
  the browser sends an empty part with no name, no bytes and no content type
- **THEN** the submission is accepted and the memory has no video

#### Scenario: More than one video in the request

- **WHEN** a request carries two non-empty `video` parts
- **THEN** it is rejected with a field error on `video` and nothing is stored

### Requirement: Videos are accepted by exact type and a size cap

The endpoint SHALL accept a video only when its declared type is one of
`video/mp4`, `video/quicktime` or `video/webm`, and its size is no more than the
video cap (100 MB). A wildcard such as `video/*` SHALL NOT be used. The client
SHALL apply the same type list and cap, imported from `src/lib/memories/limits.ts`,
before sending.

#### Scenario: Video over the cap

- **WHEN** a visitor attaches a 150 MB video
- **THEN** the form shows "That video is larger than 100 MB…" under the video
  field without sending, and a direct post of the same file receives a 400 with
  the same message and stores nothing

#### Scenario: Wrong type in the video field

- **WHEN** a request carries a file of type `image/svg+xml` or
  `application/octet-stream` in the video field
- **THEN** it is rejected with "Videos only, please — MP4, MOV or WebM." and
  nothing is stored

#### Scenario: A video straight from an iPhone

- **WHEN** a visitor on an iPhone attaches a `.mov` recorded by the camera
- **THEN** it is accepted, stored as sent, and plays on `/memories` in Safari
  once approved

### Requirement: Oversized requests are refused before the body is read

The endpoint SHALL compare the request's `Content-Length`, when present, against
a ceiling derived from the limits — six photographs at the photo cap, one video
at the video cap, and an allowance for the text fields — and SHALL refuse a
request above it before parsing the body. The refusal SHALL be a message a
person can act on, not a silent success. The check SHALL run after the rate
limit and before the honeypot.

#### Scenario: Declared length over the ceiling

- **WHEN** a request declares a `Content-Length` of 400 MB
- **THEN** it receives a 413 with a message asking for a shorter video, the body
  is not parsed, and the rejection is logged by layer with no content

#### Scenario: No declared length

- **WHEN** a request carries no `Content-Length`
- **THEN** it proceeds to the remaining layers, which still enforce every
  per-file limit, and the absence is logged

### Requirement: Videos cannot become public before the memory is approved

The `memory-videos` collection SHALL NOT allow public create, update or delete.
Videos SHALL be written only by `POST /submit-memory` through the Local API,
after every layer has passed, and before the memory itself is written.

#### Scenario: Direct create through Payload's API

- **WHEN** an unauthenticated client POSTs a file to `/api/memory-videos`
- **THEN** it is refused and nothing is stored

#### Scenario: Pending memory

- **WHEN** a memory with a video is still `pending`
- **THEN** neither the memory nor any reference to its video appears on
  `/memories`, in the memories REST list, or by the memory's id
