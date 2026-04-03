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

Top-level keys are **space IDs** (`a1`, `a2`, `a3`, `ls`, `cmd`, `mx`). Each space contains an object keyed by **`labelId`** (normalized from `displayName`).

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
      "executor": "1.201",
      "cue": "6",
      "notes": ""
    }
  },
  "a3": {},
  "ls": {},
  "cmd": {
    "full_show_start": {
      "displayName": "Full Show Start",
      "type": "command",
      "commands": [
        "Go+ Page 1 Executor 201 Cue 2",
        "Go+ Sequence 5 Cue 1"
      ],
      "notes": "Fires two MA commands in order"
    }
  },
  "mx": {
    "reset_all": {
      "displayName": "Reset All",
      "type": "macro",
      "macro": "42",
      "notes": "Runs grandMA3 macro 42"
    }
  }
}
```

### Space IDs

| ID | Display name | Entry types allowed |
|---|---|---|
| `a1` | Atrium 1 | `sequenceCue`, `executorCue` |
| `a2` | Atrium 2 | `sequenceCue`, `executorCue` |
| `a3` | Atrium 3 | `sequenceCue`, `executorCue` |
| `ls` | Landscape | `sequenceCue`, `executorCue` |
| `cmd` | Commands | `command` |
| `mx` | Macros | `macro` |

### Entry fields — all types

| Field | Type | Required | Description |
|---|---|---:|---|
| `displayName` | string | yes | Human-readable label (e.g. "Green Look") |
| `type` | string | yes | Command type — see below |
| `notes` | string | no | Optional operator notes |

### Entry fields — `sequenceCue`

| Field | Type | Required | Description |
|---|---|---:|---|
| `sequence` | string | yes | MA sequence number |
| `cue` | string | yes | MA cue number |

### Entry fields — `executorCue`

| Field | Type | Required | Description |
|---|---|---:|---|
| `executor` | string | yes | MA executor in `page.executor` format (e.g. `"1.201"` → Page 1 Executor 201) |
| `cue` | string | yes | MA cue number |

The executor value `"1.201"` is parsed as **Page 1, Executor 201**, producing: `Go+ Page 1 Executor 201 Cue <n>`.

### Entry fields — `command`

| Field | Type | Required | Description |
|---|---|---:|---|
| `commands` | `string[]` | yes | Array of raw MA command strings, emitted in order |

Each string in `commands` is sent as-is as an MA `/cmd` OSC message. Example: `"Go+ Page 1 Executor 201 Cue 2"`.

### Entry fields — `macro`

| Field | Type | Required | Description |
|---|---|---:|---|
| `macro` | string | yes | grandMA3 macro number or name (e.g. `"42"` or `"MyMacro"`) |

Produces the MA command: `Go+ Macro <macro>`.

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

### Mapping refresh on page reload

The UI requests state on mount (page load / navigation back) by sending:

```json
{ "action": "getMapping" }
```

The flow responds by pushing the current mapping to the UI as:

- `msg.topic = "ma/cue-map/updated"`
- `msg.payload = <mapping object>`

This avoids the “page is empty until deploy” problem.

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

### Sorting

The table supports sorting by clicking column headers:

- **Label** sorts alphabetically (A→Z / Z→A)
- **Cue** sorts numerically where possible (1,2,10…), falling back to string sort if needed
- **Type** and **Target** sort alphabetically

Click the same header again to reverse the sort direction.

### Add/Edit form

Click **+ Add Entry** or **Edit** on a row to open the form. The available fields depend on the selected Space and Type:

| Field | Notes |
|---|---|
| Label | Display name — becomes the `labelId` key |
| Type | Automatically constrained by Space: `Sequence Cue` / `Executor Cue` for Atriums/Landscape; `Command` for Commands space; `Macro` for Macros space |
| Sequence # | Visible only for Sequence Cue |
| Executor # | Visible only for Executor Cue (e.g. `1.201` = Page 1 Executor 201) |
| Cue # | Required for Sequence Cue and Executor Cue |
| Commands | Visible only for Command type — multi-line textarea, one MA command per line |
| Macro # or Name | Visible only for Macro type — number or name passed to `Go+ Macro <value>` |
| Notes | Optional |

The **Cue** column is hidden in the table when viewing Commands or Macros spaces.

Click **Save** to write immediately. The table refreshes.

### Send (Test) button

Click **Send** on any row to fire that cue via the MA Control pipeline (see next sections).

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

---

## MA Control payload contract (IMPORTANT)

The MA Control node expects `msg.payload` to be a **flat command object** with an `action` field at the top level.

Valid examples:

### Set owner

```json
{ "action": "setOwner", "owner": "nodered", "setBy": "ma-cue-mapper" }
```

### Fire sequence cue

```json
{ "action": "goSequenceCue", "sequence": "2", "cue": "3" }
```

Produces: `Go+ Sequence 2 Cue 3`

### Fire executor cue

```json
{ "action": "goExecutorCue", "zones": ["1.201"], "cue": "6" }
```

Produces: `Go+ Page 1 Executor 201 Cue 6`

The `zones` array value `"1.201"` is parsed as **page 1, executor 201** (`page.executor` format).
A plain number like `"201"` defaults to page 1 (`Go+ Page 1 Executor 201 Cue 6`).
No `zoneExecutor` config is required.

### Fire raw MA commands (command type)

```json
{ "action": "goCmd", "commands": ["Go+ Page 1 Executor 201 Cue 2", "Go+ Sequence 5 Cue 1"] }
```

Each string in `commands` is emitted as a separate `/cmd` OSC message in order. A single-command shorthand is also accepted: `{ "action": "goCmd", "command": "Go+ Page 1 Executor 201 Cue 2" }`.

### Fire a grandMA3 macro (macro type)

```json
{ "action": "goMacro", "macro": "42" }
```

Produces: `Go+ Macro 42`

`macro` can be a number string (`"42"`) or a name string (`"MyMacro"`).

#### Common mistake: wrapper objects

A UI/status object like this is **NOT** valid to send to MA Control directly:

```json
{
  "space": "a1",
  "labelId": "stage_foh",
  "info": "Go+ Sequence 2 Cue 3",
  "command": { "action": "goSequenceCue", "sequence": "2", "cue": "3" }
}
```

That wrapper is intended for UI feedback/debug only.

---

## What the flow sends to MA (Resolve & Fire behavior)

When resolving a label and firing it, the mapper emits one message to the MA Control pipeline:

- Sequence cue:
  ```json
  { "action": "goSequenceCue", "sequence": "3", "cue": "7" }
  ```
- Executor cue:
  ```json
  { "action": "goExecutorCue", "zones": ["1.201"], "cue": "6" }
  ```
- Command type:
  ```json
  { "action": "goCmd", "commands": ["Go+ Page 1 Executor 201 Cue 2"] }
  ```
- Macro type:
  ```json
  { "action": "goMacro", "macro": "42" }
  ```

> The `setOwner` claim before firing has been removed. MA Control no longer enforces owner gating — all actions are accepted from any source.
---

## Wiring to MA Control

The resolver function node output (Resolve & fire cue) should feed the MA Control pipeline:

- **Output 1**: MA Control commands only (owner claim + cue command)
- **Output 2**: UI/debug status only

If you are using Link nodes, ensure only Output 1 is linked into the MA Control path.

---

## Installation

1. **Import** `node-red/flows/ma-cue-mapper.json` via Node-RED Menu → Import
2. Ensure `node-red/flows/ma-integration.json` is also imported (provides MA Control)
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
