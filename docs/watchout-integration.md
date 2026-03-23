# Watchout 7 HTTP Integration — Module Reference (v0.1, superseded)

> **WARNING: Superseded by v0.2**
>
> The `watchout-integration.js` module-based approach described here has been
> superseded by a fully self-contained Node-RED flow.  For new deployments use
> `node-red/flows/watchout-v2.json` as described in
> [watchout-http-integration.md](watchout-http-integration.md).
>
> This file is kept as a reference for the module API and for operators
> migrating existing deployments.

---

## Overview

This module (`node-red/modules/watchout-integration.js`) provides a complete
integration layer between Node-RED and the **Watchout 7 HTTP External Protocol**.

Version: **v0.1** — Watchout integration only (no ISAAC integration in this version).

Reference: <https://docs.dataton.com/watchout-7/external_protocol/ext_wo7.html>

---

## Architecture

```
Node-RED startup
    │
    ▼
WatchoutIntegration.initialize()
    ├─ GET /v0/timelines      → builds timeline mapping → stores in global context
    ├─ GET /v0/state/changes  → SSE listener (legacy; see note below)
    └─ setInterval poll       → GET /v0/state every 5 s (fallback if SSE drops)

Show Controller (v0.2, future)
    └─ calls wo.startTimeline() / stopTimeline() / setInput()
```

> **Note on event stream endpoints (v0.1 vs v0.2):** The v0.1 module used
> `GET /v0/state/changes` for SSE.  In current Watchout 7 builds the validated
> event-stream endpoints are:
>
> | Endpoint | Type | Notes |
> |----------|------|-------|
> | `GET /v0/sse` | SSE | Legacy/basic |
> | `GET /v1/sse` | SSE | Full state on each update |
> | `GET /v2/sse` | SSE | Diff / countdown ticks |
> | `GET /v1/ndjson` | NDJSON | **Preferred** — each line is `{"kind":…,"value":…}` |
> | `GET /v2/ndjson` | NDJSON | Diff variant (may return 404 in some builds) |
>
> For new deployments use `watchout-v2.json` with the NDJSON approach described
> in [watchout-http-integration.md](watchout-http-integration.md).

---

## Configuration

| Option | Default | Description |
|--------|---------|-------------|
| `host` | `localhost` | Watchout machine IP or hostname |
| `port` | `3019` | Watchout 7 HTTP API port |
| `pollIntervalMs` | `5000` | Fallback polling interval (ms) |
| `sseReconnectDelayMs` | `3000` | Initial SSE reconnect delay (ms, doubles on each failure up to 30 s) |
| `onStateChange` | `null` | Callback fired on every SSE event or poll result |
| `onTimelinesReady` | `null` | Callback fired with the `contentId → timelineId` map after discovery |
| `onError` | `null` | Callback fired on non-fatal errors |

---

## Node-RED Setup

### 1. Place the module

Copy `node-red/modules/watchout-integration.js` into your Node-RED `userDir`,
for example: `~/.node-red/modules/watchout-integration.js`

### 2. Add a startup inject node

Create an **inject** node set to *"inject once after 1 second"*.  Wire it to a
**function** node containing:

```javascript
const WatchoutIntegration = require(RED.settings.userDir + '/modules/watchout-integration');

const wo = new WatchoutIntegration({
    host: global.get('woHost') || 'localhost',
    port: global.get('woPort') || 3019,

    onTimelinesReady: (mapping) => {
        global.set('woTimelines', mapping);
        node.log('Timelines ready: ' + JSON.stringify(mapping));
    },

    onStateChange: (state) => {
        global.set('woState', state);
    },

    onError: (err) => {
        node.error('Watchout error: ' + err.message);
    }
});

global.set('woIntegration', wo);
wo.initialize();
return msg;
```

### 3. Control a timeline

In any **function** node:

```javascript
const wo = global.get('woIntegration');

// By numeric timeline ID
await wo.startTimeline(1);
await wo.pauseTimeline(1);
await wo.stopTimeline(1);

// By content ID (timeline name from Watchout)
const id = wo.resolveTimelineId('show1');
if (id) await wo.startTimeline(id);
```

### 4. Set an input/variable

```javascript
const wo = global.get('woIntegration');

// Single input
await wo.setInput('A1_CONTENT', 5);

// With interpolation time (ms)
await wo.setInput('A1_CONTENT', 5, 1000);

// Multiple inputs at once
await wo.setInputs([
    { key: 'A1_CONTENT', value: 5 },
    { key: 'A2_CONTENT', value: 3 }
]);
```

### 5. Get current state

```javascript
const wo = global.get('woIntegration');
const state = await wo.getState();
node.warn(state);
```

---

## API Reference

### `new WatchoutIntegration(options)`

Create a new integration instance.

### `wo.initialize()` → `Promise<void>`

Discover timelines, start SSE listener and polling fallback.  Call once on
startup.

### `wo.destroy()`

Shut down SSE and polling timers gracefully.

### `wo.rediscover()` → `Promise<object>`

Re-run timeline discovery and update the internal mapping.  Useful after a
Watchout project reload.

### `wo.startTimeline(timelineId)` → `Promise<any>`

POST `/v0/play/{timelineId}`

### `wo.pauseTimeline(timelineId)` → `Promise<any>`

POST `/v0/pause/{timelineId}`

### `wo.stopTimeline(timelineId)` → `Promise<any>`

POST `/v0/stop/{timelineId}`

### `wo.resolveTimelineId(contentId)` → `string | undefined`

Look up a Watchout timeline ID by its name/contentId.

### `wo.setInput(key, value, interpolationTime?)` → `Promise<any>`

POST `/v0/input/{key}?value={value}[&time={interpolationTime}]`

### `wo.setInputs(inputs)` → `Promise<any>`

POST `/v0/inputs` with JSON body `[{ key, value, time? }, ...]`

### `wo.getState()` → `Promise<object>`

GET `/v0/state` — returns the current Watchout state object.

---

## Timeline Mapping

On startup, `WatchoutIntegration` calls `GET /v0/timelines` and builds a
`contentId → timelineId` map stored internally and passed to `onTimelinesReady`.

The map is stored in Node-RED global context under the key `woTimelines`:

```json
{
    "_Show1": "1",
    "_Show2": "2",
    "_Ambience1": "3"
}
```

**Important:** Timeline names are used as content IDs.  If you rename a
timeline in Watchout, call `wo.rediscover()` (or restart Node-RED) to refresh
the mapping.

---

## Watchout HTTP Endpoints Used

| Method | Path | Purpose |
|--------|------|---------|
| `GET` | `/v0/timelines` | Discover all timelines |
| `POST` | `/v0/play/{id}` | Start / resume a timeline |
| `POST` | `/v0/pause/{id}` | Pause a timeline |
| `POST` | `/v0/stop/{id}` | Stop a timeline |
| `POST` | `/v0/input/{key}?value={v}` | Set a single input/variable |
| `POST` | `/v0/inputs` | Set multiple inputs at once |
| `GET` | `/v0/state` | Poll current state (fallback) |
| `GET` | `/v0/state/changes` | SSE stream (v0.1 — **legacy**, see note in Architecture section) |

Default port: **3019**

> **v0.2+ event stream endpoints:** See
> [watchout-http-integration.md § Watchout 7 HTTP API Reference](watchout-http-integration.md#watchout-7-http-api-reference)
> for the current validated endpoints (`/v1/ndjson`, `/v1/sse`, `/v2/sse`, etc.).
