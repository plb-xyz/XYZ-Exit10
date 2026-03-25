# Watchout 7 HTTP Integration — Node-RED (v0.2)

## Overview

This integration connects Dataton Watchout 7 with Node-RED via the Watchout HTTP
API.  Everything runs directly inside Node-RED nodes — no external JavaScript
modules are required.  The only external files are two JSON files used for
persistence:

- `watchout-config.json` — host, port, and file paths
- `timeline-mapping.json` — the active `contentId → { displayName, watchoutId }` mapping

**Default port:** `3019`

> **Note (v0.2):** Real-time monitoring uses the **NDJSON stream** at
> `GET /v1/ndjson` via the built-in **HTTP Request** node — no contrib node
> required.  SSE endpoints (`/v0/sse`, `/v1/sse`, `/v2/sse`) remain available
> as an alternative but the `node-red-contrib-sse-client` package is **optional**.
> No `require()` calls exist anywhere in the flow — all HTTP I/O goes through
> built-in **HTTP Request** nodes.

---

## Features

| Feature | Description |
|---------|-------------|
| Manual Timeline Discovery | Operator clicks **[ Re-discover Timelines]** to fetch the timeline list from Watchout |
| Change Detection | Compares old vs new mapping — shows removed REMOVED, added ADDED, changed CHANGED, and unchanged OK timelines |
| Diff UI | Displays the diff to the operator with **[ Confirm & Save]** and **[ Cancel]** buttons |
| Persistent Storage | Mapping is stored in both Node-RED flow context **and** the file system via Node-RED Read/Write file nodes (survives restarts) |
| Timeline Control | `start` / `stop` / `pause` timelines and `setInput` / `setInputs` via the stored mapping |
| Real-time Monitoring | NDJSON stream via `GET /v1/ndjson` (preferred) — parsed with built-in nodes; no contrib required |
| SSE Alternative | SSE endpoints `/v0/sse` (legacy), `/v1/sse` (full), `/v2/sse` (diff) available if needed |
| Status Polling | Fallback polling via `GET /v0/state` every 5 s when the stream is disconnected |
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
`/config/watchout-config.json`.  Edit the inject node payload if you
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
> `node-red-contrib-sse-client`.  However, note that this contrib node does
> **not** allow overriding its configured URL via `msg.url` or similar message
> properties — the URL must be set directly in the node's configuration panel.
> Some versions also enforce a connection timeout that can cause repeated
> disconnects when the Watchout stream is quiet.  For these reasons **NDJSON
> via built-in HTTP Request is the recommended approach**.

> **Docker on Windows — URL note:** Node-RED running inside a Docker container
> on Windows cannot reach `localhost` on the host.  Use
> `http://host.docker.internal:3019/...` instead (Docker Desktop for Windows
> resolves this hostname to the host machine automatically).  See
> [§ Docker on Windows Networking](#docker-on-windows-networking) below.

### 5. Deploy

Click **Deploy**.  On startup the flow will:
1. Read `/config/watchout-config.json` (create with defaults if missing)
2. Read `/data/timeline-mapping.json` (start with empty mapping if missing)
3. Begin streaming NDJSON events from Watchout via `GET /v1/ndjson`

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
Desktop.  Use this hostname in all Node-RED node URL fields, including the
NDJSON stream URL and any REST calls.

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
3.  Response parsed → new contentId → { displayName, watchoutId } mapping built
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

Each discovered timeline produces one entry in the mapping:

```json
{
  "show_1":    { "displayName": "Show 1",    "watchoutId": "1" },
  "ambience_1": { "displayName": "Ambience 1", "watchoutId": "3" }
}
```

- **`contentId`** — the normalized key used in ISAAC events and Node-RED messages (e.g. `"show_1"`)
- **`displayName`** — the original Watchout timeline name; used for human-readable labels in the UI
- **`watchoutId`** — the Watchout numeric timeline ID sent to the REST API

---

## Timeline Control API

Send a `POST` request to `/watchout/control` with a JSON body.  The
**Prepare control request** function node maps these commands to the correct
Watchout REST endpoints (see [§ Watchout 7 HTTP API Reference](#watchout-7-http-api-reference)):

### Start a timeline
```json
{ "command": "start", "contentId": "show_1" }
```
→ `POST /v0/play/{id}`

### Stop a timeline
```json
{ "command": "stop", "contentId": "show_1" }
```
→ `POST /v0/stop/{id}`

### Pause a timeline
```json
{ "command": "pause", "contentId": "show_1" }
```
→ `POST /v0/pause/{id}`

### Set a single Watchout input
```json
{ "command": "setInput", "key": "brightness", "value": 0.8 }
```
→ `POST /v0/input/{key}?value={v}`

### Set multiple Watchout inputs
```json
{ "command": "setInputs", "inputs": [{ "key": "brightness", "value": 0.8 }, { "key": "volume", "value": 50 }] }
```
→ `POST /v0/inputs` with JSON array body `[{key, value, duration?}]`

### Get current state
```json
{ "command": "getState" }
```
→ `GET /v0/state`

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
| `watchout_mapping` | object | Active `{ contentId: { displayName, watchoutId } }` mapping |
| `watchout_pending` | object | Pending mapping awaiting operator confirmation |
| `watchout_state` | object | Latest state from SSE or polling |
| `watchout_sse_status` | string | `'connected'` \| `'disconnected'` \| `'error'` |

---

## Real-time Monitoring

### Preferred: NDJSON stream (`GET /v1/ndjson`)

The flow connects to Watchout's NDJSON event stream at `/v1/ndjson` using a
built-in **HTTP Request** node.  Each line of the response is a complete JSON
object with the fields `kind` and `value`, for example:

```json
{"kind":"playbackState","value":{"clockTime":12345,"timelines":[...],"freeRunningRenders":[]}}
```

**Node-RED wiring for NDJSON:**

1. **Inject** node (fires on deploy / manual trigger)  
   → sets `msg.url = "http://host.docker.internal:3019/v1/ndjson"` and
   `msg.method = "GET"` then passes to the HTTP Request node.

2. **HTTP Request** node  
   - Method: `GET`  
   - Return: **a UTF-8 string** (do *not* parse as JSON — the response is
     multiple JSON objects, one per line)

3. **Function** node: **"Split NDJSON"**  
   Keeps a partial-line buffer in `context`, splits on `\n`, parses each
   complete line, and emits one message per event:

   ```javascript
   let buf = context.get('buf') || '';
   buf += msg.payload;
   const lines = buf.split('\n');
   const incompleteLine = lines.pop(); // last item may be incomplete — keep for next chunk
   context.set('buf', incompleteLine);
   const msgs = [];
   for (const line of lines) {
       const trimmed = line.trim();
       if (!trimmed) continue;
       try { msgs.push({ payload: JSON.parse(trimmed) }); }
       catch (e) { node.debug('NDJSON parse error: ' + e.message + ' | line: ' + trimmed); }
   }
   return [msgs];
   ```

4. **Switch** node: route on `msg.payload.kind`  
   - `playbackState` → update `flow.watchout_state` and refresh the **Live State** UI tile  
   - Other kinds (e.g. `inputs`, `showRevision`) → store or ignore as needed

`playbackState` messages contain the equivalent of the REST `GET /v0/state`
response (`clockTime`, `timelines`, `freeRunningRenders`, etc.).

While NDJSON is streaming:
- The **Stream Status** tile shows `✓ Streaming (NDJSON)`.
- If no message is received for > 10 s a trigger node flips the status to
  `⚠ Offline — reconnecting`.
- A fallback 5-second poll on `GET /v0/state` keeps state current in case the
  NDJSON connection drops.

### Alternative: SSE endpoints

Watchout 7 also exposes SSE (Server-Sent Events) endpoints.  These are useful
if you prefer a true event-source protocol, but the `node-red-contrib-sse-client`
node has known limitations (see § Required Node-RED nodes above).

| Endpoint | Description |
|----------|-------------|
| `GET /v0/sse` | Legacy SSE — basic state updates |
| `GET /v1/sse` | Full SSE — complete state on each update |
| `GET /v2/sse` | Diff SSE — optimized; sends only changes / countdown ticks |

> **Validation note:** `/v1/sse` and `/v2/sse` have been confirmed working via
> `curl http://localhost:3019/v1/sse` on Windows.  `/v2/ndjson` returns 404 in
> some Watchout builds; use `/v1/ndjson` instead.

---

## Watchout 7 HTTP API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v0/timelines` | List all timelines |
| `POST` | `/v0/play` | Play all timelines |
| `POST` | `/v0/play/{id}` | Start / resume a timeline by ID |
| `POST` | `/v0/pause/{id}` | Pause a timeline by ID |
| `POST` | `/v0/stop/{id}` | Stop a timeline by ID |
| `GET` | `/v0/inputs` | List all inputs and their current values |
| `POST` | `/v0/inputs` | Set multiple inputs — body: `[{key, value, duration?}]` |
| `POST` | `/v0/input/{key}?value={v}` | Set a single input by key |
| `GET` | `/v0/state` | Get current system state (REST poll) |
| `GET` | `/v0/sse` | SSE stream — legacy/basic state updates |
| `GET` | `/v1/sse` | SSE stream — full state on each update |
| `GET` | `/v2/sse` | SSE stream — diff / countdown ticks (optimized) |
| `GET` | `/v1/ndjson` | **NDJSON stream — preferred** (each line is `{"kind":…,"value":…}`) |
| `GET` | `/v2/ndjson` | NDJSON stream — diff variant (Watchout manual; may return 404 depending on build) |

> **Endpoint validation:** `curl http://localhost:3019/v1/ndjson` and
> `curl http://localhost:3019/v1/sse` both confirmed working on Windows.
> `/v2/ndjson` is documented in the Watchout manual but returns **404** in some
> builds — use `/v1/ndjson` instead.  Timeline control endpoints (`/v0/play/{id}`,
> `/v0/pause/{id}`, `/v0/stop/{id}`) confirmed via `curl -X POST
> http://localhost:3019/v0/play/0`.

---

## Roadmap

- **v0.2** *(this version)* — All logic self-contained in Node-RED nodes;
  Node-RED HTTP Request nodes for all Watchout API calls; **NDJSON streaming**
  via `GET /v1/ndjson` for real-time monitoring (no contrib node required);
  Node-RED Read/Write file nodes for persistence;
  default paths `/config/watchout-config.json` and `/data/timeline-mapping.json`
- **v0.3** *(future)* — ISAAC integration (Events & Playables → Show
  Controller decision tree)
