# Show Control State Model

> **File:** `docs/show-control-state-model.json`  
> **Version:** 1.3

---

## 1. What is this file?

`docs/show-control-state-model.json` is a **specification / state model** — not code that Node-RED executes directly.

It defines:

- The canonical shape of `flow.state` (the live context object stored inside Node-RED).
- The allowed global modes and how the system can transition between them.
- The message contract: the command envelope shape in `msg.payload` (`action`, `target`, `params`).
- Guards and policies that the Decision Maker must enforce.

Use it as the single source of truth when building or reviewing the Node-RED "Decision Maker" function node.

---

## 2. Core Concepts

### 2.1 Global Modes

| Mode           | Description                                                         |
|----------------|---------------------------------------------------------------------|
| `INITIALIZING` | System startup; waiting for `sys/ready`. Scheduler is disabled.    |
| `NORMAL`       | Default operating mode. Ambiences run, events can be triggered.    |
| `SHOW`         | A scheduled or manually triggered show is running (all spaces).    |
| `FAULT`        | A system fault occurred. Cleared with `sys/resetFault`.            |

Mode is stored in `context.mode`.

### 2.2 Spaces (scope of control)

The installation is divided into four spaces:

| Space | Description                          | Video | Audio | Lighting |
|-------|--------------------------------------|-------|-------|----------|
| `a1`  | Area 1                               | ✅    | ✅    | ✅       |
| `a2`  | Area 2                               | ✅    | ✅    | ✅       |
| `a3`  | Area 3                               | ✅    | ✅    | ✅       |
| `ls`  | Landscape (audio + lighting only)    | ❌    | ✅    | ✅       |

> **Important:** `ls` (Landscape) has **no video**. The Decision Maker must never send Watchout video timeline commands for `ls`. Check `context.spaces.ls.capabilities.hasVideo === false` to skip video calls automatically.

### 2.3 Layering Inside a Space

Each space supports three content layers (lowest → highest priority):

1. **Background** — the ambient/default state: Ambience video loop (A1/A2/A3) or audio+lighting (LS).
2. **Special On-Top** — a partial overlay (e.g. a promo banner) that sits on top of the background.
3. **Special Fullscreen** — a full takeover that hides the background entirely.

Fullscreen always wins over On-Top. When a special ends, the layer below is revealed automatically.

### 2.4 Ambience (spelling: Ambience, not Ambiance)

An **Ambience** is the default background content for a space: a looping video (A1/A2/A3) or an audio/lighting look (LS). It is selected using `content.go` with `params.key` and optional `target`, then stored in `context.spaces.<space>.background.contentId`.

### 2.5 Events as a Sub-Mode

Inside `NORMAL`, the system can enter an event sub-mode (`SIMPLE` or `COMPLEX`) stored in `context.event`:

- **NONE** — no event active; scheduler can run.
- **SIMPLE** — audio + lighting only; video stays as the current ambience unless explicitly overridden.
- **COMPLEX** — full space takeover (video + audio + lighting); live operator in the loop.

While an event is active, `schedulerEnabled` is forced to `false`.

### 2.6 `schedulerEnabled`

`schedulerEnabled` is `true` only when:

```
context.mode == 'NORMAL'
  && context.event.active == false
  && context.prayer.active == false
```

It gates whether `sched/*` topics (future scheduler) are allowed to trigger shows/events.

It gates whether scheduler-originated actions are allowed to trigger shows/events.

### 2.7 Prayer Gating

Prayer is a **global overlay constraint** — not a mode. It is tracked in `context.prayer`.

| Field              | Type      | Description                                               |
|--------------------|-----------|-----------------------------------------------------------|
| `active`           | boolean   | `true` while prayer time is in effect.                    |
| `endsAt`           | timestamp | ISO 8601 timestamp when prayer ends (set by prayer source).|
| `volumeDeltaDb`    | number    | Applied as a global Q-Sys trim (default: `-10`).          |
| `pendingShow`      | object    | Stores a show that was blocked by prayer; replayed after. |

**Rules enforced by the Decision Maker:**

1. **No show may start while `prayer.active === true`** — the request is blocked and stored as `pendingShow`.
2. **If prayer starts while a SHOW is running** — abort immediately with a fade-out, then return to `NORMAL`.
3. **When prayer ends** — restore Q-Sys global trim to `0 dB`, re-enable scheduler, and schedule any `pendingShow` at `prayer.endsAt + 60 seconds`.
4. **Volume** — applied as a Q-Sys call (`qsys.applyGlobalTrimDb`), not a Watchout call.

### 2.8 Policies

The `policies` section of the JSON documents intent for the Decision Maker:

- `policies.landscape` — skip Watchout video calls for `ls`.
- `policies.prayer` — block/postpone shows, abort mid-show, volume via Q-Sys.
- `policies.specialContent.fullscreenWinsOverOnTop` — fullscreen overrides on-top.

---

## 3. Message Contract (Command Envelope)

All commands entering the Decision Maker use `msg.payload` in this shape:

```json
{
  "v": 1,
  "source": "ui | scheduler | auto | operator | prayer | sys",
  "target": "<zone/item/filter/array>",
  "action": "<domain.verb>",
  "params": {}
}
```

### 3.1 Canonical Actions

| Action | Required params | Typical target | Notes |
|---|---|---|---|
| `show.go` | `key` | optional (usually global) | Blocked during prayer/event |
| `show.end` | `key` | optional | Returns to NORMAL |
| `content.go` | `key` | optional (`"a1"`, `"a2"`, etc.) | Per-space ambience/special by target |
| `content.stop` | `key` | optional | Stops content route |
| `show.cue` | `key`, `cueName` | optional | Cue-based phase trigger (e.g. `all_opaque`) |

### 3.2 Target Field

`target` identifies where the command applies (zone, item, filter object, or array), using the same resolution rules as `docs/item-registry.md`.

When omitted, actionMap/default policy decides global vs scoped behavior.

---

## 4. Message Examples

### Example A — Minimal Start Show

```json
{
  "v": 1,
  "source": "ui",
  "action": "show.go",
  "params": { "key": "show_1" }
}
```

### Example B — Start Show with Metadata

```json
{
  "v": 1,
  "source": "scheduler",
  "action": "show.go",
  "params": { "key": "show_1" }
}
```

### Example C — Set Ambience for a Space

```json
{
  "v": 1,
  "source": "ui",
  "target": "a1",
  "action": "content.go",
  "params": { "key": "ambience_scene_2" }
}
```

### Example D — Special On-Top Start

```json
{
  "v": 1,
  "source": "ui",
  "target": ["a1"],
  "action": "content.go",
  "params": {
    "key": "promo_overlay_16x9",
    "mode": "onTop",
    "audioMode": "duckBG"
  }
}
```

---

## 5. Implementing the Decision Maker in Node-RED

The Decision Maker is **one Function node** that acts as the central state reducer for all show-control logic.

### 5.1 Architecture Overview

```
[UI Buttons]      ─┐
[Prayer System]   ─┤
[Watchout Status] ─┼──► [Decision Maker] ──► Output 1: Watchout commands
[MA Status]       ─┤    (Function node)  ──► Output 2: Q-Sys commands
[Sys Events]      ─┘                     ──► Output 3: MA cues
                                         ──► Output 4: Debug / Dashboard status
```

- **Fan-in:** Wire every source (UI buttons, prayer events, Watchout feedback, system events) to a single input of the Decision Maker node.
- **Single reducer:** One function node reads `flow.get('state')`, processes the event (topic + payload), and writes `flow.set('state', nextState)`.
- **Fan-out:** The function node returns multiple outputs — each wired to the appropriate integration subflow (Watchout, Q-Sys, MA, debug).

### 5.2 State Storage

```js
// Read current state
const state = flow.get('state') || initialState;

// ...apply event logic...

// Write updated state
flow.set('state', nextState);
```

Use `flow.get`/`flow.set` (not `global`) so state is scoped to the show-control flow tab and survives deploys.

### 5.3 Reducer Skeleton

```js
const state = flow.get('state') || require('./initialState');
const payload = msg.payload;
const action = String(payload?.action || '').toLowerCase();

switch (action) {
  case 'sys.ready':
        state.context.mode = 'NORMAL';
        state.context.schedulerEnabled = true;
        break;

  case 'show.go': {
        if (state.context.prayer.active) {
            // Block + store as pendingShow
            state.context.prayer.pendingShow = {
        key: payload.params?.key,
        source: payload.source || null,
                scheduledFor: new Date(state.context.prayer.endsAt).getTime() + 60000
            };
            break;
        }
        if (state.context.event.active) break; // guard: no show during event
        state.context.mode = 'SHOW';
        state.context.show = {
            active: true,
      showId: payload.params?.key,
      requestedBy: payload.source || null,
      requestedAt: new Date().toISOString()
        };
        // Output 1: send Watchout start-show command
    node.send([{ topic: 'wo/startShow', payload: { key: payload.params?.key } }, null, null, null]);
        return; // early return after send

  case 'show.end':
        state.context.mode = 'NORMAL';
        state.context.show = { active: false, showId: null, requestedBy: null, requestedAt: null };
        node.send([{ topic: 'wo/abortShow', payload: {} }, null, null, null]);
        return;

  case 'prayer.active':
        if (state.context.mode === 'SHOW') {
            // Abort mid-show
            state.context.mode = 'NORMAL';
            state.context.show = { active: false, showId: null, requestedBy: null, requestedAt: null };
            node.send([{ topic: 'wo/abortShow', payload: { fade: true } }, null, null, null]);
        }
        state.context.prayer.active = true;
        state.context.prayer.endsAt = payload.endsAt || null;
        state.context.schedulerEnabled = false;
        // Output 2: Q-Sys volume duck
        node.send([null, { topic: 'qsys/applyGlobalTrim', payload: { db: state.context.prayer.volumeDeltaDb } }, null, null]);
        return;

      case 'prayer.inactive':
        state.context.prayer.active = false;
        state.context.schedulerEnabled =
            state.context.mode === 'NORMAL' && !state.context.event.active;
        // Output 2: Q-Sys restore volume
        node.send([null, { topic: 'qsys/applyGlobalTrim', payload: { db: 0 } }, null, null]);
        // Schedule pending show if any
        if (state.context.prayer.pendingShow) {
            // (set a delay node or use node-red-contrib-cron / setTimeout)
        }
        state.context.prayer.pendingShow = null;
        return;

      case 'content.go': {
        const target = payload.target;
        const key = payload.params?.key;
        if (typeof target !== 'string') break; // simplified example
        // Skip Watchout video for LS
        if (state.context.spaces[target]?.capabilities?.hasVideo) {
          node.send([{ topic: 'wo/setAmbience', payload: { target, key } }, null, null, null]);
        }
        state.context.spaces[target].background.contentId = key;
        break;
      }

      // ...add remaining actions...

    default:
        break;
    }
}

flow.set('state', state);
// Default: emit debug/status on output 4
node.send([null, null, null, { topic: 'state/update', payload: state }]);
```

### 5.4 Outputs (recommended wiring)

| Output | Topic namespace | Target subflow        |
|--------|-----------------|-----------------------|
| 1      | `wo/*`          | Watchout HTTP control |
| 2      | `qsys/*`        | Q-Sys OSC / REST      |
| 3      | `ma/*`          | MA OSC cues           |
| 4      | `state/*`       | Debug / Dashboard     |

### 5.5 Adding Metadata (`requestedBy` / `requestedAt`)

Add a Function node **between** your Dashboard buttons and the Decision Maker to stamp metadata:

```js
msg.payload = msg.payload || {};
msg.payload.source = msg.payload.source || 'operator';
return msg;
```

This keeps the button configurations minimal (Examples A / C) while the Decision Maker always receives a complete payload.

---

## 6. Naming Reference

| Concept            | Correct spelling / name | Avoid              |
|--------------------|-------------------------|--------------------|
| Background content | **Ambience**            | ~~Ambiance~~       |
| Spatial selector in payload | **`target`**   | ~~`spaces`~~ / ~~`targets`~~ for command envelope |
| Space identifiers  | `a1`, `a2`, `a3`, `ls`  | —                  |
| Landscape space    | `ls` — audio + lighting only | —             |

---

## 7. Quick Reference: State Shape

The full initial state shape lives in `docs/show-control-state-model.json → context`. At runtime, store this object in `flow.get('state').context`:

```
state.context.mode                          // "INITIALIZING" | "NORMAL" | "SHOW" | "FAULT"
state.context.schedulerEnabled              // boolean
state.context.prayer.active                 // boolean
state.context.prayer.endsAt                 // ISO timestamp | null
state.context.prayer.volumeDeltaDb          // number (default -10)
state.context.prayer.pendingShow            // object | null
state.context.show.active                   // boolean
state.context.show.showId                   // string | null
state.context.event.active                  // boolean
state.context.event.type                    // "NONE" | "SIMPLE" | "COMPLEX"
state.context.spaces.a1.capabilities.hasVideo  // true
state.context.spaces.ls.capabilities.hasVideo  // false
state.context.spaces.<space>.background.contentId
state.context.spaces.<space>.special.onTop.active
state.context.spaces.<space>.special.fullscreen.active
```
