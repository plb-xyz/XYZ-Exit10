# MA Cue Mapper — Node-RED Flow

A FlowFuse Dashboard 2.0 tool for creating and managing a **human-friendly label → MA cue** mapping per space (Atrium 1/2/3/Landscape). Built in the same file/persistence style as the [Watchout HTTP Integration](../watchout-http-integration.md).

---

## Overview

The MA Cue Mapper lets operators define named cue labels (e.g. "Green Look") mapped to a specific MA command (sequence cue or executor cue) for each physical space. Other Node-RED flows can then fire a cue by label instead of hard-coding MA sequence/executor numbers.

**No `require('fs')` or `require('path')` in any Function node.** All file I/O uses Node-RED's built-in **File In** / **File Out** nodes — the same pattern used by `watchout-v2.json`.

---

## File Structure

### Host mounts (Docker)

| Host path (repo) | Container path | Purpose |
|---|---|---|
| `node-red/config/` | `/config/` | Operator-edited config files (read-only by flow) |
| `node-red/data/` | `/data/` | Runtime data written by the flow |

### Files

| File | Location | Description |
|---|---|---|
| `ma-cue-mapper-config.json` | `/config/ma-cue-mapper-config.json` | Config template — set `mappingFile` path |
| `ma-cue-mapping.json` | `/data/ma-cue-mapping.json` (default) | Runtime mapping — written by the flow |

---

## Config Schema (`ma-cue-mapper-config.json`)

```json
{
    "_comment": "MA Cue Mapper — Node-RED configuration. Edit mappingFile to change the runtime data path.",
    "mappingFile": "/data/ma-cue-mapping.json"
}
```

| Field | Type | Default | Description |
|---|---|---|---|
| `mappingFile` | string | `/data/ma-cue-mapping.json` | Absolute path to the runtime mapping file |

---

## Mapping Schema (`ma-cue-mapping.json`)

Top-level keys are **space IDs** (`a1`, `a2`, `a3`, `ls`). Each space contains an object keyed by **`labelId`** (normalized from `displayName`).

```json
{
  "a1": {
    "green_look": {
      "displayName": "Green Look",
      "type": "sequenceCue",
      "sequence": "3",
      "cue": "7",
      "notes": ""
    }
  },
  "a2": {
    "green_look": {
      "displayName": "Green Look",
      "type": "executorCue",
      "executor": "2.201",
      "cue": "6",
      "notes": ""
    }
  },
  "a3": {},
  "ls": {}
}
```

### Space IDs

| ID | Display name |
|---|---|
| `a1` | Atrium 1 |
| `a2` | Atrium 2 |
| `a3` | Atrium 3 |
| `ls` | Landscape |

### Entry fields

| Field | Type | Required | Description |
|---|---|---|---|
| `displayName` | string | yes | Human-readable label (e.g. "Green Look") |
| `type` | `"sequenceCue"` \| `"executorCue"` | yes | Command type |
| `sequence` | string | if `sequenceCue` | MA sequence number |
| `executor` | string | if `executorCue` | MA executor number (e.g. `"2.201"`) |
| `cue` | string | yes | MA cue number |
| `notes` | string | no | Optional operator notes |

### `labelId` normalization

`labelId` is derived from `displayName` by:
1. Trim whitespace
2. Lowercase
3. Replace spaces with `_`
4. Strip non-`[a-z0-9_]` characters
5. Collapse consecutive `_`
6. Strip leading/trailing `_`

Example: `"Green Look"` → `green_look`

---

## Startup Behavior

On deploy the flow runs this pipeline (Watchout-style):

```
Inject (once)
  → Set config path (msg.filename = '/config/ma-cue-mapper-config.json')
  → File In: read config
  → Parse config (extract mappingFile, set flow.ma_cue_cfg)
  → File In: read mapping
  → Parse mapping (set flow.ma_cue_mapping, update UI)
```

If **config file is missing**, a `Catch` node creates defaults and writes them to `/config/ma-cue-mapper-config.json`, then continues to read the mapping.

If **mapping file is missing**, a `Catch` node starts with an empty mapping `{a1:{},a2:{},a3:{},ls:{}}` and writes it to the mapping file path from config.

---

## Dashboard UI

Open the **MA Cue Mapper** page in the FlowFuse Dashboard.

### Space selector
Choose the space (Atrium 1/2/3 or Landscape) to view its mappings.

### Mapping table
Each row shows:
- **Label** — the display name
- **Type** — Sequence or Executor
- **Target** — `Seq <number>` or `Exec <executor>`
- **Cue** — cue number
- **Notes** — optional notes
- **Actions** — `Edit`, `Send`, `Delete`

### Add/Edit form
Click **+ Add Entry** or **Edit** on a row to open the form:

| Field | Notes |
|---|---|
| Label | Display name — becomes the `labelId` key |
| Type | `Sequence Cue` or `Executor Cue` |
| Sequence # | Visible only for Sequence Cue |
| Executor # | Visible only for Executor Cue (e.g. `2.201`) |
| Cue # | Required for both types |
| Notes | Optional |

Click **Save** to write immediately. The table refreshes.

### Send (Test) button
Click **Send** on any row to:
1. Set MA owner to `nodered`
2. Send the mapped cue command to the MA Control pipeline

A status bar confirms success or shows an error.

---

## Triggering a Cue from Other Flows

### Via the "Resolve cue by label" link-in node

The flow exposes a **link in** node named `Resolve cue by label` (ID: `macm-resolve-link-in`). Other flows can wire a **link out** to it and send:

```json
{ "payload": { "space": "a1", "label": "Green Look" } }
```

or equivalently using `labelId`:

```json
{ "payload": { "action": "fire", "space": "a1", "labelId": "green_look" } }
```

### Via Inject node (example payloads)

**Fire "Green Look" in Atrium 1:**
```json
{ "space": "a1", "label": "Green Look" }
```

**Fire "Party Mode" in Landscape:**
```json
{ "space": "ls", "label": "Party Mode" }
```

Set the Inject node's payload to JSON and wire its output to `macm-resolve-link-in`.

### What the flow sends to MA

The resolver always emits **two messages in order** into the MA Control pipeline:

1. **Set owner** (gates the MA pipeline for Node-RED):
   ```json
   { "action": "setOwner", "owner": "nodered", "setBy": "ma-cue-mapper" }
   ```

2. **Cue command** (one of):
   - Sequence cue: `{ "action": "goSequenceCue", "sequence": "3", "cue": "7" }`
   - Executor cue: `{ "action": "goExecutorCue", "zones": ["2.201"], "cue": "6" }`

> **Owner note:** The `nodered` owner allows **both** executor and sequence cues to pass through
> `ma-control-fn`. See [`MA-node-red-commands.md`](./MA-node-red-commands.md) for the full gate policy.

---

## Wiring to MA Control

The `macm-fire-fn` output 1 wires to `ma-control-fn` (node ID in `ma-integration.json`). When importing both flows into the same Node-RED instance, this cross-flow reference resolves automatically.

If you need to re-wire manually:
- Connect `macm-fire-fn` output 1 → `ma-control-fn` (the "MA Control (gate + cmd builder)" node in the MA Integration flow)

---

## Installation

1. **Import** `node-red/flows/ma-cue-mapper.json` via Node-RED Menu → Import
2. Ensure `node-red/flows/ma-integration.json` is also imported (provides `ma-control-fn`)
3. Confirm Docker volume mounts:
   - `./node-red/config:/config`
   - `./node-red/data:/data`
4. Copy `node-red/config/ma-cue-mapper-config.json` to your config mount (or let the flow create defaults)
5. **Deploy** — the flow loads config and mapping on startup

---

## Flow Context Variables

| Variable | Scope | Description |
|---|---|---|
| `ma_cue_cfg` | flow | Parsed config object (`mappingFile`) |
| `ma_cue_mapping` | flow | Live mapping object (all spaces) |

---

## Relation to Watchout Integration

This flow mirrors the file/persistence conventions documented in
[`docs/watchout-http-integration.md`](../watchout-http-integration.md):

- Config in `/config/` (operator-edited, version-controlled template)
- Runtime data in `/data/` (written by Node-RED at runtime)
- Startup reads config → reads data file → falls back to defaults via Catch nodes
- All file I/O via File In / File Out nodes — no `require('fs')` / `require('path')` in Function nodes
