# Content Registry — Reference & Usage Guide

**Node:** `Content Registry` function node (On Start tab)  
**Stores to:** `global.contentRegistry`  
**Related:** `item-registry.json`, `docs/item-registry.md`

---

## What It Is

The Content Registry is the **single source of truth for what content exists and what it does**. It defines:

- **What shows exist** and what commands they fire across all systems
- **What ambiences exist** and how they differ per space
- **What special content exists** (overlays, fullscreen) and what they affect

It is a companion to the Item Registry:

| Registry | Answers the question |
|---|---|
| `item-registry` | What items exist, where are they, what system drives them? |
| `content-registry` | What content exists, what commands does it fire, on which targets? |

Neither registry knows about the other's internals — they are connected only through the **Action Mapper**, which reads both to translate a state machine transition into concrete command envelopes.

---

## Design Principles

- **Content is data, not state** — the state machine tracks *what kind of thing is happening* (SHOW, AMBIENCE, etc.), not *which specific content is playing*. Content keys travel as parameters alongside state machine events.
- **Commands use item-registry targets** — every command in the content registry uses the same `target` vocabulary as the command envelope system (`zone id`, `{ zone, tags }`, `item id`). The Target Resolver expands them.
- **Per-space flexibility** — ambiences can define different commands per space, allowing A1 to play `ambience_1_a1` while A2 plays `ambience_1_a2` simultaneously.
- **Single place to update** — adding a new show or changing which timeline plays only requires updating this registry. No flow logic changes needed.

---

## Where It Lives

The Content Registry is defined inside a dedicated **function node** on the `Config / Registries` tab in Node-RED. On Start, it stores the object to `global.contentRegistry` so every other node in the flow can read it.

```
[ Config / Registries tab ]

  ┌─────────────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
  │   Item Registry     │     │  Content Registry   │     │   State Machine     │
  │   (function node)   │     │  (function node)    │     │   (function node)   │
  │   ● registry loaded │     │  ● registry loaded  │     │   ● IDLE            │
  └──────────────────���──┘     └─────────────────────┘     └─────────────────────┘
          │                           │                            │
          ▼                           ▼                            ▼
  global.itemRegistry        global.contentRegistry        flow.xstate_actor
```

---

## Registry Structure

```
contentRegistry
├── shows
│   ├── show_1          ← global, all xyz items
│   ├── show_2
│   ├── show_3
│   └── show_4
├── ambiences
│   ├── ambience_1      ← per-space, each space has its own commands
│   └── ambience_2
└── specialContent
    ├── special_overlay_1     ← on-top overlay
    ├── special_overlay_2
    ├── special_fullscreen_1  ← fullscreen takeover
    └── special_fullscreen_2
```

---

## Content Types

### Shows

Shows are **global** — they fire across all `xyz`-tagged items simultaneously. Only one show can be active at a time (enforced by the state machine).

| Field | Type | Description |
|---|---|---|
| `label` | string | Human-readable name |
| `duration` | number | Duration in milliseconds |
| `commands` | array | List of command objects to fire when show starts |

Each command object:

| Field | Type | Description |
|---|---|---|
| `target` | string \| object | Item ID, zone ID, or `{ zone, tags }` filter — same as command envelope |
| `action` | string | Domain-namespaced action verb (`video.play`, `lighting.goCue`, etc.) |
| `params` | object | Parameters for the action |

---

### Ambiences

Ambiences are **per-space** — each space can run a different ambience simultaneously. They support:
- Space-specific commands (different timeline per space)
- Global commands that fire regardless of which space (e.g. BGM snapshot)

| Field | Type | Description |
|---|---|---|
| `label` | string | Human-readable name |
| `perSpace` | boolean | Always `true` for ambiences |
| `spaces` | object | Map of `zoneId → { commands }` |
| `globalCommands` | array | Commands that always fire for this ambience |

---

### Special Content

Special content is **context-driven** — it either overlays on top of ambience (`onTop`) or takes over a space (`fullScreen`).

| Field | Type | Description |
|---|---|---|
| `label` | string | Human-readable name |
| `type` | string | `"onTop"` or `"fullScreen"` |
| `hasAudio` | boolean | Whether this content brings its own audio |
| `commands` | array | Commands to fire when content starts |
| `endCommands` | array | Commands to fire when content ends (restore state) |

---

## Full Registry Definition

```javascript
const contentRegistry = {

  // ─────────────────────────────────────────────────────────────
  // SHOWS
  // Global — fires across all xyz-tagged items simultaneously
  // One show active at a time (state machine enforces this)
  // ─────────────────────────────────────────────────────────────
  shows: {

    show_1: {
      label: "Show 1",
      duration: 120000,  // 2 minutes in ms
      commands: [
        {
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_1" }
        },
        {
          target: { tags: ["xyz", "lighting"] },
          action: "lighting.goCue",
          params: { cueKey: "show_1" }
        },
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.snapshotRecall",
          params: { snapshotId: "show_1" }
        }
      ]
    },

    show_2: {
      label: "Show 2",
      duration: 120000,
      commands: [
        {
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_2" }
        },
        {
          target: { tags: ["xyz", "lighting"] },
          action: "lighting.goCue",
          params: { cueKey: "show_2" }
        },
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.snapshotRecall",
          params: { snapshotId: "show_2" }
        }
      ]
    },

    show_3: {
      label: "Show 3",
      duration: 120000,
      commands: [
        {
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_3" }
        },
        {
          target: { tags: ["xyz", "lighting"] },
          action: "lighting.goCue",
          params: { cueKey: "show_3" }
        },
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.snapshotRecall",
          params: { snapshotId: "show_3" }
        }
      ]
    },

    show_4: {
      label: "Show 4",
      duration: 120000,
      commands: [
        {
          target: { tags: ["xyz", "video"] },
          action: "video.play",
          params: { timelineKey: "show_4" }
        },
        {
          target: { tags: ["xyz", "lighting"] },
          action: "lighting.goCue",
          params: { cueKey: "show_4" }
        },
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.snapshotRecall",
          params: { snapshotId: "show_4" }
        }
      ]
    }

  },

  // ─────────────────────────────────────────────────────────────
  // AMBIENCES
  // Per-space — each space runs independently
  // Spaces can run different ambiences simultaneously
  // ─────────────────────────────────────────────────────────────
  ambiences: {

    ambience_1: {
      label: "Ambience 1",
      perSpace: true,
      spaces: {
        a1: {
          commands: [
            {
              target: { zone: "a1", tags: ["video"] },
              action: "video.play",
              params: { timelineKey: "ambience_1_a1" }
            },
            {
              target: { zone: "a1", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_1" }
            }
          ]
        },
        a2: {
          commands: [
            {
              target: { zone: "a2", tags: ["video"] },
              action: "video.play",
              params: { timelineKey: "ambience_1_a2" }
            },
            {
              target: { zone: "a2", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_1" }
            }
          ]
        },
        a3: {
          commands: [
            {
              target: { zone: "a3", tags: ["video"] },
              action: "video.play",
              params: { timelineKey: "ambience_1_a3" }
            },
            {
              target: { zone: "a3", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_1" }
            }
          ]
        },
        ls: {
          commands: [
            {
              target: { zone: "ls", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_1_landscape" }
            },
            {
              target: "ls.audio",
              action: "audio.setLevel",
              params: { inputKey: "bgm", db: -30 }
            }
          ]
        }
      },
      globalCommands: [
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.snapshotRecall",
          params: { snapshotId: "ambience_bgm" }
        }
      ]
    },

    ambience_2: {
      label: "Ambience 2",
      perSpace: true,
      spaces: {
        a1: {
          commands: [
            {
              target: { zone: "a1", tags: ["video"] },
              action: "video.play",
              params: { timelineKey: "ambience_2_a1" }
            },
            {
              target: { zone: "a1", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_2" }
            }
          ]
        },
        a2: {
          commands: [
            {
              target: { zone: "a2", tags: ["video"] },
              action: "video.play",
              params: { timelineKey: "ambience_2_a2" }
            },
            {
              target: { zone: "a2", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_2" }
            }
          ]
        },
        a3: {
          commands: [
            {
              target: { zone: "a3", tags: ["video"] },
              action: "video.play",
              params: { timelineKey: "ambience_2_a3" }
            },
            {
              target: { zone: "a3", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_2" }
            }
          ]
        },
        ls: {
          commands: [
            {
              target: { zone: "ls", tags: ["lighting"] },
              action: "lighting.goCue",
              params: { cueKey: "ambience_2_landscape" }
            },
            {
              target: "ls.audio",
              action: "audio.setLevel",
              params: { inputKey: "bgm", db: -30 }
            }
          ]
        }
      },
      globalCommands: [
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.snapshotRecall",
          params: { snapshotId: "ambience_bgm" }
        }
      ]
    }

  },

  // ─────────────────────────────────────────────────────────────
  // SPECIAL CONTENT
  // Context-driven — overlays on top of ambience or takes over
  // onTop: overlays on ribbon/column (rarely sphere)
  // fullScreen: takes over Atriums 1–3 selectively
  // ─────────────────────────────────────────────────────────────
  specialContent: {

    special_overlay_1: {
      label: "Special Overlay 1",
      type: "onTop",
      hasAudio: true,
      commands: [
        {
          target: { zone: "a1", tags: ["video", "led"] },
          action: "video.play",
          params: { timelineKey: "special_overlay_1" }
        },
        {
          // Duck BGM when overlay has audio
          target: { tags: ["xyz", "audio"] },
          action: "audio.setLevel",
          params: { inputKey: "bgm", db: -60 }
        }
      ],
      endCommands: [
        {
          // Restore BGM when overlay ends
          target: { tags: ["xyz", "audio"] },
          action: "audio.setLevel",
          params: { inputKey: "bgm", db: -30 }
        }
      ]
    },

    special_overlay_2: {
      label: "Special Overlay 2",
      type: "onTop",
      hasAudio: false,
      commands: [
        {
          // Video only — no audio change
          target: { zone: "a1", tags: ["video", "led"] },
          action: "video.play",
          params: { timelineKey: "special_overlay_2" }
        }
      ],
      endCommands: []
    },

    special_fullscreen_1: {
      label: "Special Fullscreen 1",
      type: "fullScreen",
      hasAudio: false,
      // Takes over A1, A2, A3 — BGM continues
      commands: [
        {
          target: { zone: "a1", tags: ["video"] },
          action: "video.play",
          params: { timelineKey: "special_fullscreen_1_a1" }
        },
        {
          target: { zone: "a2", tags: ["video"] },
          action: "video.play",
          params: { timelineKey: "special_fullscreen_1_a2" }
        },
        {
          target: { zone: "a3", tags: ["video"] },
          action: "video.play",
          params: { timelineKey: "special_fullscreen_1_a3" }
        }
      ],
      endCommands: [
        {
          // Return to ambience on all three atriums
          target: ["a1", "a2", "a3"],
          action: "video.play",
          params: { timelineKey: "ambience_return" }
        }
      ]
    },

    special_fullscreen_2: {
      label: "Special Fullscreen 2",
      type: "fullScreen",
      hasAudio: true,
      commands: [
        {
          target: { zone: "a1", tags: ["video"] },
          action: "video.play",
          params: { timelineKey: "special_fullscreen_2_a1" }
        },
        {
          target: { zone: "a2", tags: ["video"] },
          action: "video.play",
          params: { timelineKey: "special_fullscreen_2_a2" }
        },
        {
          target: { zone: "a3", tags: ["video"] },
          action: "video.play",
          params: { timelineKey: "special_fullscreen_2_a3" }
        },
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.setLevel",
          params: { inputKey: "bgm", db: -90 }
        }
      ],
      endCommands: [
        {
          target: ["a1", "a2", "a3"],
          action: "video.play",
          params: { timelineKey: "ambience_return" }
        },
        {
          target: { tags: ["xyz", "audio"] },
          action: "audio.setLevel",
          params: { inputKey: "bgm", db: -30 }
        }
      ]
    }

  }

};

// Store to global context
global.set('contentRegistry', contentRegistry);
node.status({ fill: "green", shape: "dot", text: "content registry loaded" });
```

---

## How It Connects to Everything Else

### The flow of a "Start Show 1" command

```
UI Button press
      │
      │  msg.payload = { event: "Start Show", params: { contentKey: "show_1" } }
      ▼
[ State Machine ]
      │  guard: Prayer → passes
      │  IDLE → SHOW
      │  emits: { state: "SHOW", contentKey: "show_1" }
      ▼
[ Action Mapper ]
      │  reads: global.contentRegistry.shows["show_1"]
      │  builds: 3 command envelopes (video + lighting + audio)
      ▼
[ Target Resolver ]
      │  reads: global.itemRegistry
      │  expands: { tags:["xyz","video"] } → [a1.ribbonLed, a1.sphereLed, ...]
      ▼
[ Router ]
      │  groups by system
      ├──▶ Watchout7 adapter  → POST /v0/play/{id}
      ├──▶ MA adapter         → trigger cue
      └──▶ QSC adapter        → snapshot recall
```

### The flow of "Start Ambience 1 in A1"

```
UI Button press
      │
      │  msg.payload = { event: "Trans to Normal", params: { contentKey: "ambience_1", space: "a1" } }
      ▼
[ State Machine ]
      │  IDLE → NORMAL (A1 AMBIENCE = AMBIENCE)
      │  emits: { state: { "A1 AMBIENCE": "AMBIENCE", ... }, contentKey: "ambience_1", space: "a1" }
      ▼
[ Action Mapper ]
      │  reads: global.contentRegistry.ambiences["ambience_1"].spaces["a1"]
      │  + globalCommands
      │  builds: command envelopes for A1 video + A1 lighting + global BGM
      ▼
[ Target Resolver + Router + Adapters ]
```

---

## Action Mapper — How It Uses the Registry

The Action Mapper function node reads both registries and translates state machine output into command envelopes:

```javascript
// On Message tab of Action Mapper function node

const contentRegistry = global.get('contentRegistry');
const { state, contentKey, space } = msg.payload;
let commands = [];

// ── SHOW ──────────────────────────────────────────────────────
if (state === "SHOW" && contentKey) {
  const show = contentRegistry.shows[contentKey];
  if (show) {
    commands = show.commands;
  } else {
    node.warn(`Unknown show contentKey: ${contentKey}`);
  }
}

// ── AMBIENCE (per space) ──────────────────────────────────────
if (typeof state === "object" && contentKey && space) {
  const ambience = contentRegistry.ambiences[contentKey];
  if (ambience) {
    const spaceCommands = ambience.spaces[space]?.commands || [];
    const globalCommands = ambience.globalCommands || [];
    commands = [...spaceCommands, ...globalCommands];
  }
}

// ── SPECIAL CONTENT ───────────────────────────────────────────
if (contentKey && contentRegistry.specialContent[contentKey]) {
  const special = contentRegistry.specialContent[contentKey];
  commands = special.commands;
}

// Emit each command as a separate message downstream
const msgs = commands.map(cmd => ({
  topic: "cmd",
  payload: { v: 1, source: "statemachine", ...cmd }
}));

return msgs.length ? [msgs] : null;
```

---

## Updating the Registry

### Adding a new show (e.g. Show 5)

Open the `Content Registry` function node → On Start tab → add to `shows`:

```javascript
show_5: {
  label: "Show 5",
  duration: 120000,
  commands: [
    {
      target: { tags: ["xyz", "video"] },
      action: "video.play",
      params: { timelineKey: "show_5" }
    },
    {
      target: { tags: ["xyz", "lighting"] },
      action: "lighting.goCue",
      params: { cueKey: "show_5" }
    },
    {
      target: { tags: ["xyz", "audio"] },
      action: "audio.snapshotRecall",
      params: { snapshotId: "show_5" }
    }
  ]
}
```

Click **Deploy**. No other changes needed anywhere.

---

### Adding a new ambience

Same pattern — add to `ambiences` with `perSpace: true` and a `spaces` object covering `a1`, `a2`, `a3`, `ls` as needed.

---

## Summary — The Three Registries

| Registry | Stored in | Answers |
|---|---|---|
| `item-registry` | `global.itemRegistry` | What items exist, where, which system |
| `content-registry` | `global.contentRegistry` | What content exists, what commands it fires |
| `timeline-mapping` | `global.watchout_mapping` | Watchout timeline name → numeric ID resolution |

All three are loaded on startup, stored in global context, and read by the Action Mapper and Target Resolver. None of them contain business logic — they are pure data.
