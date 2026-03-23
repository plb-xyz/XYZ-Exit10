# Watchout 7 HTTP Integration — Node-RED (v0.2)

## Overview

This integration connects Dataton Watchout 7 with Node-RED via the Watchout HTTP
API.  Everything runs directly inside Node-RED nodes — no external JavaScript
modules are required.  The only external files are two JSON files used for
persistence:

- `watchout-config.json` — host, port, and file paths
- `timeline-mapping.json` — the active `contentId → timelineId` mapping

**Default port:** `3019`

> **Note (v0.2):** SSE monitoring uses the **`node-red-contrib-sse-client`**
> contrib node (see [§ Required Node-RED nodes](#4-required-node-red-nodes)).
> No `require()` calls exist anywhere in the flow — all HTTP I/O goes through
> built-in **HTTP Request** nodes and the SSE client contrib node.

---

## Features

| Feature | Description |
|---------|-------------|
| Manual Timeline Discovery | Operator clicks **[ Re-discover Timelines]** to fetch the timeline list from Watchout |
| Change Detection | Compares old vs new mapping — shows removed REMOVED, added ADDED, changed CHANGED, and unchanged OK timelines |
| Diff UI | Displays the diff to the operator with **[ Confirm & Save]** and **[ Cancel]** buttons |
| Persistent Storage | Mapping is stored in both Node-RED flow context **and** the file system via Node-RED Read/Write file nodes (survives restarts) |
| Timeline Control | `start` / `stop` / `pause` timelines and `setVar` via the stored mapping |
| Real-time Monitoring | SSE listener on Watchout Event Streams — `/v2/sse` recommended (optimised diffs/countdowns); `/v1/sse` for full state on each update; `/v0/sse` legacy |
| NDJSON streaming | Alternative to SSE: `/v2/ndjson` stream consumed via a built-in **HTTP Request** node |
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
│   └── watchout-config.json      ← Config template (copy to /config/ in Docker)
└── data/
    └── .gitkeep                  ← Runtime-generated mapping goes here (or /data/)
```

> **v0.2 change:** No files under `node-red/modules/` or `node-red/functions/`
> are required.  All logic is self-contained inside Node-RED nodes.
>
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

The flow requires one **contrib** node in addition to the built-in Node-RED
nodes and the Dashboard:

| Package | Nodes used |
|---------|-----------|
| `node-red` (built-in) | inject, function, switch, http in, http request, http response, file in, file out, catch, debug |
| `@flowfuse/node-red-dashboard` (Dashboard 2.0) | ui-page, ui-group, ui-button, ui-template |
| `node-red-contrib-sse-client` (**required**) | sse-client |

Install both packages if not already present:

```bash
cd ~/.node-red
npm install @flowfuse/node-red-dashboard node-red-contrib-sse-client
```

Restart Node-RED after installing.

> **SSE URL:** Open the **SSE client** node in Node-RED and type the URL
> directly into the node's **URL** field.  `node-red-contrib-sse-client` does
> **not** allow `msg.url` (or any other `msg.*` property) to override the URL
> configured inside the node — the node will log a warning and ignore the
> message property.  Remove any "Configure SSE URL" function node that attempts
> to set `msg.url` before the SSE client.
>
> **Recommended URL** (Watchout Event Streams, optimised diffs/countdowns):
> ```
> http://host.docker.internal:3019/v2/sse
> ```
>
> Use `/v1/sse` if you need the full state object on every update, or `/v0/sse`
> for the legacy stream.  Add the HTTP header `Accept: text/event-stream` in
> the node's **Headers** section.
>
> If you change the Watchout host/port, edit the SSE node URL directly and
> re-deploy.

### 5. Docker networking — reaching Watchout from inside a container

When Watchout runs on the **same Windows machine** as Docker Desktop, Node-RED
(running inside a container) cannot reach Watchout via `localhost` — that
resolves to the container itself, not the host.  Use the special Docker
hostname instead:

| Scenario | Hostname to use |
|----------|----------------|
| Watchout on Windows Docker-host (Docker Desktop) | `host.docker.internal` |
| Watchout on a separate PC on your LAN | The PC's IP address, e.g. `192.168.1.10` |

**Example URLs (port 3019 default):**

```
# SSE — recommended (optimised diffs)
http://host.docker.internal:3019/v2/sse

# SSE — full state on each update
http://host.docker.internal:3019/v1/sse

# NDJSON stream (alternative to SSE, plain HTTP Request node)
http://host.docker.internal:3019/v2/ndjson

# Timeline list / control / state polling
http://host.docker.internal:3019/v0/timelines
http://host.docker.internal:3019/v0/state
```

You can verify the host is reachable from inside the Node-RED container before
deploying:

```bash
docker exec -it <nodered-container> sh
# install curl if needed (Alpine):
apk add --no-cache curl
# test the SSE stream — should stay connected and print events:
curl -N http://host.docker.internal:3019/v2/sse
```

If the container cannot reach `host.docker.internal`, add
`--add-host host.docker.internal:host-gateway` to your `docker run` command or
the equivalent `extra_hosts` entry in your Compose file:

```yaml
services:
  nodered:
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### 6. Deploy

Click **Deploy**.  On startup the flow will:
1. Read `/config/watchout-config.json` (create with defaults if missing)
2. Read `/data/timeline-mapping.json` (start with empty mapping if missing)
3. Connect to the Watchout SSE event stream (`/v2/sse`) via `node-red-contrib-sse-client`
   (URL must be configured in the SSE node itself — see § Required Node-RED nodes above)

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

The flow connects to Watchout's SSE Event Streams endpoint on startup using the
**`node-red-contrib-sse-client`** contrib node.

### Choosing an endpoint

| Endpoint | Stream content | When to use |
|----------|---------------|-------------|
| `/v2/sse` | Optimised diffs + countdown timers | **Recommended default** |
| `/v1/sse` | Full state object on every update | When you need the complete state on each event |
| `/v0/sse` | Legacy/basic stream | Older Watchout 7 builds only |
| `/v2/ndjson` | Same as `/v2/sse` but as newline-delimited JSON | Alternative if SSE client misbehaves; use a built-in **HTTP Request** node |

Configure the URL **directly in the SSE node** (e.g.
`http://host.docker.internal:3019/v2/sse`).  The `node-red-contrib-sse-client`
node does not support overriding the URL via `msg.*` properties at runtime.

- While connected: state-change events are displayed in the **Live State** UI
  tile.
- If the SSE stream drops: the contrib node auto-reconnects (configured with
  `restart: true`).  Meanwhile, a separate 5-second poll inject falls back to
  `GET /v0/state` (via a built-in **HTTP Request** node) to keep state current.
  The **Live State** tile shows `⚠ Polling (SSE offline)` when in fallback mode.
- SSE connection errors are caught by a **catch** node wired to the SSE client
  and surfaced in the **SSE Status** dashboard tile.

---

## Watchout 7 HTTP API Reference

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/v0/timelines` | List all timelines |
| `POST` | `/v0/timelines/{id}/play` | Start a timeline |
| `POST` | `/v0/timelines/{id}/stop` | Stop a timeline |
| `POST` | `/v0/timelines/{id}/pause` | Pause a timeline |
| `PUT` | `/v0/vars/{name}` | Set a variable |
| `GET` | `/v0/state` | Get current system state (polling) |
| `GET` | `/v0/sse` | SSE stream — legacy/basic |
| `GET` | `/v1/sse` | SSE stream — full state on each update |
| `GET` | `/v2/sse` | SSE stream — optimised diffs/countdowns (**recommended**) |
| `GET` | `/v2/ndjson` | NDJSON stream — same content as `/v2/sse` |

---

## Migration from v0.1

v0.1 stored the timeline mapping at a path configured inside the inject node
(`storageFile`) and loaded it via `fs.readFileSync` in function nodes.

To migrate an existing mapping file:

1. Open the new `watchout-v2.json` flow.
2. Edit the startup inject node payload to point to your config, e.g.
   `/config/watchout-config.json`.
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
  Node-RED HTTP Request nodes for all Watchout API calls; SSE monitoring via
  `node-red-contrib-sse-client`; Node-RED Read/Write file nodes for persistence;
  default paths `/config/watchout-config.json` and `/data/timeline-mapping.json`
- **v0.3** *(future)* — ISAAC integration (Events & Playables → Show
  Controller decision tree)
