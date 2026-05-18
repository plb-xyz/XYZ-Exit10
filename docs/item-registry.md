# Item Registry — Reference & Usage Guide

**File:** `node-red/config/item-registry.json`

---

## What It Is

The Item Registry is the **single source of truth** for every controllable endpoint in the Exit10 installation. It defines:

- **What** exists (items: screens, speakers, lights, practicals)
- **Where** it lives (zone hierarchy: All → Indoors/Outdoors → Atrium 1, Space Bridge, etc.)
- **What it is** (tags: `video`, `audio`, `lighting`, `xyz`, `strips`, etc.)
- **What system drives it** (system + device: `watchout7`, `qsc`, `ma`, `pharos`, etc.)

The UI, scheduler, and automation flows **target items or zones by ID**. The router resolves those targets into concrete items using this registry, then dispatches to the correct system adapter. Neither the UI nor the scheduler ever needs to know which vendor system is behind a target.

---

## Design Principles

- **Vendor-agnostic targeting** — UI/scheduler speak in operational terms (`a1.ribbonLed`, `a1`, `video`), not system terms (`watchout7`, `ma`).
- **Single place to update** — changing the system behind a target (e.g. migrating from Watchout 6 to Watchout 7) only requires updating this file, not any UI logic.
- **Tag-based grouping** — items can be addressed by what they are, not just where they are.
- **Hierarchical zones** — targeting a zone automatically includes everything nested inside it.

---

## File Structure

The registry is a single JSON tree rooted at `"all"`. Each node is either a **zone** (has `zones` and/or `items` children) or an **item** (a leaf, has `tags`, `system`, `device`).

```
all
├── in  (Indoors)
│   ├── a1  (Atrium 1)
│   │   ├── a1.ribbonLed        ← item
│   │   ├── a1.sphereLed        ← item
│   │   ├── a1.audio            ← item
│   │   ├── a1.movingLights     ← item
│   │   ├── a1.hublessWheel.ring ← item
│   │   └── ...
│   ├── a2  (Atrium 2)
│   ├── a3  (Atrium 3)
│   ├── sb  (Space Bridge)
│   ├── ds  (Dome Screen)
│   ├── cc  (Cinema Columns)
│   ├── fb  (Food & Beverage)
│   └── it  (Interstellars)
└── ou  (Outdoors)
    ├── we  (West Entrance)
    ├── kl  (K Logo)
    ├── ls  (Landscape)
    ├── et  (External Transformers)
    └── wf  (Water Features)
```

### Zone fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique zone identifier (e.g. `"a1"`, `"in"`, `"all"`) |
| `label` | string | Human-readable name |
| `zones` | array | Child zones (optional) |
| `items` | array | Items directly in this zone (optional) |

### Item fields

| Field | Type | Description |
|---|---|---|
| `id` | string | Unique item identifier in `zone.item` format (e.g. `"a1.ribbonLed"`) |
| `label` | string | Human-readable name |
| `tags` | array | Classification tags (see Tag Vocabulary below) |
| `system` | string | The vendor system that controls this item |
| `device` | string | Specific device/endpoint identifier within that system |

---

## Zone IDs (Quick Reference)

| ID | Label |
|---|---|
| `all` | All (root) |
| `in` | Indoors |
| `ou` | Outdoors |
| `a1` | Atrium 1 |
| `a2` | Atrium 2 |
| `a3` | Atrium 3 |
| `sb` | Space Bridge |
| `ds` | Dome Screen |
| `cc` | Cinema Columns |
| `fb` | Food & Beverage |
| `it` | Interstellars |
| `we` | West Entrance |
| `kl` | K Logo |
| `ls` | Landscape |
| `et` | External Transformers |
| `wf` | Water Features |

---

## Tag Vocabulary

Tags classify items by media type, function, location, scope, and sub-group. Multiple tags per item are normal.

| Tag | Meaning | Example items |
|---|---|---|
| `video` | Any display / screen / projection output | `a1.ribbonLed`, `sb.portalProj`, `ds.domeLed` |
| `led` | LED panel specifically | `a1.ribbonLed`, `cc.cinemaColumnsLed` |
| `projection` | Projector output | `sb.portalProj` |
| `audio` | Any audio zone | `a1.audio`, `ls.audio`, `sb.transformerAudio` |
| `lighting` | Any lighting element | `a1.movingLights`, `a1.arch`, `fb.retails` |
| `lx` | Lighting (shorthand, used alongside `lighting`) | Same as `lighting` items |
| `moving` | Moving lights specifically | `a1.movingLights`, `a2.movingLights` |
| `strips` | LED strip fixtures | `a1.multiverseStrips`, `a1.handrailStrips`, `a2.ceilingStrips` |
| `practical` | Physical/mechanical effects | `wf.1`–`wf.4`, `et.smoke` |
| `xyz` | Client-facing / client-controlled scope | Most a1–a3 items, `we.led`, `kl.led` |
| `hublessWheel` | A1 Hubless Wheel sub-group | `a1.hublessWheel.*` |

Items **without** the `xyz` tag are venue-only (e.g. `ls.lights3`, `ls.lights4`, `fb.retails`).

---

## Item IDs (Full List)

### Atrium 1 (`a1`)
| Item ID | Label | Tags | System |
|---|---|---|---|
| `a1.ribbonLed` | Ribbon LED | video, led, xyz | watchout7 |
| `a1.sphereLed` | Sphere LED | video, led, xyz | watchout7 |
| `a1.columnLed` | Column LED | video, led, xyz | watchout7 |
| `a1.audio` | Audio | audio, xyz | qsc |
| `a1.movingLights` | Moving Lights | lighting, lx, moving, xyz | ma |
| `a1.wisk` | Wisk | lighting, lx, xyz | ma |
| `a1.arch` | Arch | lighting, lx, xyz | ma |
| `a1.hublessWheel.movingLights` | Hubless Wheel – Moving Lights | lighting, lx, moving, xyz, hublessWheel | ma |
| `a1.hublessWheel.ring` | Hubless Wheel – Ring | lighting, lx, strips, xyz, hublessWheel | ma |
| `a1.hublessWheel.gondolas` | Hubless Wheel – Gondolas | lighting, lx, xyz, hublessWheel | ma |
| `a1.hublessWheel.gondolaBenches` | Hubless Wheel – Gondola Benches | lighting, lx, xyz, hublessWheel | ma |
| `a1.multiverseStrips` | Multiverse Strips | lighting, lx, strips | pharos |
| `a1.handrailStrips` | Handrail Strips | lighting, lx, strips | pharos |

### Atrium 2 (`a2`)
| Item ID | Label | Tags | System |
|---|---|---|---|
| `a2.ribbonLed` | Ribbon LED | video, led, xyz | watchout7 |
| `a2.audio` | Audio | audio, xyz | qsc |
| `a2.movingLights` | Moving Lights | lighting, lx, moving, xyz | ma |
| `a2.ceilingStrips` | Ceiling Strips | lighting, lx, strips | pharos |
| `a2.multiverseStrips` | Multiverse Strips | lighting, lx, strips | pharos |
| `a2.handrailStrips` | Handrail Strips | lighting, lx, strips | pharos |

### Atrium 3 (`a3`)
| Item ID | Label | Tags | System |
|---|---|---|---|
| `a3.ribbonLed` | Ribbon LED | video, led, xyz | watchout7 |
| `a3.audio` | Audio | audio, xyz | qsc |
| `a3.movingLights` | Moving Lights | lighting, lx, moving, xyz | ma |
| `a3.ceilingStrips` | Ceiling Strips | lighting, lx, strips | pharos |
| `a3.multiverseStrips` | Multiverse Strips | lighting, lx, strips | pharos |
| `a3.handrailStrips` | Handrail Strips | lighting, lx, strips | pharos |

### Space Bridge (`sb`)
| Item ID | Label | Tags | System |
|---|---|---|---|
| `sb.portalLed` | Portal LED | video, led | 7thsense |
| `sb.portalProj` | Portal Projection | video, projection | 7thsense |
| `sb.transformerLX` | Transformer Lighting | lighting, lx | ma |
| `sb.transformerAudio` | Transformer Audio | audio | qsc |

### Other Indoor Zones
| Item ID | Label | Tags | System |
|---|---|---|---|
| `ds.domeLed` | Dome LED | video, led | watchout6 |
| `cc.cinemaColumnsLed` | Cinema Columns LED | video, led | brightsign |
| `fb.retails` | Retail Lighting | lighting, lx | pharos |
| `it.audio` | Audio | audio, xyz | qsc |

### Outdoors
| Item ID | Label | Tags | System |
|---|---|---|---|
| `we.led` | West Entrance LED | video, led, xyz | watchout7 |
| `kl.led` | K Logo LED | video, led, xyz | watchout7 |
| `ls.lights1` | Landscape Lights 1 | lighting, lx, xyz | pharos |
| `ls.lights2` | Landscape Lights 2 | lighting, lx, xyz | pharos |
| `ls.lights3` | Landscape Lights 3 | lighting, lx | pharos |
| `ls.lights4` | Landscape Lights 4 | lighting, lx | pharos |
| `ls.audio` | Landscape Audio | audio, xyz | qsc |
| `et.lights` | Transformer Lights | lighting, lx | pharos |
| `et.sound` | Transformer Sound | audio | qsc |
| `et.smoke` | Transformer Smoke | practical | pharos |
| `wf.1` | Water Feature 1 | practical | pharos |
| `wf.2` | Water Feature 2 | practical | pharos |
| `wf.3` | Water Feature 3 | practical | pharos |
| `wf.4` | Water Feature 4 | practical | pharos |

---

## Command Envelope

The item registry is consumed via the **unified internal command envelope**. The UI, scheduler, and any automation send `msg.payload` in this shape:

```json
{
  "v": 1,
  "source": "ui | scheduler | auto | operator",
  "target": "<see targeting options below>",
  "action": "<domain.verb>",
  "params": { }
}
```

| Field | Required | Description |
|---|---|---|
| `v` | yes | Schema version. Always `1` for now. Allows future format changes without breaking flows. |
| `source` | yes | Who sent this command. Used for logging and ownership tracking. |
| `target` | yes | What to address. See all forms below. |
| `action` | yes | What to do. Domain-namespaced verb. See Action Vocabulary. |
| `params` | yes | Parameters for the action. Can be `{}` if none needed. |

`msg.topic` is always `"cmd"` for commands, `"evt"` for events/status.

---

## Target Forms

The `target` field accepts multiple forms. The router expands all of them into a flat list of concrete item IDs before dispatching.

### 1. Single item ID (string)
Address one specific item.

```json
"target": "a1.ribbonLed"
```

Resolves to: `[ a1.ribbonLed ]`

---

### 2. Zone ID (string)
Address everything in a zone, recursively.

```json
"target": "a1"
```

Resolves to: all items where `zone === "a1"`:
`[ a1.ribbonLed, a1.sphereLed, a1.columnLed, a1.audio, a1.movingLights, a1.wisk, a1.arch, a1.hublessWheel.movingLights, a1.hublessWheel.ring, a1.hublessWheel.gondolas, a1.hublessWheel.gondolaBenches, a1.multiverseStrips, a1.handrailStrips ]`

```json
"target": "in"
```

Resolves to: all items in all indoor zones (a1, a2, a3, sb, ds, cc, fb, it).

```json
"target": "all"
```

Resolves to: every item in the registry.

---

### 3. Tag filter (object)
Address all items that have a specific tag, regardless of zone.

```json
"target": { "tags": ["video"] }
```

Resolves to: every item tagged `video` across the whole installation.

```json
"target": { "tags": ["lighting", "moving"] }
```

Resolves to: every item tagged with **both** `lighting` AND `moving` (i.e. moving lights only).

---

### 4. Zone + tag filter (object)
Address items in a specific zone that also match a tag filter. The most precise group targeting form.

```json
"target": { "zone": "a1", "tags": ["video"] }
```

Resolves to: `[ a1.ribbonLed, a1.sphereLed, a1.columnLed ]`

```json
"target": { "zone": "a1", "tags": ["lighting", "strips"] }
```

Resolves to: `[ a1.hublessWheel.ring, a1.multiverseStrips, a1.handrailStrips ]`

```json
"target": { "zone": "in", "tags": ["audio"] }
```

Resolves to: all audio items indoors: `[ a1.audio, a2.audio, a3.audio, sb.transformerAudio, it.audio ]`

---

### 5. Explicit list (array)
Address an explicit, arbitrary set of items regardless of zone or tags.

```json
"target": ["a1.ribbonLed", "a2.ribbonLed", "a3.ribbonLed"]
```

Resolves to exactly those three items.

Mixed zone IDs and item IDs can be combined in an array — the router expands each entry and deduplicates:

```json
"target": ["a1.audio", "a2", "ls.audio"]
```

Resolves to: `a1.audio` + all items in `a2` + `ls.audio`.

---

## Action Vocabulary

Actions are domain-namespaced verbs. The UI and scheduler use these — adapters translate them to vendor-specific commands.

### Video
| Action | Description | Key params |
|---|---|---|
| `video.play` | Start / resume a timeline | `timelineKey` |
| `video.stop` | Stop a timeline | `timelineKey` |
| `video.pause` | Pause a timeline | `timelineKey` |
| `video.jumpToCue` | Jump to a named cue point | `timelineKey`, `cueKey`, `state?` |
| `video.jumpToTime` | Seek to a time position | `timelineKey`, `milliseconds`, `state?` |
| `video.setVar` | Set a Watchout input variable | `varName`, `varValue` |

### Audio
| Action | Description | Key params |
|---|---|---|
| `audio.setLevel` | Set a level/fader | `inputKey`, `db` |
| `audio.mute` | Mute an input | `inputKey` |
| `audio.unmute` | Unmute an input | `inputKey` |
| `audio.setSource` | Switch audio source | `sourceKey` |
| `audio.snapshotRecall` | Recall a Q-Sys snapshot | `snapshotId` |

### Lighting
| Action | Description | Key params |
|---|---|---|
| `lighting.goCue` | Trigger a lighting cue | `cueKey` |
| `lighting.goScene` | Recall a scene | `sceneKey` |
| `lighting.goMacro` | Run a macro | `macro` |
| `lighting.setIntensity` | Set intensity level | `level` (0–100) |
| `lighting.off` | Black out / turn off | — |

### Practical
| Action | Description | Key params |
|---|---|---|
| `practical.on` | Enable a practical effect | — |
| `practical.off` | Disable a practical effect | — |
| `practical.trigger` | One-shot trigger | `duration?` |

---

## Usage Examples

### Example 1 — Target one item
Start a specific ambience on the A1 Ribbon LED only.

```json
{
  "v": 1,
  "source": "ui",
  "target": "a1.ribbonLed",
  "action": "video.play",
  "params": { "timelineKey": "ambience_1" }
}
```

---

### Example 2 — Target a zone
Start ambience on everything in Atrium 1 (video, audio, lighting all get the command; adapters filter what's relevant per system).

```json
{
  "v": 1,
  "source": "ui",
  "target": "a1",
  "action": "video.play",
  "params": { "timelineKey": "ambience_a1" }
}
```

---

### Example 3 — Target all three atriums (array of zones)
Trigger the same ambience across A1, A2, and A3 simultaneously.

```json
{
  "v": 1,
  "source": "scheduler",
  "target": ["a1", "a2", "a3"],
  "action": "video.play",
  "params": { "timelineKey": "ambience_1" }
}
```

---

### Example 4 — Global show start
Start the show everywhere — all xyz-tagged items across the whole installation.

```json
{
  "v": 1,
  "source": "scheduler",
  "target": { "tags": ["xyz"] },
  "action": "video.play",
  "params": { "timelineKey": "show_1" }
}
```

> This matches what `PROJECT-SCOPE.md` defines as **Show = global, everything in sync**.

---

### Example 5 — Target only video in A1
Play a special overlay on A1 video screens only, without touching lighting or audio.

```json
{
  "v": 1,
  "source": "ui",
  "target": { "zone": "a1", "tags": ["video"] },
  "action": "video.play",
  "params": { "timelineKey": "special_overlay" }
}
```

Resolves to: `[ a1.ribbonLed, a1.sphereLed, a1.columnLed ]`

---

### Example 6 — Target only lighting in A1
Trigger a lighting cue on all A1 lighting elements (MA-controlled) without affecting video.

```json
{
  "v": 1,
  "source": "ui",
  "target": { "zone": "a1", "tags": ["lighting"] },
  "action": "lighting.goCue",
  "params": { "cueKey": "ambience_warm" }
}
```

Resolves to: `[ a1.movingLights, a1.wisk, a1.arch, a1.hublessWheel.movingLights, a1.hublessWheel.ring, a1.hublessWheel.gondolas, a1.hublessWheel.gondolaBenches, a1.multiverseStrips, a1.handrailStrips ]`

---

### Example 7 — Target only moving lights across all atriums
A moving-lights-only cue across A1, A2, A3 simultaneously.

```json
{
  "v": 1,
  "source": "ui",
  "target": { "zone": "in", "tags": ["lighting", "moving"] },
  "action": "lighting.goCue",
  "params": { "cueKey": "show_intro" }
}
```

Resolves to: `[ a1.movingLights, a2.movingLights, a3.movingLights, a1.hublessWheel.movingLights ]`

---

### Example 8 — Target the Hubless Wheel as a group
Address all hubless wheel elements together using the `hublessWheel` sub-group tag.

```json
{
  "v": 1,
  "source": "ui",
  "target": { "tags": ["hublessWheel"] },
  "action": "lighting.goCue",
  "params": { "cueKey": "spin_effect" }
}
```

Resolves to: `[ a1.hublessWheel.movingLights, a1.hublessWheel.ring, a1.hublessWheel.gondolas, a1.hublessWheel.gondolaBenches ]`

---

### Example 9 — Target all audio indoors
Set BGM level for every indoor audio zone.

```json
{
  "v": 1,
  "source": "scheduler",
  "target": { "zone": "in", "tags": ["audio"] },
  "action": "audio.setLevel",
  "params": { "inputKey": "bgm", "db": -30 }
}
```

Resolves to: `[ a1.audio, a2.audio, a3.audio, sb.transformerAudio, it.audio ]`

---

### Example 10 — Simple event in A2 (reduce BGM)
Reduce background music in A2 only for a simple event, without touching other spaces.

```json
{
  "v": 1,
  "source": "ui",
  "target": "a2.audio",
  "action": "audio.setLevel",
  "params": { "inputKey": "bgm", "db": -45 }
}
```

---

### Example 11 — Explicit list (mixed zones and items)
A custom selection — all of A2, plus just the ribbon and audio from A1.

```json
{
  "v": 1,
  "source": "ui",
  "target": ["a2", "a1.ribbonLed", "a1.audio"],
  "action": "video.play",
  "params": { "timelineKey": "special_event" }
}
```

---

### Example 12 — Water features + outdoor lighting together
Trigger water features and outdoor landscape lighting for a pre-show outdoor moment.

```json
{
  "v": 1,
  "source": "scheduler",
  "target": ["wf.1", "wf.2", "wf.3", "wf.4", "ls.lights1", "ls.lights2"],
  "action": "practical.on",
  "params": {}
}
```

---

### Example 13 — Target all outdoors
Stop everything outdoors at end of day.

```json
{
  "v": 1,
  "source": "scheduler",
  "target": "ou",
  "action": "video.stop",
  "params": {}
}
```

---

### Example 14 — Full global stop
Stop everything, everywhere.

```json
{
  "v": 1,
  "source": "operator",
  "target": "all",
  "action": "video.stop",
  "params": {}
}
```

---

## How the Router Uses This File

The registry is loaded into Node-RED global context on startup (alongside `watchout-config.json` and `timeline-mapping.json`). Every command envelope passes through a **Target Resolver** function node before reaching system adapters.

```
msg.payload (command envelope)
        │
        ▼
[ Target Resolver ]
  – reads item-registry from global context
  – expands target (string / zone / tag filter / array)
  – produces: flat list of matched item objects
        │
        ▼
[ Router ]
  – groups matched items by system (watchout7, qsc, ma, pharos, etc.)
  – dispatches each group to the correct adapter
        │
        ├──▶ [ Watchout 7 Adapter ]  → HTTP to Watchout
        ├──▶ [ QSC Adapter ]         → QRC to Q-Sys Core
        ├──▶ [ MA Adapter ]          → TCP/WS to grandMA3
        ├──▶ [ Pharos Adapter ]      → HTTP to Pharos
        ├──▶ [ 7th Sense Adapter ]   → HTTP/TCP to 7th Sense
        ├──▶ [ BrightSign Adapter ]  → HTTP to BrightSign
        └──▶ [ Watchout 6 Adapter ]  → TCP to Watchout 6
```

Each adapter translates the domain action + params into the vendor-native command format, exactly as it already exists today (Watchout HTTP commands, MA `/cmd` strings, QSC topic-style, etc.).

---

## Updating the Registry

When adding a new device or fixture:

1. Open `node-red/config/item-registry.json`
2. Find the correct zone (or add a new zone if needed)
3. Add the item object with `id`, `label`, `tags`, `system`, `device`
4. Restart Node-RED (or reload global context) so the router picks up the change
5. No UI or flow changes are required — the router resolves targets dynamically

**Example: adding a new LED strip to A2**
```json
{
  "id": "a2.stageStrips",
  "label": "Stage Strips",
  "tags": ["lighting", "lx", "strips"],
  "system": "pharos",
  "device": "a2_pharos"
}
```

Add it to the `items` array under the `a2` zone object. Done.
