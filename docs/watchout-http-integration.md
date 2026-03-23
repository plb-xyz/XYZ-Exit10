# Watchout 7 HTTP Integration — Node-RED (v0.2)

## Overview

This integration connects Dataton Watchout 7 with Node-RED via the Watchout HTTP
API.  Everything runs directly inside Node-RED nodes — no external JavaScript
modules are required.  The only external files are two JSON files used for
persistence:

- `watchout-config.json` — host, port, and file paths
- `timeline-mapping.json` — the active `contentId → timelineId` mapping

**Default port:** `3019`

---

## Features

| Feature | Description |
|---------|-------------|
| Manual Timeline Discovery | Operator clicks **[ Re-discover Timelines]** to fetch the timeline list from Watchout |
| Change Detection | Compares old vs new mapping — shows removed REMOVED, added ADDED, changed CHANGED, and unchanged OK timelines |
| Diff UI | Displays the diff to the operator with **[ Confirm & Save]** and **[ Cancel]** buttons |
| Persistent Storage | Mapping is stored in both Node-RED flow context **and** the file system via Node-RED Read/Write file nodes (survives restarts) |
| Timeline Control | `start` / `stop` / `pause` timelines and `setVar` via the stored mapping |
| Real-time Monitoring | SSE listener on `/v0/events` for live state change events |
| Status Polling | Fallback polling via `GET /v0/state` every 5 s when SSE is disconnected |
| Error Handling | Graceful failures with human-readable error messages |

---

## File Structure

```
node-red/
├── flows/
│   ├── watchout-v2.json          ← Self-contained Node-RED flow (importable) ← USE THIS
│   └── watchout-integration.json ← Previous flow (v0.1, kept for reference)
├── config/
│   ├── watchout-config.json      ← Config template (copy to /data/watchout/)
│   └── watchout-defaults.json    ← Legacy defaults reference
└── data/
    └── timeline-mapping.json     ← Runtime-generated; persisted mapping
```

> **v0.2 change:** No files under `node-red/modules/` or `node-red/functions/`
> are required.  All logic is self-contained inside Node-RED nodes.

---

## Installation

### 1. Import the flow

In Node-RED, go to **Menu → Import → Clipboard** and paste the contents of
`node-red/flows/watchout-v2.json`.

### 2. Set the config file path

The startup inject node fires once on deploy with a default path of
`/data/watchout/watchout-config.json`.  Edit the inject node payload if you
want to store the config elsewhere.

### 3. Create / edit the config file

Copy `node-red/config/watchout-config.json` to
`/data/watchout/watchout-config.json` (or wherever you pointed the inject) and
edit it:

```json
{
  "host": "192.168.1.10",
  "port": 3019,
  "mappingFile": "/data/watchout/timeline-mapping.json"
}
```

If the file does not exist the flow will create it with defaults on first deploy.

### 4. Required Node-RED nodes

The flow uses only **built-in Node-RED nodes** plus the Node-RED Dashboard
(`@flowfuse/node-red-dashboard`):

| Package | Nodes used |
|---------|-----------|
| `node-red` (built-in) | inject, function, switch, http in, http response, file in, file out, catch, debug |
| `@flowfuse/node-red-dashboard` (Dashboard 2.0) | ui-page, ui-group, ui-button, ui-template |

Install the dashboard if not already present:

```bash
cd ~/.node-red
npm install @flowfuse/node-red-dashboard
```

### 5. Deploy

Click **Deploy**.  On startup the flow will:
1. Read `watchout-config.json` (create with defaults if missing)
2. Read `timeline-mapping.json` (start with empty mapping if missing)
3. Connect to the Watchout SSE event stream

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
3.  Response parsed → new contentId → timelineId mapping built
        │
        ▼
4.  New mapping compared to stored mapping
        │
        ├─ REMOVED  : "Timeline 'show1' no longer exists"
        ├─ ADDED    : "New timeline 'show3' discovered"
        ├─ CHANGED  : "Timeline 'ambience1' ID has changed"
        └─ OK       : "show2"
        │
        ▼
5.  Diff UI displayed
        │
        ├─ [ Cancel]          → pending mapping cleared, nothing saved
        └─ [ Confirm & Save]  → mapping written to flow context
                                  + written to timeline-mapping.json
                                    via Node-RED Write file node
```

---

## Timeline Name → Content ID Convention

Watchout timeline names are converted to **content IDs** using these rules:

| Rule | Example input | Output |
|------|--------------|--------|
| Names starting with `_` are skipped | `_SystemClock` | *(ignored)* |
| Trimmed and lower-cased | `Show 1` | `show_1` |
| Spaces → underscores | `Ambience Scene 2` | `ambience_scene_2` |
| Non-alphanumeric chars removed | `Show (Main)` | `show_main` |

---

## Timeline Control API

Send a `POST` request to `/watchout/control` with a JSON body:

### Start a timeline
```json
{ "command": "start", "contentId": "show1" }
```

### Stop a timeline
```json
{ "command": "stop", "contentId": "show1" }
```

### Pause a timeline
```json
{ "command": "pause", "contentId": "show1" }
```

### Set a Watchout variable
```json
{ "command": "setVar", "varName": "brightness", "varValue": 0.8 }
```

### Get current state
```json
{ "command": "getState" }
```

**Response:**
```json
{
  "success": true,
  "command": "start",
  "timelineId": "1",
  "statusCode": 200,
  "body": {}
}
```

---

## Flow Context Variables

| Variable | Type | Description |
|----------|------|-------------|
| `watchout_config` | object | `{ host, port, mappingFile }` |
| `watchout_mapping` | object | Active `{ contentId: timelineId }` mapping |
| `watchout_pending` | object | Pending mapping awaiting operator confirmation |
| `watchout_state` | object | Latest state from SSE or polling |
| `watchout_sse_status` | string | `'connected'` \| `'disconnected'` \| `'error'` |

---

## Real-time Monitoring

The flow connects to Watchout's SSE event stream at `/v0/events` on startup.

- While connected: state-change events are displayed in the **Live State** UI
  tile.
- If SSE drops: the flow automatically reconnects after 5 s.  Meanwhile, a
  separate 5-second poll inject falls back to `GET /v0/state` to keep state
  current.  The **Live State** tile shows ` Polling (SSE offline)` when in
  fallback mode.

---

## Watchout 7 HTTP API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v0/timelines` | List all timelines |
| `POST` | `/v0/timelines/{id}/play` | Start a timeline |
| `POST` | `/v0/timelines/{id}/stop` | Stop a timeline |
| `POST` | `/v0/timelines/{id}/pause` | Pause a timeline |
| `PUT` | `/v0/vars/{name}` | Set a variable |
| `GET` | `/v0/state` | Get current system state |
| `GET` | `/v0/events` | SSE stream of state changes |

---

## Migration from v0.1

v0.1 stored the timeline mapping at a path configured inside the inject node
(`storageFile`) and loaded it via `fs.readFileSync` in function nodes.

To migrate an existing mapping file:

1. Open the new `watchout-v2.json` flow.
2. Edit the startup inject node payload to point to your old config path, e.g.
   `/data/watchout/watchout-config.json`.
3. In the config JSON, set `mappingFile` to the path of your existing mapping
   file.  The flow will read it on next deploy.

If your existing mapping file uses the old `{ mapping: {...} }` wrapper format
it will be read correctly.  A flat `{ contentId: timelineId }` format is also
accepted.

---

## Roadmap

- **v0.1** *(previous)* — Logic in external JS modules (`watchout-http.js`,
  `watchout-integration.js`, `functions/*.js`)
- **v0.2** *(this version)* — All logic self-contained in Node-RED nodes;
  Node-RED Read/Write file nodes for persistence; SSE monitoring with
  auto-reconnect and polling fallback
- **v0.3** *(future)* — ISAAC integration (Events & Playables → Show
  Controller decision tree)
