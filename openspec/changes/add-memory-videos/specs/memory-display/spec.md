## ADDED Requirements

### Requirement: An approved memory renders its video

When an approved memory has a video, `/memories` SHALL render it inside that
memory's card, after the body and after any photographs, in a native `<video>`
element with visible controls. The video SHALL NOT autoplay, SHALL play inline
on iOS, and SHALL NOT be muted by default.

#### Scenario: Memory with a video

- **WHEN** an approved memory with a video is on `/memories`
- **THEN** its card shows a video player with controls below its photographs and
  above the attribution, and nothing plays until the reader presses play

#### Scenario: Memory without a video

- **WHEN** an approved memory has no video
- **THEN** its card renders exactly as it does today, with no empty box

#### Scenario: Video document not resolved

- **WHEN** the memory's `video` field arrives as an id rather than a document
- **THEN** no player is rendered, rather than a player with no source

### Requirement: Rendering a video costs no layout shift and no client JavaScript

The player SHALL sit in a box whose size is reserved before any video bytes
arrive. It SHALL be a server component, adding no client component and no
client JavaScript. It SHALL request only metadata until the reader presses play,
so a page of many memories does not download many videos.

#### Scenario: Page load with several videos

- **WHEN** `/memories` loads with five approved memories that each have a video
- **THEN** no video is downloaded beyond its metadata and the first frame, and
  the page's cumulative layout shift is unchanged by the players

#### Scenario: JavaScript disabled

- **WHEN** `/memories` is opened with JavaScript off
- **THEN** each video is playable with the browser's native controls

### Requirement: The player is reachable and labelled

The player SHALL be operable from the keyboard with visible focus, and SHALL
carry an accessible name that says whose video it is.

#### Scenario: Keyboard and screen reader

- **WHEN** a reader tabs through a memory with a video
- **THEN** focus lands on the player with a visible focus ring, and a screen
  reader announces it as a video shared by the memory's author
