# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Added

- **`node-red/flows/ma-cue-mapper.json`** — MA Cue Mapper module (FlowFuse Dashboard 2.0)
  - New dashboard page `/ma-cue-map` ("MA Cue Mapper"), order 7 in the navigation.
  - **Per-space cue label mapping** — supports Atrium 1, Atrium 2, Atrium 3, and Landscape
    (space keys `a1`, `a2`, `a3`, `ls`). The same label (e.g. "Green Look") is maintained
    independently for each space.
  - **Add / Edit Cue group** — Space dropdown, Cue Label text field, Target Type dropdown
    (Sequence Cue / Executor Cue), Sequence # and Cue # number inputs,
    **Save Entry** (add or update) and **Delete Entry** buttons.
  - **Cue Map display** — read-only `ui-template` table showing all entries per space with
    colour-coded rows (purple = sequence, green = executor).
  - **Fire Cue by Label group** — Space dropdown, Cue Label text field, **Fire Cue** button.
    Resolves the label to the stored MA command and routes it through the existing
    `ma-control-fn` owner-gate.
  - **Two target types**:
    1. *Sequence cue* — emits `Go+ Sequence <N> Cue <N>`
    2. *Executor cue* — emits `Go+ Executor <zone> Cue <N>` (zone derived from selected space)
  - Persists map to **`node-red/config/ma-cue-map.json`** on every save/delete.
    Auto-discovers the file via the same project-directory walk used by the MA Init node.

- **`node-red/config/ma-cue-map.json`** — Default empty per-space cue map
  (`{ "a1": [], "a2": [], "a3": [], "ls": [] }`).

### Removed

- **`node-red/config/watchout-defaults.json`** — Legacy defaults file deleted; superseded by `watchout-config.json` (v0.2 config template).

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

- **`docs/watchout-integration.md`** *(deleted — superseded)* — v0.1 setup guide;
  replaced by [`docs/watchout-http-integration.md`](docs/watchout-http-integration.md)

### Architecture Notes

- v0.1 is the Watchout integration layer **only**.
- ISAAC integration is deferred to v0.2.
- Port: **3019** (default Watchout 7 HTTP API port).
- API reference: <https://docs.dataton.com/watchout-7/external_protocol/ext_wo7.html>
