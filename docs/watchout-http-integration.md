# Watchout 7 HTTP Integration — Node-RED (v0.4)

## Overview

This integration connects Dataton Watchout 7 with Node-RED via the Watchout HTTP
API. Everything runs directly inside Node-RED nodes — no external JavaScript
modules are required.

Persistence uses two JSON files:

- `watchout-config.json` — host, port, and file paths
- `timeline-mapping.json` — the active `timelineKey → { displayName, watchoutTimelineId, cues? }` mapping

**Default port:** `3019`

> **Note (v0.2):** Watchout supports real-time monitoring via **NDJSON**
> (`GET /v1/ndjson`) and **SSE** (`GET /v1/sse`). In some Docker/Windows +
> Node-RED environments, long-lived streaming endpoints may not work reliably
> with the built-in **HTTP Request** node (requests can remain open until they
> time out). This flow therefore supports:
>
> - **Polling** via `GET /v0/state` (reliable)
> - Optional streaming (NDJSON/SSE) where supported
> - A recommended pattern to **poll immediately after sending a control command**
>   (so UI updates quickly even without streaming)

---

## Features

| Feature | Description |
|---------|-------------|
| Manual Timeline Discovery | Operator clicks **[ Re-discover Timelines]** to fetch the timeline list from Watchout |
| Change Detection | Compares old vs new mapping — shows removed REMOVED, added ADDED, changed CHANGED, and unchanged OK timelines |
| Diff UI | Displays the diff to the operator with **[ Confirm & Save]** and **[ Cancel]** buttons |
| Persistent Storage | Mapping is stored in both Node-RED flow context **and** the file system via Node-RED Read/Write file nodes (survives restarts) |
| Cue Caching on Confirm | On **Confirm & Save**, cues are auto-fetched for every timeline and stored in the mapping |
| Timeline Control | `start` / `stop` / `pause` timelines via the stored mapping |
| Jump to Time | Seek a timeline to a specific time position (ms) with optional playback state |
| Jump to Cue | Jump a timeline to a named cue point — resolved by name to a numeric Watchout cue ID |
| Get Timeline Cues | Retrieve all cue points defined on a specific timeline |
| Inputs (Variables) Control | `setVar` and `setVars` to update Watchout **Inputs** (called "Variables" in the Watchout UI) |
| Cue Sets (Cue Group State) | Get and set cue-group-state by **ID** or **Name**, including multi-switch and reset-to-default |
| Status Polling | Poll current system state via `GET /v0/state` (reliable) |
| Fast UI Updates | Optional: trigger a one-shot `GET /v0/state` shortly after sending any control command |
| Error Handling | Graceful failures with human-readable error messages |

---

## File Structure

```
node-red/
├── flows/
│   └── watchout-v2.json          ← Self-contained Node-RED flow (importable) ← USE THIS
├── config/
│   └── watchout-config.json      ← Config template (copy to /config/ in Docker)
└── data/
    └── .gitkeep                  ← Runtime-generated mapping goes here (or /data/)
```

> In Docker the recommended mounts are:
> - host `node-red/config` → container `/config` (config file)
> - host `node-red/data`   → container `/data`   (mapping file)

---

## Installation

### 1. Import the flow

In Node-RED, go to **Menu → Import → Clipboard** and paste the contents of
`node-red/flows/watchout-v2.json`.

### 2. Set the config file path

The startup inject node fires once on deploy with a default path of
`/config/watchout-config.json`. Edit the inject node payload if you
want to store the config elsewhere.

### 3. Create / edit the config file

Copy `node-red/config/watchout-config.json` to `/config/watchout-config.json`
(or wherever you pointed the inject) and edit it:

```json
{
  "host": "192.168.1.10",
  "port": 3019,
  "mappingFile": "/data/timeline-mapping.json"
}
```

If the file does not exist the flow will create it with defaults on first deploy.

> **Docker users:** `/config` and `/data` are paths **inside the container**.
> Add bind-mounts (or named volumes) to your `docker run` / Compose file so
> these directories are persisted on the host:
>
> ```yaml
> volumes:
>   - ./node-red/config:/config   # holds watchout-config.json
>   - ./node-red/data:/data       # holds timeline-mapping.json
> ```

### 4. Required Node-RED nodes

The flow requires only the built-in Node-RED nodes and the Dashboard:

| Package | Nodes used |
|---------|-----------|
| `node-red` (built-in) | inject, function, switch, http in, http request, http response, file in, file out, catch, debug |
| `@flowfuse/node-red-dashboard` (Dashboard 2.0) | ui-page, ui-group, ui-button, ui-template |

Install the Dashboard package if not already present:

```bash
cd ~/.node-red
npm install @flowfuse/node-red-dashboard
```

Restart Node-RED after installing.

> **Optional — SSE client:** If you prefer SSE over NDJSON, you may install
> `node-red-contrib-sse-client`. However, note that this contrib node does
> **not** allow overriding its configured URL via `msg.url` or similar message
> properties — the URL must be set directly in the node's configuration panel.

> **Docker on Windows — URL note:** Node-RED running inside a Docker container
> on Windows cannot reach `localhost` on the host. Use
> `http://host.docker.internal:3019/...` instead (Docker Desktop for Windows
> resolves this hostname to the host machine automatically). See
> [§ Docker on Windows Networking](#docker-on-windows-networking) below.

### 5. Deploy

Click **Deploy**. On startup the flow will:

1. Read `/config/watchout-config.json` (create with defaults if missing)
2. Read `/data/timeline-mapping.json` (start with empty mapping if missing)
3. Begin monitoring Watchout state via polling (`GET /v0/state`) and/or streaming where supported

---

## Docker on Windows Networking

When Node-RED runs inside a Docker container on a **Windows host** where
Watchout is also running, `localhost` inside the container refers to the
container itself — not the Windows host.

| Context | URL to use |
|---------|-----------|
| `curl` / browser on the Windows host | `http://localhost:3019/...` |
| Node-RED HTTP Request node (inside container) | `http://host.docker.internal:3019/...` |

`host.docker.internal` is automatically resolved to the Windows host by Docker
Desktop. Use this hostname in all Node-RED node URL fields and config files.

**Example config (`watchout-config.json`) for Docker on Windows:**

```json
{
  "host": "host.docker.internal",
  "port": 3019,
  "mappingFile": "/data/timeline-mapping.json"
}
```

---

## Manual Timeline Discovery Workflow

```
Operator opens Node-RED dashboard → "Watchout" tab

1.  Operator clicks  [ Re-discover Timelines]
        │
        ▼
2.  Node-RED calls  GET /v0/timelines  from Watchout (port 3019)
        │
        ▼
3.  Response parsed → new timelineKey → { displayName, watchoutTimelineId } mapping built
        │
        ▼
4.  New mapping compared to stored mapping
        │
        ├─ REMOVED  : "Timeline 'show_1' no longer exists"
        ├─ ADDED    : "New timeline 'show_3' discovered"
        ├─ CHANGED  : "Timeline 'ambience_1' ID has changed"
        └─ OK       : "show_2"
        │
        ▼
5.  Diff UI displayed
        │
        ├─ [ Cancel]          → pending mapping cleared, nothing saved
        └─ [ Confirm & Save]  → initial mapping written to file + flow context
                                  then for each timeline:
                                    GET /v0/cues/{watchoutTimelineId}
                                    → cues normalized and stored per timeline
                                  final mapping (with cues) written to timeline-mapping.json
```

---

## Timeline and Cue Naming Convention

### Timeline names → `timelineKey`

Watchout timeline names are converted to **timeline keys** (normalized names used
in Node-RED control messages) using these rules:

| Rule | Example input | Output |
|------|--------------|--------|
| Names starting with `_` are skipped | `_SystemClock` | *(ignored)* |
| Trimmed and lower-cased | `Show 1` | `show_1` |
| Spaces → underscores | `Ambience Scene 2` | `ambience_scene_2` |
| Non-alphanumeric chars removed | `Show (Main)` | `show_main` |

### Cue names → `cueKey`

The same normalization rules apply to cue names. Cues with `name: null` from
Watchout are skipped (they cannot form a valid key).

### Mapping file format (`timeline-mapping.json`)

```json
{
  "main_timeline": {
    "displayName": "Main Timeline",
    "watchoutTimelineId": "0",
    "cues": {
      "shows":            { "displayName": "Shows",            "watchoutCueId": "0" },
      "start_transition": { "displayName": "Start Transition", "watchoutCueId": "1" },
      "tcp_out":          { "displayName": "TCP out",          "watchoutCueId": "3" },
      "marker_1":         { "displayName": "marker 1",         "watchoutCueId": "4" }
    }
  },
  "show_1": {
    "displayName": "Show 1",
    "watchoutTimelineId": "1",
    "cues": {}
  }
}
```

Fields:
- **`timelineKey`** — top-level key; the normalized timeline name used in Node-RED control messages (e.g. `"show_1"`)
- **`displayName`** — original Watchout name; used for UI labels
- **`watchoutTimelineId`** — numeric Watchout timeline ID used in REST calls (e.g. `"0"`)
- **`cues`** — optional map of `cueKey → { displayName, watchoutCueId }`; populated automatically on **Confirm & Save**
- **`cueKey`** — normalized cue name (e.g. `"shows"`, `"start_transition"`)
- **`watchoutCueId`** — numeric Watchout cue ID used in REST calls (e.g. `"0"`)

> Cues are fetched and cached automatically when the operator clicks **Confirm & Save**
> during timeline discovery. After confirmation, `jumpToCue` commands can resolve
> cues by name without any additional setup.

---

## Control API (Node-RED)

Send a `POST` request to `/watchout/control` with a JSON body. The
**Prepare control request** function node maps these commands to Watchout REST endpoints.

All timeline commands accept `timelineKey` (normalized timeline name).  
Cue commands additionally accept `cueKey` (normalized cue name), which is resolved
to the numeric `watchoutCueId` from the cached mapping.

### Timelines

Start a timeline:
```json
{ "command": "start", "timelineKey": "show_1" }
```
→ `POST /v0/play/{watchoutTimelineId}`

Stop a timeline:
```json
{ "command": "stop", "timelineKey": "show_1" }
```
→ `POST /v0/stop/{watchoutTimelineId}`

Pause a timeline:
```json
{ "command": "pause", "timelineKey": "show_1" }
```
→ `POST /v0/pause/{watchoutTimelineId}`

Jump to a specific time position on a timeline:
```json
{ "command": "jumpToTime", "timelineKey": "show_1", "milliseconds": 12345 }
```
→ `POST /v0/jump-to-time/{watchoutTimelineId}?time=12345`

With optional state (pause or play after seek):
```json
{ "command": "jumpToTime", "timelineKey": "show_1", "milliseconds": 12345, "state": "pause" }
```
→ `POST /v0/jump-to-time/{watchoutTimelineId}?time=12345&state=pause`

Jump to a named cue point on a timeline:
```json
{ "command": "jumpToCue", "timelineKey": "main_timeline", "cueKey": "shows" }
```
→ `POST /v0/jump-to-cue/{watchoutTimelineId}/{watchoutCueId}`  
(e.g. `POST /v0/jump-to-cue/0/0` — both IDs are numeric)

With optional state (pause or play after jump):
```json
{ "command": "jumpToCue", "timelineKey": "main_timeline", "cueKey": "shows", "state": "play" }
```
→ `POST /v0/jump-to-cue/{watchoutTimelineId}/{watchoutCueId}?state=play`

Get all cue points defined on a timeline:
```json
{ "command": "getCues", "timelineKey": "show_1" }
```
→ `GET /v0/cues/{watchoutTimelineId}`

Play all timelines:
```json
{ "command": "playAll" }
```
→ `POST /v0/play`

Get current state:
```json
{ "command": "getState" }
```
→ `GET /v0/state`

### Inputs (Variables)

Set a single input:
```json
{ "command": "setVar", "varName": "masterVolume", "varValue": 50 }
```
→ `POST /v0/input/{key}?value={v}`

Set multiple inputs (bulk / fades):
```json
{
  "command": "setVars",
  "vars": [
    { "key": "masterVolume", "value": 50, "duration": 1000 },
    { "key": "Content", "value": 10 }
  ]
}
```
→ `POST /v0/inputs` with JSON array body `[{key, value, duration?}]`

### Cue Sets (Cue Group State)

Get states by ID:
```json
{ "command": "getCueGroupStatesById" }
```
→ `GET /v0/cue-group-state/by-id`

Get states by Name:
```json
{ "command": "getCueGroupStatesByName" }
```
→ `GET /v0/cue-group-state/by-name`

Switch single variant by ID:
```json
{ "command": "setCueGroupVariantById", "groupId": "12", "variantId": "2" }
```
→ `POST /v0/cue-group-state/by-id/<groupId>/<variantId>`

Switch single variant by Name:
```json
{ "command": "setCueGroupVariantByName", "groupName": "Atrium 1 Mode", "variantName": "Show" }
```
→ `POST /v0/cue-group-state/by-name/<groupName>/<variantName>`

Switch multiple variants by ID:
```json
{ "command": "setCueGroupVariantsById", "states": { "12": "2", "13": "1" } }
```
→ `POST /v0/cue-group-state/by-id` with JSON body `{ "groupId1": "variantId1", ... }`

Switch multiple variants by Name:
```json
{ "command": "setCueGroupVariantsByName", "states": { "Atrium 1 Mode": "Show", "Atrium 2 Mode": "Ambient" } }
```
→ `POST /v0/cue-group-state/by-name` with JSON body `{ "groupName1": "variantName1", ... }`

Reset all cue groups to default:
```json
{ "command": "setCueGroupVariantsByName", "states": {} }
```
→ `POST /v0/cue-group-state/by-name` with JSON body `{}`

### Response shape

The flow normalizes Watchout responses into a uniform JSON structure:

```json
{
  "success": true,
  "command": "start",
  "timelineKey": "show_1",
  "watchoutTimelineId": "1",
  "displayName": "Show 1",
  "statusCode": 200,
  "body": {}
}
```

For cue commands (`jumpToCue`), the response additionally includes:
```json
{
  "success": true,
  "command": "jumpToCue",
  "timelineKey": "main_timeline",
  "watchoutTimelineId": "0",
  "displayName": "Main Timeline",
  "cueKey": "shows",
  "watchoutCueId": "0",
  "statusCode": 200,
  "body": {}
}
```

Cue group commands will include cue-related fields when available:
- `groupId`, `variantId`
- `groupName`, `variantName`
- `states` (for multi-switch/reset)

---

## Flow Context Variables

| Variable | Type | Description |
|----------|------|-------------|
| `watchout_config` | object | `{ host, port, mappingFile }` |
| `watchout_mapping` | object | Active `{ timelineKey: { displayName, watchoutTimelineId, cues? } }` mapping |
| `watchout_pending` | object | Pending mapping awaiting operator confirmation |
| `watchout_state` | object | Latest state from polling and/or streaming |
| `watchout_sse_status` | string | `'connected'` \| `'disconnected'` \| `'error'` |
| `watchout_selected_timelineKey` | string | `timelineKey` of the currently selected timeline in the UI dropdown |
| `watchout_cue_queue` | array | Internal: queue of `{timelineKey, watchoutTimelineId}` being processed during cue fetch |
| `watchout_cue_index` | number | Internal: current position in the cue fetch queue |

---

## Monitoring / State Updates

### Polling (`GET /v0/state`)

Polling is the most reliable approach across Docker/Windows environments.

A common pattern is:

- poll every 5 seconds, and
- after sending any command, wait ~200–500 ms and then poll once immediately (one-shot refresh)

This provides fast dashboard updates even when streaming endpoints are unavailable.

### Streaming (NDJSON / SSE) (optional)

Watchout provides:

- `GET /v1/ndjson` — NDJSON stream (each line is `{"kind":...,"value":...}`)
- `GET /v1/sse` — SSE stream (each event is `data: {...}`)

Depending on Node-RED version and environment, you may need a streaming-capable client
(contrib SSE client or a custom node) rather than the default HTTP Request node.

---

## Watchout 7 HTTP API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v0/timelines` | List all timelines |
| `POST` | `/v0/play` | Play all timelines |
| `POST` | `/v0/play/{id}` | Start / resume a timeline by numeric ID |
| `POST` | `/v0/pause/{id}` | Pause a timeline by numeric ID |
| `POST` | `/v0/stop/{id}` | Stop a timeline by numeric ID |
| `GET` | `/v0/inputs` | List all inputs and their current values |
| `POST` | `/v0/inputs` | Set multiple inputs — body: `[{key, value, duration?}]` |
| `POST` | `/v0/input/{key}?value={v}` | Set a single input by key |
| `GET` | `/v0/state` | Get current system state (REST poll) |
| `GET` | `/v1/sse` | SSE stream — full state on each update |
| `GET` | `/v1/ndjson` | NDJSON stream — each line is `{"kind":…,"value":…}` |
| `GET` | `/v0/cue-group-state/by-id` | Cue group state (Cue Sets) — get current states by ID |
| `GET` | `/v0/cue-group-state/by-name` | Cue group state (Cue Sets) — get current states by Name |
| `POST` | `/v0/cue-group-state/by-id/<groupId>/<variantId>` | Cue group state — switch single variant by ID |
| `POST` | `/v0/cue-group-state/by-name/<groupName>/<variantName>` | Cue group state — switch single variant by Name |
| `POST` | `/v0/cue-group-state/by-id` | Cue group state — switch multiple variants by ID (object body) |
| `POST` | `/v0/cue-group-state/by-name` | Cue group state — switch multiple variants by Name (object body; `{}` resets all to default) |
| `POST` | `/v0/jump-to-time/{id}?time={ms}&state={s?}` | Seek a timeline to a time position (ms); optional `state`: `pause`\|`play` |
| `POST` | `/v0/jump-to-cue/{id}/{cueId}?state={s?}` | Jump to a cue point by numeric cue ID; optional `state`: `pause`\|`play` |
| `GET` | `/v0/cues/{id}` | Get all cue points defined on a timeline (by numeric timeline ID) |

---

## Roadmap

- **v0.2** — Node-RED-based integration with timeline discovery + mapping persistence, timeline control, inputs control, cue sets control, and polling-based state monitoring (with optional streaming where supported)
- **v0.4** *(this version)* — Schema redesign: `timelineKey`/`cueKey` for named resolution, `watchoutTimelineId`/`watchoutCueId` for numeric Watchout IDs; automatic cue caching on Confirm & Save; `jumpToCue` resolves cue names to numeric IDs
- **v0.5** *(future)* — ISAAC integration (Events & Playables → Show Controller decision tree)
