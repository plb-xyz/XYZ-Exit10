# Show Scripts — Reference & Usage Guide

**Node:** `Show Scripts` function node (On Start tab)  
**Stores to:** `global.showScripts`  
**Related:** `docs/content-registry.md`, `docs/item-registry.md`

---

## What It Is

A Show Script defines the **exact sequence of steps** to execute a show — what fires immediately on trigger, what fires when all three atrium transitions confirm opaque, and what fires when the show ends.

It is distinct from the Content Registry, which only says "show_1 exists". The Show Script says "here is exactly how show_1 executes, in what order, and at what trigger points".

---

## The Three Phases

```
SHOW TRIGGERED
      │
      ▼
┌─────────────────┐
│   onStart       │  Fires immediately when show is triggered
│                 │  Pre-show cues to all systems
│                 │  Starts all 3 transition timelines (A1, A2, A3)
└────────┬────────┘
         │  Three independent Watchout transition timelines now playing...
         │
         │  Each sends TCP when fully opaque:
         │    "transition_a1_opaque"  →  Node-RED Transition Gate
         │    "transition_a2_opaque"  →  Node-RED Transition Gate
         │    "transition_a3_opaque"  →  Node-RED Transition Gate
         │
         │  Gate fires when ALL 3 received, OR timeout after first receipt
         ▼
┌─────────────────┐
│   onCue         │  Fires when Transition Gate releases
│  "all_opaque"   │  Start unified show timeline (video + audio + MA timecode)
│                 │  Send show cues to all satellite systems
└────────┬────────┘
         │  Show is running...
         │
         │  Watchout show timeline sends TCP "show_end" at end cue
         ▼
┌─────────────────┐
│   onEnd         │  Fires when Watchout sends "show_end"
│                 │  Return all systems to normal / ambience
│                 │  Sends "Trans to Normal" event to state machine
└─────────────────┘
```

---

## TCP Cue Names

| Cue string (sent by Watchout) | Source | Meaning |
|---|---|---|
| `transition_a1_opaque` | A1 transition timeline | A1 is fully opaque — safe to cut |
| `transition_a2_opaque` | A2 transition timeline | A2 is fully opaque — safe to cut |
| `transition_a3_opaque` | A3 transition timeline | A3 is fully opaque — safe to cut |
| `show_end` | Show timeline | Show has finished — return to normal |

> **Note:** Individual `transition_aX_opaque` cues are also used independently for
> ambience switches and event transitions — not only for shows. The Transition Gate
> only activates when `pendingIntent.type === "show"`. For ambiences and events,
> the per-space cues are handled directly by their own handler.

---

## The Transition Gate

Node-RED owns the decision of when to fire the show timeline. The Transition Gate
collects the three per-space opaque cues and fires once when the condition is met.

### Fire condition
- **All 3 received** → fire immediately, OR
- **Timeout** → fire if at least 1 received and `TIMEOUT_MS` has elapsed since the **first** receipt

### One-shot timeout — important design note

The timeout is started **once**, on receipt of the very first opaque cue. It does
not reset on subsequent cues. This means:

- If A1 arrives at T+0 → timeout starts (3 seconds from T+0)
- If A2 arrives at T+1 → no reset, timeout still fires at T+3
- If A3 arrives at T+2 → all 3 received, gate fires immediately, timeout is irrelevant
- If A3 never arrives → timeout fires at T+3, gate fires with 2/3 spaces

A resetting timeout would be unsafe — it could delay the show indefinitely if cues
keep arriving slightly apart. The one-shot timeout guarantees the show starts within
`TIMEOUT_MS` of the first confirmed opaque space.

### Transition Gate function node

```javascript
// On Message tab — "Transition Gate" function node
//
// Inputs:
//   { topic: "transition_gate", payload: { space: "a1" | "a2" | "a3" } }
//   { topic: "transition_gate", payload: { event: "timeout" } }
//
// Output 1: show start message → Show Executor
// Output 2: nothing (timeout arm message goes via separate Trigger node)

const TIMEOUT_MS = 3000;
const REQUIRED_SPACES = ["a1", "a2", "a3"];

// ── Handle timeout path ───────────────────────────────────────────────────
if (msg.payload.event === "timeout") {
  const gate = flow.get('transitionGate') || { received: {}, fired: false };
  const receivedCount = Object.keys(gate.received).length;

  if (gate.fired) {
    node.warn("Transition Gate timeout: already fired, ignoring");
    return null;
  }
  if (receivedCount === 0) {
    node.warn("Transition Gate timeout: nothing received yet, ignoring");
    return null;
  }

  node.warn(`Transition Gate TIMEOUT: ${receivedCount}/3 received — firing show anyway`);
  gate.fired = true;
  flow.set('transitionGate', gate);
  return _fireShowStart(gate, receivedCount, true);
}

// ── Handle per-space opaque cue ───────────────────────────────────────────
let gate = flow.get('transitionGate') || { received: {}, fired: false };
const space = msg.payload.space;

if (gate.fired) {
  node.warn(`Transition Gate: ignoring ${space} — gate already fired`);
  return null;
}

if (!REQUIRED_SPACES.includes(space)) {
  node.warn(`Transition Gate: unknown space "${space}"`);
  return null;
}

gate.received[space] = true;
const receivedCount = Object.keys(gate.received).length;
const receivedList = Object.keys(gate.received).join(", ");
node.warn(`Transition Gate: received ${space} (${receivedCount}/3) [${receivedList}]`);

// ── Arm one-shot timeout on FIRST receipt only ────────────────────────────
// Output 2 sends to a Trigger node configured to fire once after TIMEOUT_MS.
// The Trigger node must NOT reset on subsequent messages (set "reset" to off).
const isFirstReceipt = receivedCount === 1;
flow.set('transitionGate', gate);

// ── Check if all 3 received ───────────────────────────────────────────────
const allReceived = REQUIRED_SPACES.every(s => gate.received[s]);
if (allReceived) {
  node.warn("Transition Gate: all 3 received — firing show start");
  gate.fired = true;
  flow.set('transitionGate', gate);
  // Output 2: null (no need to arm timeout)
  return [_fireShowStart(gate, receivedCount, false), null];
}

// ── Not all received yet — arm timeout on first receipt ───────────────────
if (isFirstReceipt) {
  node.warn(`Transition Gate: arming ${TIMEOUT_MS}ms one-shot timeout`);
  // Send any message to output 2 to arm the Trigger node
  return [null, { payload: { event: "arm_timeout" } }];
}

return null;

// ─────────────────────────────────────────────────────────────────────────
function _fireShowStart(gate, receivedCount, timedOut) {
  const pendingIntent = flow.get('pendingIntent');

  if (!pendingIntent || pendingIntent.type !== "show") {
    node.warn("Transition Gate: no pending show intent — ignoring");
    return null;
  }

  node.status({
    fill: timedOut ? "orange" : "yellow",
    shape: "dot",
    text: `${timedOut ? "TIMEOUT " : ""}fired ${pendingIntent.showKey} (${receivedCount}/3)`
  });

  return {
    topic: "show_executor",
    payload: {
      event: "cue",
      cueName: "all_opaque",
      showKey: pendingIntent.showKey,
      spacesConfirmed: Object.keys(gate.received),
      timedOut: timedOut
    }
  };
}
```

### Trigger node configuration (timeout arm)

Wire **output 2** of the Transition Gate into a **Trigger node**, then wire the
Trigger node output back into the Transition Gate input:

| Trigger node setting | Value |
|---|---|
| Send | nothing on first message |
| Then send | `{ "payload": { "event": "timeout" } }` after `3000` ms |
| Reset | **OFF** — do NOT reset on subsequent messages (one-shot) |
| Handle 2nd message | Ignore while waiting |

```
[Transition Gate fn]
   output 1 ──────────────────────────────▶ [Show Executor fn]
   output 2 ──▶ [Trigger node: 3s once] ──▶ [Transition Gate fn] (timeout path)
        ▲                                           │
        └───────────────────────────────────────────┘
              (TCP opaque cues also feed in here)
```

### Gate reset

Call this after every show ends (from the Show Executor onEnd handler):

```javascript
flow.set('transitionGate', {
  received: {},
  fired: false
});
node.status({ fill: "grey", shape: "ring", text: "gate reset — ready" });
```

Also reset on Node-RED startup (On Start tab of the Transition Gate node):

```javascript
flow.set('transitionGate', { received: {}, fired: false });
node.status({ fill: "grey", shape: "ring", text: "gate reset — ready" });
```

---

## Pending Intent

When "Start Show X" is triggered, Node-RED stores a pending intent **before** starting
the transitions. The Transition Gate reads this to know what to fire when the gate releases.

```javascript
// Set by the Show Executor when onStart fires
flow.set('pendingIntent', {
  type: "show",          // "show" | "ambience" | "fullscreen"
  showKey: "show_1",     // content key
  requestedAt: Date.now()
});
```

For per-space ambience switches, pending intent is stored per space:
```javascript
flow.set('pendingIntent_a1', { type: "ambience", ambienceKey: "ambience_2" });
```

The Transition Gate only reads the global `pendingIntent` — per-space intents are
handled by the per-space TCP cue handler, which bypasses the gate entirely.

---

## The Full Show Start Flow

```
OPERATOR: "Start Show 1"
      │
      ▼
State machine: IDLE → SHOW (guard passes)
      │
      ▼
Show Executor: onStart fires
  ├── Store pendingIntent = { type: "show", showKey: "show_1" }
  ├── Start A1 transition timeline
  ├── Start A2 transition timeline
  ├── Start A3 transition timeline
  ├── MA preshow cue
  ├── QSC preshow snapshot
  ├── Pharos preshow cue
  ├── Mint FEC preshow cue
  ├── Dome Screen WO6 preshow
  ├── Space Bridge LED preshow
  ├── Space Bridge Proj preshow
  └── Cinema Columns preshow
      │
      │  Transitions playing...
      │
      ├── TCP "transition_a1_opaque" → Transition Gate (1/3) → arm timeout
      ├── TCP "transition_a2_opaque" → Transition Gate (2/3)
      └── TCP "transition_a3_opaque" → Transition Gate (3/3) → ALL RECEIVED
                                              │
                                              ▼
                                    Gate fires: onCue["all_opaque"]
                                      ├── Start show_1 unified timeline
                                      ├── Dome Screen show cue
                                      ├── Space Bridge LED show cue
                                      ├── Space Bridge Proj show cue
                                      └── Cinema Columns show cue
                                              │
                                              │  Show running...
                                              │
                                    TCP "show_end"
                                              │
                                              ▼
                                    onEnd fires
                                      ├── Stop all xyz video
                                      ├── MA post-show return
                                      ├── Pharos post-show return
                                      ├── QSC return to BGM
                                      ├── Dome / SB / Columns return
                                      ├── Gate reset
                                      └── "Trans to Normal" → state machine
```

---

## Debug Logging

The gate logs every step. In the debug panel you will see one of two patterns:

**Happy path (all 3 received in time):**
```
Transition Gate: received a1 (1/3) [a1]
Transition Gate: arming 3000ms one-shot timeout
Transition Gate: received a2 (2/3) [a1, a2]
Transition Gate: received a3 (3/3) [a1, a2, a3]
Transition Gate: all 3 received — firing show start
```

**Timeout path (A3 late or missing):**
```
Transition Gate: received a1 (1/3) [a1]
Transition Gate: arming 3000ms one-shot timeout
Transition Gate: received a2 (2/3) [a1, a2]
Transition Gate TIMEOUT: 2/3 received — firing show anyway
```

The node status under the canvas node will show:
- 🟡 `fired show_1 (3/3)` — clean start
- 🟠 `TIMEOUT fired show_1 (2/3)` — timeout path (investigate A3 later)

---

## Show Scripts Definition

```javascript
const showScripts = {

  // ═══════════════════════════════════════════════════════════
  // SHOW 1
  // ═══════════════════════════════════════════════════════════
  // Canonical recipe lives in:
  // src/Orchestration/3-actionMap (recipes).js
  //
  // Runtime shape:
  // show_1: {
  //   onStart: [...],
  //   onCue: { all_opaque: [...] },
  //   onEnd: [...]
  // },

  // ═══════════════════════════════════════════════════════════
  // SHOW 2
  // ═══════════════════════════════════════════════════════════
  show_2: {
    label: "Show 2",
    duration: 120000,

    onStart: [
      { label: "Start A1 video transition", target: "a1.video", action: "video.play", params: { timelineKey: "transition_a1" } },
      { label: "Start A2 video transition", target: "a2.video", action: "video.play", params: { timelineKey: "transition_a2" } },
      { label: "Start A3 video transition", target: "a3.video", action: "video.play", params: { timelineKey: "transition_a3" } },
      { label: "MA — preshow cue", target: { tags: ["xyz", "lighting"] }, action: "lighting.goCue", params: { cueKey: "preshow" } },
      { label: "QSC — preshow snapshot", target: { tags: ["xyz", "audio"] }, action: "audio.snapshotRecall", params: { snapshotId: "preshow" } },
      { label: "Pharos 1,2,3,4 — preshow cue", target: { tags: ["lighting", "strips"] }, action: "lighting.goCue", params: { cueKey: "preshow" } },
      { label: "Mint FEC Show Control — preshow cue", target: "mint.showControl", action: "showcontrol.sendCue", params: { cueKey: "preshow" } },
      { label: "Dome Screen WO6 — preshow", target: "ds.domeLed", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Space Bridge LED — preshow", target: "sb.portalLed", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Space Bridge Projection — preshow", target: "sb.portalProj", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Cinema Columns BrightSign — preshow", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "preshow" } }
    ],

    onCue: {
      all_opaque: [
        { label: "Start Show 2 unified timeline", target: { tags: ["xyz", "video"] }, action: "video.play", params: { timelineKey: "show_2" } },
        { label: "Dome Screen WO6 — show", target: "ds.domeLed", action: "video.play", params: { timelineKey: "show_2_dome" } },
        { label: "Space Bridge LED — show", target: "sb.portalLed", action: "video.play", params: { timelineKey: "show_2_sb_led" } },
        { label: "Space Bridge Projection — show", target: "sb.portalProj", action: "video.play", params: { timelineKey: "show_2_sb_proj" } },
        { label: "Cinema Columns BrightSign — show", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "show_2_columns" } }
      ]
    },

    onEnd: [
      { label: "Stop all xyz video", target: { tags: ["xyz", "video"] }, action: "video.stop", params: {} },
      { label: "MA — post-show return", target: { tags: ["xyz", "lighting"] }, action: "lighting.goCue", params: { cueKey: "post_show_return" } },
      { label: "Pharos — post-show return", target: { tags: ["lighting", "strips"] }, action: "lighting.goCue", params: { cueKey: "post_show_return" } },
      { label: "QSC — return to BGM", target: { tags: ["xyz", "audio"] }, action: "audio.snapshotRecall", params: { snapshotId: "ambience_bgm" } },
      { label: "Dome Screen — return to ambience", target: "ds.domeLed", action: "video.play", params: { timelineKey: "ambience_dome" } },
      { label: "Space Bridge — return to ambience", target: ["sb.portalLed", "sb.portalProj"], action: "video.play", params: { timelineKey: "ambience_sb" } },
      { label: "Cinema Columns — return to ambience", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "ambience_columns" } }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // SHOW 3
  // ═══════════════════════════════════════════════════════════
  show_3: {
    label: "Show 3",
    duration: 120000,

    onStart: [
      { label: "Start A1 video transition", target: "a1.video", action: "video.play", params: { timelineKey: "transition_a1" } },
      { label: "Start A2 video transition", target: "a2.video", action: "video.play", params: { timelineKey: "transition_a2" } },
      { label: "Start A3 video transition", target: "a3.video", action: "video.play", params: { timelineKey: "transition_a3" } },
      { label: "MA — preshow cue", target: { tags: ["xyz", "lighting"] }, action: "lighting.goCue", params: { cueKey: "preshow" } },
      { label: "QSC — preshow snapshot", target: { tags: ["xyz", "audio"] }, action: "audio.snapshotRecall", params: { snapshotId: "preshow" } },
      { label: "Pharos 1,2,3,4 — preshow cue", target: { tags: ["lighting", "strips"] }, action: "lighting.goCue", params: { cueKey: "preshow" } },
      { label: "Mint FEC Show Control — preshow cue", target: "mint.showControl", action: "showcontrol.sendCue", params: { cueKey: "preshow" } },
      { label: "Dome Screen WO6 — preshow", target: "ds.domeLed", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Space Bridge LED — preshow", target: "sb.portalLed", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Space Bridge Projection — preshow", target: "sb.portalProj", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Cinema Columns BrightSign — preshow", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "preshow" } }
    ],

    onCue: {
      all_opaque: [
        { label: "Start Show 3 unified timeline", target: { tags: ["xyz", "video"] }, action: "video.play", params: { timelineKey: "show_3" } },
        { label: "Dome Screen WO6 — show", target: "ds.domeLed", action: "video.play", params: { timelineKey: "show_3_dome" } },
        { label: "Space Bridge LED — show", target: "sb.portalLed", action: "video.play", params: { timelineKey: "show_3_sb_led" } },
        { label: "Space Bridge Projection — show", target: "sb.portalProj", action: "video.play", params: { timelineKey: "show_3_sb_proj" } },
        { label: "Cinema Columns BrightSign — show", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "show_3_columns" } }
      ]
    },

    onEnd: [
      { label: "Stop all xyz video", target: { tags: ["xyz", "video"] }, action: "video.stop", params: {} },
      { label: "MA — post-show return", target: { tags: ["xyz", "lighting"] }, action: "lighting.goCue", params: { cueKey: "post_show_return" } },
      { label: "Pharos — post-show return", target: { tags: ["lighting", "strips"] }, action: "lighting.goCue", params: { cueKey: "post_show_return" } },
      { label: "QSC — return to BGM", target: { tags: ["xyz", "audio"] }, action: "audio.snapshotRecall", params: { snapshotId: "ambience_bgm" } },
      { label: "Dome Screen — return to ambience", target: "ds.domeLed", action: "video.play", params: { timelineKey: "ambience_dome" } },
      { label: "Space Bridge — return to ambience", target: ["sb.portalLed", "sb.portalProj"], action: "video.play", params: { timelineKey: "ambience_sb" } },
      { label: "Cinema Columns — return to ambience", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "ambience_columns" } }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // SHOW 4
  // ═══════════════════════════════════════════════════════════
  show_4: {
    label: "Show 4",
    duration: 120000,

    onStart: [
      { label: "Start A1 video transition", target: "a1.video", action: "video.play", params: { timelineKey: "transition_a1" } },
      { label: "Start A2 video transition", target: "a2.video", action: "video.play", params: { timelineKey: "transition_a2" } },
      { label: "Start A3 video transition", target: "a3.video", action: "video.play", params: { timelineKey: "transition_a3" } },
      { label: "MA — preshow cue", target: { tags: ["xyz", "lighting"] }, action: "lighting.goCue", params: { cueKey: "preshow" } },
      { label: "QSC — preshow snapshot", target: { tags: ["xyz", "audio"] }, action: "audio.snapshotRecall", params: { snapshotId: "preshow" } },
      { label: "Pharos 1,2,3,4 — preshow cue", target: { tags: ["lighting", "strips"] }, action: "lighting.goCue", params: { cueKey: "preshow" } },
      { label: "Mint FEC Show Control — preshow cue", target: "mint.showControl", action: "showcontrol.sendCue", params: { cueKey: "preshow" } },
      { label: "Dome Screen WO6 — preshow", target: "ds.domeLed", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Space Bridge LED — preshow", target: "sb.portalLed", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Space Bridge Projection — preshow", target: "sb.portalProj", action: "video.play", params: { timelineKey: "preshow" } },
      { label: "Cinema Columns BrightSign — preshow", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "preshow" } }
    ],

    onCue: {
      all_opaque: [
        { label: "Start Show 4 unified timeline", target: { tags: ["xyz", "video"] }, action: "video.play", params: { timelineKey: "show_4" } },
        { label: "Dome Screen WO6 — show", target: "ds.domeLed", action: "video.play", params: { timelineKey: "show_4_dome" } },
        { label: "Space Bridge LED — show", target: "sb.portalLed", action: "video.play", params: { timelineKey: "show_4_sb_led" } },
        { label: "Space Bridge Projection — show", target: "sb.portalProj", action: "video.play", params: { timelineKey: "show_4_sb_proj" } },
        { label: "Cinema Columns BrightSign — show", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "show_4_columns" } }
      ]
    },

    onEnd: [
      { label: "Stop all xyz video", target: { tags: ["xyz", "video"] }, action: "video.stop", params: {} },
      { label: "MA — post-show return", target: { tags: ["xyz", "lighting"] }, action: "lighting.goCue", params: { cueKey: "post_show_return" } },
      { label: "Pharos — post-show return", target: { tags: ["lighting", "strips"] }, action: "lighting.goCue", params: { cueKey: "post_show_return" } },
      { label: "QSC — return to BGM", target: { tags: ["xyz", "audio"] }, action: "audio.snapshotRecall", params: { snapshotId: "ambience_bgm" } },
      { label: "Dome Screen — return to ambience", target: "ds.domeLed", action: "video.play", params: { timelineKey: "ambience_dome" } },
      { label: "Space Bridge — return to ambience", target: ["sb.portalLed", "sb.portalProj"], action: "video.play", params: { timelineKey: "ambience_sb" } },
      { label: "Cinema Columns — return to ambience", target: "cc.cinemaColumnsLed", action: "video.play", params: { timelineKey: "ambience_columns" } }
    ]
  }

};

// Store to global context
global.set('showScripts', showScripts);
node.status({ fill: "green", shape: "dot", text: "show scripts loaded" });
```

---

## TCP Formatter

Watchout sends plain TCP strings at each cue point. A formatter function node
normalises them before they reach the Transition Gate or Show Executor:

```javascript
// On Message tab — "TCP Formatter" function node
const raw = msg.payload.toString().trim();

// Per-space opaque cues → Transition Gate
if (raw === "transition_a1_opaque") return [null, { payload: { space: "a1" } }];
if (raw === "transition_a2_opaque") return [null, { payload: { space: "a2" } }];
if (raw === "transition_a3_opaque") return [null, { payload: { space: "a3" } }];

// Show end → Show Executor
if (raw === "show_end") return [{ payload: { event: "end" } }, null];

// Any other named cue → Show Executor as generic cue
return [{ payload: { event: "cue", cueName: raw } }, null];
```

Output 1 → Show Executor  
Output 2 → Transition Gate

---

## Relationship to Other Registries

| File | Contains | Used by |
|---|---|---|
| `item-registry` | What items exist, zones, tags, systems | Target Resolver |
| `content-registry` | What content exists (high-level labels) | UI dropdowns, scheduler |
| `show-scripts` | Exact step-by-step sequence per show | Show Executor + Transition Gate |
| `timeline-mapping.json` | Watchout timeline name → numeric ID | Watchout adapter |

---

## Summary — Where Things Live

| Question | Answer | Where to look |
|---|---|---|
| What fires immediately on show trigger? | `onStart` commands | Show Scripts fn node |
| When does the show timeline start? | When Transition Gate fires | Transition Gate fn node |
| What fires when all atriums are opaque? | `onCue["all_opaque"]` | Show Scripts fn node |
| What if A3 cue is late or missing? | 3s one-shot timeout from first receipt | Transition Gate fn node |
| What fires when show ends? | `onEnd` commands | Show Scripts fn node |
| Is a show allowed to start? | State machine guard | State Machine fn node |
| What Watchout timeline ID maps to "show_1"? | `timeline-mapping.json` | Auto-generated in `/data/` |
| What systems does a show affect? | item-registry tags | Item Registry fn node |
