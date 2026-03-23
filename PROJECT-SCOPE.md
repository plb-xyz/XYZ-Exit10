# PROJECT SCOPE

## Key Project Parameters
- **Shows**: 4 shows of 2 minutes each.
- **Ambient Modes**: Ambient modes between shows.
- **Main Spaces**: 4 main spaces (Atriums 1-3 + Landscape).
- **Simultaneous Capability**: Capability to run simultaneously across all spaces or different content per space.
- **Environment**: Theme park environment.

## General Rules
- **Show = global, everything in sync, controls external systems**
- **Ambiances = per-space flexibility, BG operation**
- **Events = scheduler overridden, split into simple (auto) and complex (live)**
- **Special Content = overlay or fullscreen, context-driven**
- **Lighting always routed through MA, but control mode/context varies by scenario**

## Core Modes & Operational Rules

### SHOW
- **Scope:** Plays everywhere (all spaces), only one show active at a time.
- **Video & Audio:** Synchronized in one timeline, played via Watchout.
- **Lighting:** Receives timecode from Watchout for synchronization.
- **External Systems:**
  - Some receive timecode from Watchout.
  - Some receive cues from Watchout.
  - Global + per-system on/off switches (control integration).
- **End of Show:** External systems return to their normal/scheduled modes (unless specific post-show actions are needed).
- **Affect Scope:** Only shows control external systems—other content does not.

### AMBIANCES
- Video: Loop from Watchout
- Audio: 2-hour background music loop (from Watchout or Q-Sys)
- Lighting: Triggered by cues (no timecode)
- Scope: Generally runs system-wide, but supports different ambiances per space simultaneously.

### EVENTS
- **Scheduler behavior:** Scheduler commands are disabled/overridden during events.

#### Simple Event
- **Trigger:** Scheduled or triggered from show scheduler or Node-RED UI.
- **Setup:** 1 stage, 1–2 mics, possible special video/audio (per space or grouped atriums).
- **Other Spaces:** Continue ambient content; may reduce BG music.

#### Complex Event
- **Live Operator Required:** Lighting (MA), Video (Watchout), Audio Mixer (Q-Sys physical input).
- **Presets:** Different stage positions or whole atrium.
- **Scope:** Typically one space but possible across all atriums.

### SPECIAL CONTENT
Full Screen
- **Behavior:** Custom content (ambiance-like), can take over Atriums 1–3 (selectively includes sphere/column).
- **Audio:** May have special audio (else BG music continues).

#### On Top
- **Behavior:** Overlay 16:9 video(s) on top of ambiance (ribbon, column; rarely sphere).
- **Audio:** If present, fades out BG music, plays its own, then fades BG music back in after; if not, only video overlays.

## SOURCES OVERVIEW
- **Video:** Always from Watchout; can be show, ambiance, event, or special content.
- **Audio:** 
  - Show music (Watchout timeline)
  - Background music (Watchout or Q-Sys)
  - Special content audio
  - Live mixer input (Q-Sys)
- **Lighting:** 
  - Always from MA
  - Show: triggered by Watchout timecode
  - Ambiance/Simple Event/On Top Content: triggered by cues
  - Complex Event: live-operated from MA

