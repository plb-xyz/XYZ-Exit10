# Audio Playback State Model

> **Related files:**
> - `docs/show-control-state-model.json` (v1.4) — canonical state shape
> - `docs/watchout-http-integration.md` — Watchout channel/timeline mapping
> - `PROJECT-SCOPE.md` — operational rules and source overview

---

## 1. Overview

Audio in this installation is divided into two levels of control:

1. **Playback domain selection** — which audio source is playing for a zone group (global per domain).
2. **Per-space participation** — whether a specific space is active, and at what level.

This separation means the Decision Maker can change the selected source once at the domain level and have it apply across all participating spaces, while still allowing individual spaces to be muted, levelled, or equipped with live mic/mixer inputs independently.

---

## 2. Playback Domains

### Why domains exist

The installation has two physically distinct zone groups:

| Domain      | Spaces        | Notes                                      |
|-------------|---------------|--------------------------------------------|
| `inside`    | a1, a2, a3    | Video-capable atriums; full source range   |
| `landscape` | ls            | Outdoor landscape; audio + lighting only   |

The landscape zone may be on a different DSP zone in Q-Sys and may legitimately play different BGM content from the inside atriums (e.g., outdoor-appropriate music). Separating them into domains makes this explicit rather than a workaround.

### Domain state

Each domain is modelled in `context.audio.domains.<domain>`:

```json
"inside": {
  "desired": "BGM",
  "effective": "BGM",
  "bgmSelection": "bg_music_1",
  "specialSelection": null,
  "transition": {
    "fadeOutMs": 2000,
    "fadeInMs": 2000,
    "mode": "CROSS_FADE"
  }
}
```

| Field              | Type                                      | Description                                             |
|--------------------|-------------------------------------------|---------------------------------------------------------|
| `desired`          | `SHOW`, `BGM`, `SPECIAL`, or `NONE`       | What the operator/planner wants to play                 |
| `effective`        | same                                      | What is actually playing (may differ during transitions)|
| `bgmSelection`     | `bg_music_1` .. `bg_music_4`              | Which BGM timeline is selected when desired = BGM       |
| `specialSelection` | string (contentId) or null                | Content for SPECIAL mode (inside domain only)           |
| `transition`       | object                                    | Fade parameters; see section 5                          |

### Selection values

| Value     | Allowed in `inside` | Allowed in `landscape` | Source                           |
|-----------|:-------------------:|:----------------------:|----------------------------------|
| `SHOW`    | ✅                  | ✅                     | Watchout channels 5–64           |
| `BGM`     | ✅                  | ✅                     | Watchout channels 3–4 (timeline) |
| `SPECIAL` | ✅                  | ❌                     | Watchout channels 1–2            |
| `NONE`    | ✅                  | ✅                     | All playback muted               |

> **Rule:** The landscape domain must never be set to `SPECIAL`. The Decision Maker must guard against this and reject any such request.

### BGM timeline IDs

BGM is delivered via named Watchout timelines. The current set is `bg_music_1` through `bg_music_4`. The `bgmSelection` field stores which one is desired. Only one BGM timeline plays at a time per domain.

---

## 3. SHOW mode forces playback

> **Key rule:** When `context.mode == "SHOW"`, both domains' `effective` playback is forced to `"SHOW"` regardless of their `desired` value.

The Decision Maker must override `effective` on both domains when entering SHOW mode, and restore `effective` to match `desired` when SHOW ends (or is aborted).

The `desired` field is preserved unchanged so that the system returns to the correct state after the show without requiring the operator to re-select.

---

## 4. Per-space audio

Each space has an `audio` block under `context.spaces.<spaceId>.audio`:

```json
"audio": {
  "playbackDomain": "inside",
  "playback": {
    "enabled": true,
    "levelsDb": { "bgm": 0, "show": 0, "special": 0 }
  },
  "live": {
    "mics": {
      "mic1": { "enabled": false, "levelDb": 0, "outputPresetId": "all_speakers" },
      "mic2": { "enabled": false, "levelDb": 0, "outputPresetId": "all_speakers" }
    },
    "mixer": {
      "enabled": false,
      "mode": "GLOBAL",
      "mixerId": null,
      "levelDb": 0,
      "outputPresetId": "all_speakers"
    }
  },
  "ducking": {
    "enabled": true,
    "triggerSources": ["mic1", "mic2"],
    "duckTargets": ["playback"],
    "duckAmountDb": -12,
    "attackMs": 100,
    "releaseMs": 500
  }
}
```

### 4.1 `playbackDomain`

Links this space to its domain. Read-only from the perspective of the Decision Maker (it is a capability, not operator state).

| Space | `playbackDomain` |
|-------|-----------------|
| a1    | `inside`        |
| a2    | `inside`        |
| a3    | `inside`        |
| ls    | `landscape`     |

### 4.2 `playback`

| Field                   | Type    | Description                                                        |
|-------------------------|---------|--------------------------------------------------------------------|
| `enabled`               | boolean | Whether this space participates in domain playback routing.        |
| `levelsDb.bgm`          | number  | Per-space gain trim (dB) for the BGM source in this space.        |
| `levelsDb.show`         | number  | Per-space gain trim (dB) for the SHOW source in this space.       |
| `levelsDb.special`      | number  | Per-space gain trim (dB) for the SPECIAL source in this space.    |

> **Note:** `levelsDb.special` is only present for `inside` spaces (a1/a2/a3). The `ls` space omits it since SPECIAL is not supported in the landscape domain.

These level fields represent mixer gain controls that the Q-Sys adapter translates into channel gain or fader values. They are relative adjustments, not absolute levels.

### 4.3 `live.mics`

Two live microphone inputs (`mic1`, `mic2`) per space:

| Field           | Type    | Description                                                         |
|-----------------|---------|---------------------------------------------------------------------|
| `enabled`       | boolean | Whether this mic is active and routed in this space.                |
| `levelDb`       | number  | Gain trim (dB) for this mic in this space.                          |
| `outputPresetId`| string  | Which speaker zone/output preset to route this mic to in this space.|

**Output presets** represent named routing configurations in Q-Sys (e.g., `all_speakers`, `stage_left`, `stage_right`, `atrium_focus`). The adapter resolves the preset ID to a Q-Sys snapshot or component value. In the simplest case `all_speakers` routes to all speakers in the space; presets are used when the operator needs to focus sound to a specific location (e.g., a stage position).

### 4.4 `live.mixer`

One live mixer input per space (or shared across spaces):

| Field           | Type                    | Description                                              |
|-----------------|-------------------------|----------------------------------------------------------|
| `enabled`       | boolean                 | Whether the mixer input is active in this space.         |
| `mode`          | `"GLOBAL"` or `"PER_SPACE"` | Whether the same mixer is shared or each space has its own. |
| `mixerId`       | string or null          | Mixer instance ID when `mode == "PER_SPACE"`; null when `mode == "GLOBAL"`. |
| `levelDb`       | number                  | Gain trim (dB) for the mixer in this space.              |
| `outputPresetId`| string                  | Output routing preset (same options as mics above).      |

When `mode == "GLOBAL"`, all spaces share one mixer feed. `mixerId` is `null` and the adapter routes based on space-level enables. When `mode == "PER_SPACE"`, `mixerId` identifies which physical mixer channel or input belongs to this space.

---

## 5. Ducking

The `audio.ducking` block models a ducker that automatically reduces playback level when a live mic or mixer is active in the same space:

| Field            | Type           | Description                                                      |
|------------------|----------------|------------------------------------------------------------------|
| `enabled`        | boolean        | Whether ducking is active in this space.                         |
| `triggerSources` | string[]       | Which live sources trigger ducking (`mic1`, `mic2`, `mixer`).    |
| `duckTargets`    | string[]       | What gets ducked (`playback` = all music sources in this space). |
| `duckAmountDb`   | number         | How much to reduce level when ducking (e.g., `-12` dB).         |
| `attackMs`       | number         | How fast the ducker engages (ms).                                |
| `releaseMs`      | number         | How fast the ducker recovers after the trigger stops (ms).       |

The ducker operates at the **per-space** level: enabling mic1 in a2 only ducks playback in a2. Other spaces are unaffected.

The Decision Maker does not directly implement the ducker — Q-Sys handles the dynamics. The state model records the *desired* ducking configuration so the Q-Sys adapter can send the correct control values when the state changes.

---

## 6. Fade transitions

Domain-level transitions are specified in `context.audio.domains.<domain>.transition`:

| Field       | Type   | Description                                          |
|-------------|--------|------------------------------------------------------|
| `fadeOutMs` | number | Time in ms to fade out the current source.           |
| `fadeInMs`  | number | Time in ms to fade in the new source.                |
| `mode`      | string | `"CROSS_FADE"` (overlap) or `"FADE_THROUGH_SILENCE"` (sequential). |

### How the Planner should translate transitions into ActionPlan steps

When the Decision Maker emits a domain playback change (e.g., BGM → SPECIAL), the Planner should generate an ActionPlan that sequences the fade:

```json
[
  { "type": "qsys", "command": "SetDomainFadeOut", "domain": "inside", "durationMs": 2000 },
  { "waitMs": 2000 },
  { "type": "watchout", "command": "start", "timelineKey": "special_promo_1" },
  { "type": "qsys", "command": "SetDomainFadeIn",  "domain": "inside", "durationMs": 2000 }
]
```

The exact stable-key Q-Sys commands (`SetDomainFadeOut`, etc.) are resolved by the Q-Sys adapter to the relevant component controls. The point is that the ActionPlan carries explicit `waitMs` steps so the Director sequences them correctly.

For `CROSS_FADE` mode the fade-out and Watchout start can be issued simultaneously (no `waitMs` between them).

---

## 7. Relationship to the Intent → Transition → ActionPlan flow

This audio model plugs into the existing orchestration pattern documented in `docs/intent-action-state-architecture.md`:

```
Intent (UI/scheduler)
  → Decision Maker (updates context.audio.domains + context.spaces.*.audio)
  → Transition (describes what changed)
  → Planner (generates ActionPlan with Watchout + Q-Sys steps)
  → Q-Sys adapter + Watchout adapter
```

**Decision Maker responsibilities for audio:**
- Validate SPECIAL is not requested for the landscape domain.
- Force `effective = "SHOW"` on both domains when entering SHOW mode.
- Restore `effective` to match `desired` when exiting SHOW mode.
- Apply ducking flag changes when mic/mixer enabled state changes.

**Planner responsibilities for audio:**
- Expand domain transitions into sequenced ActionPlan steps (fade out → switch source → fade in).
- Skip SPECIAL Watchout commands if the space is in the landscape domain.
- Map `bgmSelection` IDs to Watchout `timelineKey` values (e.g., `bg_music_1` → timeline key resolved via `timeline-mapping.json` as described in `docs/watchout-http-integration.md`).

---

## 8. Quick reference: audio state paths

```
context.audio.domains.inside.desired           // "SHOW" | "BGM" | "SPECIAL" | "NONE"
context.audio.domains.inside.effective         // forced to "SHOW" during SHOW mode
context.audio.domains.inside.bgmSelection      // "bg_music_1" .. "bg_music_4"
context.audio.domains.inside.specialSelection  // contentId string | null
context.audio.domains.landscape.desired        // "SHOW" | "BGM" | "NONE"
context.audio.domains.landscape.effective      // forced to "SHOW" during SHOW mode

context.spaces.<space>.audio.playbackDomain               // "inside" | "landscape"
context.spaces.<space>.audio.playback.enabled             // boolean
context.spaces.<space>.audio.playback.levelsDb.bgm        // number (dB)
context.spaces.<space>.audio.playback.levelsDb.show       // number (dB)
context.spaces.<space>.audio.playback.levelsDb.special    // number (dB) — inside spaces only
context.spaces.<space>.audio.live.mics.mic1.enabled       // boolean
context.spaces.<space>.audio.live.mics.mic1.levelDb       // number (dB)
context.spaces.<space>.audio.live.mics.mic1.outputPresetId// string
context.spaces.<space>.audio.live.mixer.enabled           // boolean
context.spaces.<space>.audio.live.mixer.mode              // "GLOBAL" | "PER_SPACE"
context.spaces.<space>.audio.live.mixer.levelDb           // number (dB)
context.spaces.<space>.audio.ducking.enabled              // boolean
context.spaces.<space>.audio.ducking.duckAmountDb         // number (dB)
```
