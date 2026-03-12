# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [v0.1.0] - 2026-03-11

### Added

- **`node-red/modules/watchout-integration.js`** — Watchout 7 HTTP API integration module
  - Timeline discovery via `GET /v0/timelines` on startup
  - Builds `contentId → timelineId` mapping and stores it in Node-RED global context
  - Timeline control: start (`POST /v0/play/{id}`), pause (`POST /v0/pause/{id}`),
    stop (`POST /v0/stop/{id}`)
  - Input/variable setting via `POST /v0/input/{key}` (single) and `POST /v0/inputs` (batch)
  - Real-time state monitoring via Server-Sent Events (`GET /v0/state/changes`)
    with exponential back-off reconnection logic
  - Status polling fallback via `GET /v0/state` every 5 seconds (activates only when
    SSE is not connected)
  - `onTimelinesReady`, `onStateChange`, and `onError` callbacks for Node-RED integration
  - `destroy()` method for graceful shutdown of SSE and polling timers
  - `rediscover()` method to refresh timeline mapping after a Watchout project reload

- **`node-red/flows/initialization-flow.js`** — Example Node-RED function-node snippets
  showing how to initialize, control timelines, and set inputs

- **`docs/watchout-integration.md`** — Setup guide with:
  - Configuration options
  - Node-RED wiring instructions
  - Full API reference
  - Timeline mapping explanation

### Architecture Notes

- v0.1 is the Watchout integration layer **only**.
- ISAAC integration is deferred to v0.2.
- Port: **3019** (default Watchout 7 HTTP API port).
- API reference: <https://docs.dataton.com/watchout-7/external_protocol/ext_wo7.html>
