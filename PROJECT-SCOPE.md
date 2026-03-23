# PROJECT SCOPE

## Core Modes & Operational Rules

### SHOW
- Plays everywhere (all spaces), only one show can run at once
- Video & audio: Synchronized via Watchout timeline
- Lighting: Receives timecode from Watchout
- Some external systems receive timecode or cues from Watchout
- All external systems can be toggled globally/per-system (on/off)
- At show end, external systems revert to their normal schedule/logic unless specifically instructed
- Only shows may affect external systems; other content types do not

### AMBIANCES
- Video: Loop from Watchout
- Audio: 2-hour background music loop (from Watchout or Q-Sys)
- Lighting: Triggered by cues (no timecode)
- May run the same across all spaces, or different ambiances per space simultaneously

### EVENTS
- Scheduler commands are disabled or bypassed during events
#### Simple Event
  - Scheduled or UI-triggered (Node-RED)
  - Typically 1 stage, 1–2 mics, possible special video/audio (per space or grouped)
  - Other spaces continue ambiances, background music may be reduced
#### Complex Event
  - Requires live operators for lighting (MA), video (Watchout), and audio (mixer to Q-Sys)
  - Supports stage presets (1–4) or all atriums
  - Usually per-space, but can span multiple spaces

### SPECIAL CONTENT
#### Full Screen
  - Custom content, takes over main displays on 1–3 atriums
  - May or may not touch sphere/column, and have special audio (otherwise BG music continues)
#### On Top
  - 16:9 video overlays on ambient video; played in multiple screen "windows"
  - If own audio: Background music fades, special audio plays, then returns to normal; if not, just video overlay

## Content Routing & Ownership
- Video: Always from Watchout for any content type (show, ambiance, event, special)
- Audio: May be show, background, special, or live-mixer (handled by Watchout or Q-Sys)
- Lighting: Always from MA
    - Show: Timecode
    - Ambiance/Simple/Special: Cues
    - Complex Events: Manual/live
- External Systems: Only affected by shows, never by other content types

## Main Spaces
- 4 main spaces: Atrium 1, Atrium 2, Atrium 3, Landscape

## Simultaneous Capability
- Ambiances and events can run per-space or globally, as needed

## Environment
- System is deployed in a theme park environment