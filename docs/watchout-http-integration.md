# Watchout 7 HTTP Integration — Node-RED (v0.1)

## Overview

This module integrates Dataton Watchout 7 with Node-RED via its built-in HTTP API.

**Default port:** `3019`

### Features

| Feature | Description |
|---------|-------------|
| Manual Timeline Discovery | Operator clicks **[Re-discover Timelines]** button to fetch the timeline list from Watchout |
| Change Detection | Compares old vs new mapping — shows removed ❌, added ✨, and changed 🔄 timelines |
| Diff UI | Displays the diff to the operator with **[Confirm & Save]** and **[Cancel]** buttons |
| Persistent Storage | Mapping is stored in both Node-RED flow context **and** the file system (survives restarts) |
| Timeline Control | `start` / `stop` / `pause` timelines and `setVar` via the stored mapping |
| Real-time Monitoring | SSE listener on `/v0/events` for live state change events |
| Status Polling | Fallback polling via `GET /v0/state` every 5 s when SSE is disconnected |
| Error Handling | Graceful failures with human-readable error messages |

---

## File Structure

```
node-red/
├── modules/
│   └── watchout-http.js          ← Core reusable class (WatchoutHTTP)
├── functions/
│   ├── watchout-discover.js      ← Function node: fetch + diff timelines
│   ├── watchout-control.js       ← Function node: start / stop / pause / setVar / getState
│   ├── watchout-confirm.js       ← Function node: confirm & save pending mapping
│   └── watchout-cancel.js        ← Function node: cancel pending mapping
├── flows/
│   └── watchout-integration.json ← Node-RED flow (importable)
├── config/
│   └── watchout-defaults.json    ← Default configuration values
└── data/
    └── timeline-mapping.json     ← Runtime-generated; persisted mapping
```

---

## Installation

### 1. Import the flow

In Node-RED, go to **Menu → Import → Clipboard** and paste the contents of  
`node-red/flows/watchout-integration.json`.

### 2. Configure the Watchout host

Edit the **"Init config on deploy"** inject node and set:

```json
{
  "host": "192.168.1.10",
  "port": 3019,
  "storageFile": "/data/watchout/timeline-mapping.json"
}
```

### 3. Deploy

Click **Deploy**. The configuration is stored in flow context automatically.

---

## Manual Timeline Discovery Workflow

```
Operator opens Node-RED dashboard → "Watchout" tab

1.  Operator clicks  [🔍 Re-discover Timelines]
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
        ├─ ❌ Removed  : "Timeline 'show1' no longer exists"
        ├─ ✨ Added    : "New timeline 'show3' discovered"
        ├─ 🔄 Changed  : "Timeline 'ambience1' ID has changed"
        └─ ✓  Unchanged: "show2"
        │
        ▼
5.  Diff UI displayed
        │
        ├─ [✗ Cancel]         → pending mapping cleared, nothing saved
        └─ [✔ Confirm & Save] → mapping written to context + file
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
| `watchout_config` | object | `{ host, port, storageFile }` |
| `watchout_mapping` | object | Active `{ contentId: timelineId }` mapping |
| `watchout_pending` | object | Pending mapping awaiting operator confirmation |

---

## Using the Module Directly

The `WatchoutHTTP` class in `node-red/modules/watchout-http.js` can be used independently:

```javascript
const WatchoutHTTP = require('./node-red/modules/watchout-http.js');

const wo = new WatchoutHTTP({
  host: '192.168.1.10',
  port: 3019,
  storageFile: './data/timeline-mapping.json',
});

// Manual discovery
const { diff, hasChanges, newMapping } = await wo.discoverTimelines();
if (hasChanges) {
  console.log(wo.formatDiff(diff).join('\n'));
  // ... show diff to operator, then:
  wo.confirmDiscovery();
}

// Control
await wo.startTimeline('show1');
await wo.stopTimeline('show1');

// Monitoring
wo.on('state-change', (event) => console.log('State:', event));
wo.on('connected',    ()      => console.log('SSE connected'));
wo.on('disconnected', ()      => console.log('SSE disconnected — polling'));
wo.on('error',        (err)   => console.error('Error:', err.message));
wo.startMonitoring();

// Cleanup
wo.destroy();
```

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

## Roadmap

- **v0.1** *(this version)* — Manual timeline discovery, control, SSE/polling monitoring
- **v0.2** — ISAAC integration (Events & Playables → Show Controller decision tree)
