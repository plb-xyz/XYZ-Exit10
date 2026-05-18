# Show Scripts — Reference & Usage Guide

**Node:** `Show Scripts` function node (On Start tab)  
**Stores to:** `global.showScripts`  
**Related:** `docs/content-registry.md`, `docs/item-registry.md`

---

## What It Is

A Show Script defines the **exact sequence of steps** to execute a show — what fires immediately, what fires at a specific point during the show (triggered by Watchout), and what fires when the show ends.

It is distinct from the Content Registry, which only says "show_1 exists". The Show Script says "here is exactly how show_1 executes, in what order, and at what trigger points".

---

## Why It Exists

A show is not a single command. It is a **multi-phase, multi-system sequence** with timing dependencies:

- Some commands fire **immediately** when the show is triggered (pre-show preparation across all systems)
- Some commands fire **at a specific moment** during the transition — driven by a cue Watchout sends back to Node-RED when the transition takes over fullscreen
- Some commands fire **when the show ends** — returning all systems to their normal state

No static registry or simple command envelope can express this. A Show Script captures all three phases in one place, in the correct order.

---

## The Three Phases

```
SHOW TRIGGERED
      │
      ▼
┌─────────────────┐
│   onStart       │  Fires immediately when show is triggered
│                 │  Pre-show cues to all systems
│                 │  Start video transition timelines
└────────┬────────┘
         │  Watchout transition timeline is now playing...
         │
         │  Watchout hits a named cue point → sends TCP message to Node-RED
         ▼
┌─────────────────┐
│   onCue         │  Fires when Watchout sends a specific cue name
│   "show_go"     │  Start main show timeline
│                 │  Send show cues to all satellite systems
└────────┬────────┘
         │  Show is running...
         │
         │  Watchout hits end cue → sends TCP message to Node-RED
         ▼
┌─────────────────┐
│   onEnd         │  Fires when show ends
│                 │  Return all systems to normal / ambience
│                 │  Sends "Trans to Normal" event to state machine
└─────────────────┘
```

**Watchout is the master clock.** Node-RED does not use timers to sequence show phases. Instead, Watchout sends named cue messages to Node-RED at the precise moment in the timeline when each phase should fire. This guarantees frame-accurate synchronisation across all systems.

---

## How Watchout Triggers Node-RED

Watchout can send a TCP string message at any cue point in a timeline. Node-RED listens on a TCP input node and routes incoming messages to the Show Executor.

```
Watchout Timeline
  ├── Cue: "show_go"   @ 00:00:08:00  → TCP → Node-RED → fires onCue["show_go"]
  └── Cue: "show_end"  @ 00:02:00:00  → TCP → Node-RED → fires onEnd
                                                        → sends "Trans to Normal"
                                                          to state machine
```

The cue name sent by Watchout matches the key in `onCue` exactly. The Show Executor looks up `onCue["show_go"]` and fires those commands.

---

## File Structure

```javascript
const showScripts = {

  show_1: {
    label: "Show 1",
    duration: 120000,        // ms — informational, not used for timing

    onStart: [ ...commands ],  // fires immediately on show trigger

    onCue: {
      show_go:  [ ...commands ],  // fires when Watchout sends "show_go"
      // add more cue points as needed
    },

    onEnd: [ ...commands ]     // fires when Watchout sends "show_end"
                               // (or when operator triggers end)
  },

  show_2: { ... },
  show_3: { ... },
  show_4: { ... }

};
```

Each command object uses the same structure as the unified command envelope:

| Field | Type | Description |
|---|---|---|
| `label` | string | Human-readable description (for logging) |
| `target` | string \| object \| array | Item ID, zone ID, tag filter, or explicit list |
| `action` | string | Domain-namespaced action verb |
| `params` | object | Parameters for the action |

---

## Full Show Scripts Definition

```javascript
const showScripts = {

  // ═══════════════════════════════════════════════════════════
  // SHOW 1
  // ═══════════════════════════════════════════════════════════
  show_1: {
    label: "Show 1",
    duration: 120000,

    // ── Phase 1: fires immediately when show is triggered ───
    onStart: [
      {
        label: "Start video transitions A1, A2, A3",
        target: { tags: ["xyz", "video"] },
        action: "video.play",
        params: { timelineKey: "transition_to_show" }
      },
      {
        label: "MA — preshow cue",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "QSC — preshow snapshot",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "preshow" }
      },
      {
        label: "Pharos 1,2,3,4 — preshow cue",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Mint FEC Show Control — preshow cue",
        target: "mint.showControl",
        action: "showcontrol.sendCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Dome Screen WO6 — preshow",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge LED 7th Sense — preshow",
        target: "sb.portalLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge Projection 7th Sense — preshow",
        target: "sb.portalProj",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Cinema Columns BrightSign — preshow",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      }
    ],

    // ── Phase 2: fires when Watchout sends cue "show_go" ───
    // Watchout hits this cue point once the transition
    // has taken over fullscreen — the exact moment to cut
    // all satellite systems to the live show content
    onCue: {
      show_go: [
        {
          label: "Start Show 1 main timeline",
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_1" }
        },
        {
          label: "Dome Screen WO6 — show",
          target: "ds.domeLed",
          action: "video.play",
          params: { timelineKey: "show_1_dome" }
        },
        {
          label: "Space Bridge LED — show",
          target: "sb.portalLed",
          action: "video.play",
          params: { timelineKey: "show_1_sb_led" }
        },
        {
          label: "Space Bridge Projection — show",
          target: "sb.portalProj",
          action: "video.play",
          params: { timelineKey: "show_1_sb_proj" }
        },
        {
          label: "Cinema Columns BrightSign — show",
          target: "cc.cinemaColumnsLed",
          action: "video.play",
          params: { timelineKey: "show_1_columns" }
        }
      ]
    },

    // ── Phase 3: fires when Watchout sends cue "show_end" ──
    // Returns all systems to their normal ambience state
    // Also triggers "Trans to Normal" event on state machine
    onEnd: [
      {
        label: "Stop all xyz video",
        target: { tags: ["xyz", "video"] },
        action: "video.stop",
        params: {}
      },
      {
        label: "MA — post-show return to ambience",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "Pharos — post-show return",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "QSC — return to BGM",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "ambience_bgm" }
      },
      {
        label: "Dome Screen — return to ambience",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "ambience_dome" }
      },
      {
        label: "Space Bridge — return to ambience",
        target: ["sb.portalLed", "sb.portalProj"],
        action: "video.play",
        params: { timelineKey: "ambience_sb" }
      },
      {
        label: "Cinema Columns — return to ambience",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "ambience_columns" }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // SHOW 2
  // ═══════════════════════════════════════════════════════════
  show_2: {
    label: "Show 2",
    duration: 120000,

    onStart: [
      {
        label: "Start video transitions A1, A2, A3",
        target: { tags: ["xyz", "video"] },
        action: "video.play",
        params: { timelineKey: "transition_to_show" }
      },
      {
        label: "MA — preshow cue",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "QSC — preshow snapshot",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "preshow" }
      },
      {
        label: "Pharos 1,2,3,4 — preshow cue",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Mint FEC Show Control — preshow cue",
        target: "mint.showControl",
        action: "showcontrol.sendCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Dome Screen WO6 — preshow",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge LED — preshow",
        target: "sb.portalLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge Projection — preshow",
        target: "sb.portalProj",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Cinema Columns BrightSign — preshow",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      }
    ],

    onCue: {
      show_go: [
        {
          label: "Start Show 2 main timeline",
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_2" }
        },
        {
          label: "Dome Screen WO6 — show",
          target: "ds.domeLed",
          action: "video.play",
          params: { timelineKey: "show_2_dome" }
        },
        {
          label: "Space Bridge LED — show",
          target: "sb.portalLed",
          action: "video.play",
          params: { timelineKey: "show_2_sb_led" }
        },
        {
          label: "Space Bridge Projection — show",
          target: "sb.portalProj",
          action: "video.play",
          params: { timelineKey: "show_2_sb_proj" }
        },
        {
          label: "Cinema Columns BrightSign — show",
          target: "cc.cinemaColumnsLed",
          action: "video.play",
          params: { timelineKey: "show_2_columns" }
        }
      ]
    },

    onEnd: [
      {
        label: "Stop all xyz video",
        target: { tags: ["xyz", "video"] },
        action: "video.stop",
        params: {}
      },
      {
        label: "MA — post-show return to ambience",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "Pharos — post-show return",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "QSC — return to BGM",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "ambience_bgm" }
      },
      {
        label: "Dome Screen — return to ambience",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "ambience_dome" }
      },
      {
        label: "Space Bridge — return to ambience",
        target: ["sb.portalLed", "sb.portalProj"],
        action: "video.play",
        params: { timelineKey: "ambience_sb" }
      },
      {
        label: "Cinema Columns — return to ambience",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "ambience_columns" }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // SHOW 3
  // ═══════════════════════════════════════════════════════════
  show_3: {
    label: "Show 3",
    duration: 120000,

    onStart: [
      {
        label: "Start video transitions A1, A2, A3",
        target: { tags: ["xyz", "video"] },
        action: "video.play",
        params: { timelineKey: "transition_to_show" }
      },
      {
        label: "MA — preshow cue",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "QSC — preshow snapshot",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "preshow" }
      },
      {
        label: "Pharos 1,2,3,4 — preshow cue",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Mint FEC Show Control — preshow cue",
        target: "mint.showControl",
        action: "showcontrol.sendCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Dome Screen WO6 — preshow",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge LED — preshow",
        target: "sb.portalLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge Projection — preshow",
        target: "sb.portalProj",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Cinema Columns BrightSign — preshow",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      }
    ],

    onCue: {
      show_go: [
        {
          label: "Start Show 3 main timeline",
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_3" }
        },
        {
          label: "Dome Screen WO6 — show",
          target: "ds.domeLed",
          action: "video.play",
          params: { timelineKey: "show_3_dome" }
        },
        {
          label: "Space Bridge LED — show",
          target: "sb.portalLed",
          action: "video.play",
          params: { timelineKey: "show_3_sb_led" }
        },
        {
          label: "Space Bridge Projection — show",
          target: "sb.portalProj",
          action: "video.play",
          params: { timelineKey: "show_3_sb_proj" }
        },
        {
          label: "Cinema Columns BrightSign — show",
          target: "cc.cinemaColumnsLed",
          action: "video.play",
          params: { timelineKey: "show_3_columns" }
        }
      ]
    },

    onEnd: [
      {
        label: "Stop all xyz video",
        target: { tags: ["xyz", "video"] },
        action: "video.stop",
        params: {}
      },
      {
        label: "MA — post-show return to ambience",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "Pharos — post-show return",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "QSC — return to BGM",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "ambience_bgm" }
      },
      {
        label: "Dome Screen — return to ambience",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "ambience_dome" }
      },
      {
        label: "Space Bridge — return to ambience",
        target: ["sb.portalLed", "sb.portalProj"],
        action: "video.play",
        params: { timelineKey: "ambience_sb" }
      },
      {
        label: "Cinema Columns — return to ambience",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "ambience_columns" }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════
  // SHOW 4
  // ═══════════════════════════════════════════════════════════
  show_4: {
    label: "Show 4",
    duration: 120000,

    onStart: [
      {
        label: "Start video transitions A1, A2, A3",
        target: { tags: ["xyz", "video"] },
        action: "video.play",
        params: { timelineKey: "transition_to_show" }
      },
      {
        label: "MA — preshow cue",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "QSC — preshow snapshot",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "preshow" }
      },
      {
        label: "Pharos 1,2,3,4 — preshow cue",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Mint FEC Show Control — preshow cue",
        target: "mint.showControl",
        action: "showcontrol.sendCue",
        params: { cueKey: "preshow" }
      },
      {
        label: "Dome Screen WO6 — preshow",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge LED — preshow",
        target: "sb.portalLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Space Bridge Projection — preshow",
        target: "sb.portalProj",
        action: "video.play",
        params: { timelineKey: "preshow" }
      },
      {
        label: "Cinema Columns BrightSign — preshow",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "preshow" }
      }
    ],

    onCue: {
      show_go: [
        {
          label: "Start Show 4 main timeline",
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_4" }
        },
        {
          label: "Dome Screen WO6 — show",
          target: "ds.domeLed",
          action: "video.play",
          params: { timelineKey: "show_4_dome" }
        },
        {
          label: "Space Bridge LED — show",
          target: "sb.portalLed",
          action: "video.play",
          params: { timelineKey: "show_4_sb_led" }
        },
        {
          label: "Space Bridge Projection — show",
          target: "sb.portalProj",
          action: "video.play",
          params: { timelineKey: "show_4_sb_proj" }
        },
        {
          label: "Cinema Columns BrightSign — show",
          target: "cc.cinemaColumnsLed",
          action: "video.play",
          params: { timelineKey: "show_4_columns" }
        }
      ]
    },

    onEnd: [
      {
        label: "Stop all xyz video",
        target: { tags: ["xyz", "video"] },
        action: "video.stop",
        params: {}
      },
      {
        label: "MA — post-show return to ambience",
        target: { tags: ["xyz", "lighting"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "Pharos — post-show return",
        target: { tags: ["lighting", "strips"] },
        action: "lighting.goCue",
        params: { cueKey: "post_show_return" }
      },
      {
        label: "QSC — return to BGM",
        target: { tags: ["xyz", "audio"] },
        action: "audio.snapshotRecall",
        params: { snapshotId: "ambience_bgm" }
      },
      {
        label: "Dome Screen — return to ambience",
        target: "ds.domeLed",
        action: "video.play",
        params: { timelineKey: "ambience_dome" }
      },
      {
        label: "Space Bridge — return to ambience",
        target: ["sb.portalLed", "sb.portalProj"],
        action: "video.play",
        params: { timelineKey: "ambience_sb" }
      },
      {
        label: "Cinema Columns — return to ambience",
        target: "cc.cinemaColumnsLed",
        action: "video.play",
        params: { timelineKey: "ambience_columns" }
      }
    ]
  }

};

// Store to global context
global.set('showScripts', showScripts);
node.status({ fill: "green", shape: "dot", text: "show scripts loaded" });
```

---

## The Show Executor

The Show Executor is the Node-RED function node that **walks through a show script**. It receives three types of input messages:

| Input | Source | Action |
|---|---|---|
| `{ event: "start", showKey: "show_1" }` | State machine / UI | Fires `onStart` commands |
| `{ event: "cue", cueName: "show_go" }` | Watchout TCP listener | Fires `onCue["show_go"]` commands |
| `{ event: "end" }` | Watchout TCP listener | Fires `onEnd` commands + sends "Trans to Normal" to state machine |

```javascript
// On Message tab of Show Executor function node

const showScripts = global.get('showScripts');

const { event, showKey, cueName } = msg.payload;

// Retrieve the active show key from flow context
// (set when onStart fires, cleared when onEnd fires)
const activeShowKey = showKey || flow.get('activeShowKey');

if (!activeShowKey || !showScripts[activeShowKey]) {
  node.warn(`Show Executor: unknown or missing showKey "${activeShowKey}"`);
  return null;
}

const script = showScripts[activeShowKey];
let commands = [];

if (event === "start") {
  flow.set('activeShowKey', activeShowKey);
  commands = script.onStart;
  node.warn(`Show Executor: starting ${script.label} — firing ${commands.length} onStart commands`);
}
else if (event === "cue" && cueName) {
  commands = script.onCue?.[cueName] || [];
  if (commands.length === 0) {
    node.warn(`Show Executor: no onCue handler for cue "${cueName}" in ${script.label}`);
  } else {
    node.warn(`Show Executor: cue "${cueName}" — firing ${commands.length} commands`);
  }
}
else if (event === "end") {
  commands = script.onEnd;
  flow.set('activeShowKey', null);
  node.warn(`Show Executor: ending ${script.label} — firing ${commands.length} onEnd commands`);

  // Tell state machine show is over
  node.send([null, {
    topic: "statemachine",
    payload: { event: "Trans to Normal" }
  }]);
}

// Emit each command as a separate message on output 1
const msgs = commands.map(cmd => ({
  topic: "cmd",
  payload: {
    v: 1,
    source: "show_executor",
    label: cmd.label,
    target: cmd.target,
    action: cmd.action,
    params: cmd.params
  }
}));

return msgs.length ? [msgs] : null;
```

### Show Executor outputs

```
                    ┌─────────────────────────┐
                    │     Show Executor       │
                    │                         │
Watchout TCP ──────▶│  onStart / onCue / onEnd│──── output 1: command envelopes
State Machine ─────▶│                         │         → Target Resolver → Router
                    │                         │──── output 2: state machine events
                    └─────��───────────────────┘         "Trans to Normal" on end
```

---

## How Watchout TCP Triggers Reach the Show Executor

Watchout sends a plain TCP string at each cue point. A Node-RED TCP input node receives it and formats it for the Show Executor:

```javascript
// TCP input formatter function node
// Watchout sends: "show_go\r\n" or "show_end\r\n"

const raw = msg.payload.toString().trim();

if (raw === "show_end") {
  msg.payload = { event: "end" };
} else {
  // Any other cue name → route to onCue handler
  msg.payload = { event: "cue", cueName: raw };
}

return msg;
```

The flow looks like this:

```
[TCP input node]
      │  raw string: "show_go"
      ▼
[TCP formatter fn]
      │  { event: "cue", cueName: "show_go" }
      ▼
[Show Executor fn]
      │  fires onCue["show_go"] commands
      ▼
[Target Resolver → Router → Adapters]
```

---

## Relationship to Other Registries

| File | Contains | Used by |
|---|---|---|
| `item-registry` | What items exist, zones, tags, systems | Target Resolver |
| `content-registry` | What content exists (high-level labels) | UI dropdowns, scheduler |
| `show-scripts` | Exact step-by-step sequence per show | Show Executor |
| `timeline-mapping.json` | Watchout timeline name → numeric ID | Watchout adapter |

### Why `timeline-mapping.json` is still needed

Show Scripts use human-readable `timelineKey` names (e.g. `"show_1"`). The Watchout HTTP adapter must convert these to numeric IDs (e.g. `"3"`) to make actual API calls. `timeline-mapping.json` is that lookup table — auto-generated by Watchout discovery, never hand-edited.

```
show-scripts          timeline-mapping.json      Watchout HTTP API
timelineKey: "show_1" → watchoutTimelineId: "3" → POST /v0/play/3
```

They are in series, not in competition.

---

## Adding or Changing a Show Sequence

### To change what fires at show_go for Show 2
Open the `Show Scripts` function node → On Start tab → find `show_2.onCue.show_go` → edit the commands → Deploy.

No other nodes need to change.

### To add a new cue point mid-show (e.g. "lights_change" at 01:00)
1. Add the cue point in Watchout at the correct timecode, with TCP output string `"lights_change"`
2. Add to `show-scripts` in `show_2.onCue`:
```javascript
lights_change: [
  {
    label: "MA — mid-show lighting change",
    target: { tags: ["xyz", "lighting"] },
    action: "lighting.goCue",
    params: { cueKey: "show_2_mid" }
  }
]
```
3. Deploy.

No TCP formatter changes, no Show Executor changes, no adapter changes.

---

## Summary — Where Things Live

| Question | Answer | Where to look |
|---|---|---|
| What fires when show starts? | `onStart` commands | Show Scripts function node |
| What fires mid-show at a specific moment? | `onCue` commands | Show Scripts function node |
| What fires when show ends? | `onEnd` commands | Show Scripts function node |
| What's the Watchout timeline numeric ID? | `timeline-mapping.json` | Auto-generated, `/data/timeline-mapping.json` |
| Is a show allowed to start? | State machine guard | State Machine function node |
| What systems does a show affect? | `item-registry` tags | Item Registry function node |
