# Intent → ActionPlan → Adapters Architecture

> **Relates to:** [`docs/show-control-state-model.json`](show-control-state-model.json) ·
> [`docs/show-control-state-model.md`](show-control-state-model.md) ·
> [`docs/watchout-http-integration.md`](watchout-http-integration.md) ·
> [`PROJECT-SCOPE.md`](../PROJECT-SCOPE.md)

---

## 1. Overview

This document explains how a high-level **Intent** (e.g. "start Ambience 1 in
Atrium 2") flows through the Node-RED orchestration layer and is transformed into
concrete commands for Watchout, MA, and Q-Sys.

The pipeline has the following stages:

```
┌───────────────────────────────────────────────────────────────────────────────┐
│  SOURCES                                                                       │
│  UI / Scheduler / Prayer / System Events                                       │
└──────────────────────────────┬────────────────────────────────────────────────┘
                               │  raw msg (topic + payload)
                               ▼
                   ┌─────────────────────┐
                   │  normalizeIntent    │  stamps metadata, normalises field
                   │  (Function node)    │  names, validates required fields
                   └──────────┬──────────┘
                              │  normalised Intent
                              ▼
                   ┌─────────────────────┐
                   │  policyGate /       │  reads flow.state (show-control-
                   │  Decision Maker     │  state-model.json), enforces guards
                   │  (Function node)    │  (prayer, event, mode), updates
                   │                     │  context, emits Transition
                   └──────────┬──────────┘
                              │  Transition { contextDelta, reconcile }
                              ▼
                   ┌─────────────────────┐
                   │  Action Planner     │  looks up actionMap by playableId,
                   │  (actionMap lookup) │  filters by scope (spaces), produces
                   │                     │  ActionPlan (ordered action list)
                   └──────────┬──────────┘
                              │  ActionPlan [ action, action, ... ]
                              ▼
                   ┌─────────────────────┐
                   │  Director /         │  sequences steps, injects run
                   │  Sequencer          │  metadata { runId, step, total }
                   └──────────┬──────────┘
                              │  individual action messages
                              ▼
                   ┌─────────────────────┐
                   │  Dispatcher         │  routes each action to the correct
                   │  (switch / router)  │  adapter based on action.type
                   └──────────┬──────────┘
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
   ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
   │  Watchout    │  │  MA          │  │  Q-Sys       │
   │  Adapter     │  │  Adapter     │  │  Adapter     │
   └──────┬───────┘  └──────┬───────┘  └──────┬───────┘
          │                 │                 │
          ▼                 ▼                 ▼
   Watchout HTTP      MA Control         Q-Sys OSC/REST
   (timelineKey /     payload contract   payload contract
    cueKey)           (goSequenceCue /
                       goExecutorCue /
                       goCmd / goMacro)
          │                 │                 │
          └─────────────────┴─────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │  Feedback / State       │  wo/state, ma/status, qsys/status
              │  (back to Decision Maker│  → updates flow.state
              │   for reconciliation)   │
              └─────────────────────────┘
```

---

## 2. Core Concepts

### 2.1 Intent

An **Intent** is a semantic description of what an operator (or the scheduler, or
the prayer system) wants the installation to *do*. It does **not** specify which
subsystem to call or how — that is resolved later.

**Key fields:**

| Field | Description |
|-------|-------------|
| `kind` | Verb: `start`, `stop`, `setAmbience`, `setSpecial`, `startShow`, … |
| `playableId` | Content identifier: `ambience_1`, `show_2`, `promo_overlay` |
| `scope` | Spatial constraint: `{ spaces: ['a2'] }` limits the action to Atrium 2 |
| `source` | Who generated the intent: `ui`, `scheduler`, `prayer`, `sys` |
| `requestedBy` / `requestedAt` | Audit metadata |

**Examples:**

```js
// From the Node-RED Dashboard (UI button)
{ kind: 'setAmbience', playableId: 'ambience_1', scope: { spaces: ['a2'] }, source: 'ui' }

// From the scheduler
{ kind: 'startShow', playableId: 'show_1', source: 'scheduler' }

// From the prayer system
{ kind: 'prayerActive', endsAt: '2026-04-04T17:30:00Z', source: 'prayer' }
```

> **Relationship to `msg.topic`:** The `normalizeIntent` function node accepts
> both the legacy `msg.topic = 'ui/setAmbience'` format *and* the newer
> `msg.payload.kind` format, normalising them into a consistent Intent object
> before passing it downstream.

---

### 2.2 Transition

A **Transition** is the output of the Decision Maker (policyGate) after it has
processed an Intent. It answers two questions:

1. **What changed in the context?** (`contextDelta`) — the fields of
   `flow.state.context` that must be updated.
2. **What must be reconciled with external systems?** (`reconcile`) — the
   high-level description of what the installation state should now look like,
   which becomes the input to the Action Planner.

A Transition is *not* a list of subsystem commands — it is the bridge between
the state model and the action planning layer.

**Conceptual shape:**

```js
{
  contextDelta: {
    // Partial update to flow.state.context
    spaces: {
      a2: {
        background: { contentId: 'ambience_1', type: 'AMBIENCE' }
      }
    }
  },
  reconcile: {
    // What the Action Planner needs to know
    kind: 'setAmbience',
    playableId: 'ambience_1',
    scope: { spaces: ['a2'] }
  }
}
```

The Decision Maker (see [`docs/show-control-state-model.md`](show-control-state-model.md))
also enforces guards before emitting a Transition:

- **Prayer guard** — blocks or postpones shows while `context.prayer.active === true`.
- **Event guard** — prevents shows from starting during an active event.
- **Mode guard** — ignores `sched/*` topics unless `context.schedulerEnabled === true`.

See [`docs/show-control-state-model.json`](show-control-state-model.json) for the
full guard and policy specification.

---

### 2.3 ActionPlan

An **ActionPlan** is an ordered list of subsystem actions that, when executed
together, bring the installation into the state described by the Transition.

Each action is a plain JavaScript object with a `type` field that identifies the
target adapter, plus adapter-specific fields:

```js
// Watchout action — uses key-based control (see docs/watchout-http-integration.md)
{ type: 'watchout', command: 'start', timelineKey: 'ambience_1_a2' }

// MA action — resolved via flow.ma_cue_mapping[space][labelId]
{ type: 'ma', command: 'GoCue', space: 'a2', labelId: 'ambience_1' }

// Q-Sys action
{ type: 'qsys', command: 'RecallScene', scene: 'Ambience' }
{ type: 'qsys', command: 'SetBgmMute', value: 0 }
```

The **actionMap** is the lookup table that maps a `playableId` to its full set of
actions (across all spaces). The Action Planner reads from the actionMap and
**filters** the resulting list to only the actions that match the requested scope.

---

### 2.4 Adapter

An **Adapter** is a thin Node-RED Function node (or subflow) that translates a
single action from the ActionPlan into the exact payload contract expected by one
external system.

Each adapter:

- Accepts only its own `type` (checked at the top of the function).
- Resolves abstract identifiers (e.g. `timelineKey`, `labelId`) into concrete API
  parameters (e.g. `watchoutTimelineId`, MA sequence/executor/cue number).
- Emits the final payload on **output 1** and errors on **output 2**.
- Does **not** make routing decisions — that is the Dispatcher's job.

| Adapter | Resolves | Output contract |
|---------|----------|-----------------|
| Watchout adapter | `timelineKey` → `watchoutTimelineId` via `flow.watchout_mapping` | `POST /v0/play/{id}` etc. |
| MA adapter | `space` + `labelId` → entry in `flow.ma_cue_mapping` | `{ action: 'goSequenceCue' \| 'goExecutorCue' \| 'goCmd' \| 'goMacro', … }` |
| Q-Sys adapter | scene name / parameter | Q-Sys OSC or REST payload |

---

## 3. How a Transition Works (Step by Step)

1. **Intent arrives** at `normalizeIntent`. Field names are normalised
   (e.g. `targets` → `spaces`), `requestedAt` is stamped, and the intent is
   validated.

2. **policyGate / Decision Maker** reads `flow.state.context`, checks guards,
   and either:
   - **Blocks** the intent (e.g. prayer is active → store as `pendingShow`), or
   - **Applies** the context delta (mutates `flow.state.context`) and emits a
     Transition to the Action Planner.

3. **Action Planner** receives the `reconcile` portion of the Transition,
   looks up `actionMap[playableId]`, and **scopes** the result:
   - For `scope: { spaces: ['a2'] }`, only actions whose `space === 'a2'` (or
     actions with no space constraint, such as `qsys`) are kept.
   - The filtered list is the **ActionPlan**.

4. **Director / Sequencer** iterates the ActionPlan, adding `{ runId, step, total }`
   metadata to each action message so adapters and downstream nodes can correlate
   related commands and detect completion.

5. **Dispatcher** examines `action.type` and routes the message to the correct
   adapter link-in node.

6. **Adapter** resolves the abstract action into the external system's payload
   contract and sends it. On success, it forwards the response; on failure, it
   emits an error to the orchestration error bus.

7. **Feedback** from external systems (`wo/state`, `ma/status`, `qsys/status`)
   flows back into the Decision Maker, which updates `flow.state.context`
   accordingly (e.g. confirming that a timeline is now playing).

---

## 4. Project Rules and How They Map to This Architecture

From [`PROJECT-SCOPE.md`](../PROJECT-SCOPE.md):

| Project Rule | Where it is enforced |
|---|---|
| **Shows are global** — only one show active at a time, all spaces in sync | Decision Maker guard: `ui/startShow` sets `context.mode = 'SHOW'`; actionMap for shows contains actions for every space |
| **Ambiences are per-space flexible** — different content per space simultaneously | Action Planner scoping: `scope.spaces` filters the actionMap result; `context.spaces.<space>.background.contentId` is updated per space |
| **Events override scheduler** — `schedulerEnabled` forced to `false` during event | Decision Maker: `context.schedulerEnabled` derived from mode + event + prayer state; `sched/*` topics gated on this flag |
| **Special content = overlay or fullscreen, context-driven** | Separate layers in `context.spaces.<space>.special.onTop` / `.fullscreen`; fullscreen wins over on-top (policy in state model) |
| **Lighting always via MA** | Every ActionPlan that affects a space includes an MA action; MA adapter resolves via `flow.ma_cue_mapping` |
| **Landscape (`ls`) has no video** | Decision Maker and Action Planner both skip Watchout video commands for `ls` (`capabilities.hasVideo === false`) |

---

## 5. Watchout Key-Based Control Model

Watchout uses **numeric IDs** (`watchoutTimelineId`, `watchoutCueId`) internally,
but Node-RED orchestration always works with **named keys** (`timelineKey`,
`cueKey`). This indirection is documented in
[`docs/watchout-http-integration.md`](watchout-http-integration.md).

**Key naming convention for per-space ambiences:**

```
ambience_1_a1   ← Ambience 1 timeline for Atrium 1
ambience_1_a2   ← Ambience 1 timeline for Atrium 2
ambience_1_a3   ← Ambience 1 timeline for Atrium 3
bg_music_1      ← Background music (global, no space suffix)
```

The **Watchout adapter** resolves `timelineKey` → `watchoutTimelineId` at
runtime using `flow.watchout_mapping` (populated by the Timeline Discovery
workflow in Watchout integration). The orchestration layer never hardcodes
numeric Watchout IDs.

Similarly, cue names are stored as `cueKey` (normalised strings) and resolved to
`watchoutCueId` at execution time.

---

## 6. Worked Example: Set Ambience 1 in Atrium 2 Only

This example traces a single intent from the Dashboard button through to the
final Watchout and MA commands.

### 6.1 Intent (from UI)

The operator presses the "Ambience 1 — Atrium 2" button on the Node-RED
Dashboard. The button sends:

```json
{
  "topic": "ui/setAmbience",
  "payload": {
    "space": "a2",
    "contentId": "ambience_1",
    "requestedBy": "operator",
    "requestedAt": "2026-04-04T15:00:00Z"
  }
}
```

`normalizeIntent` converts this to a normalised Intent:

```js
{
  kind: 'setAmbience',
  playableId: 'ambience_1',
  scope: { spaces: ['a2'] },
  source: 'ui',
  requestedBy: 'operator',
  requestedAt: '2026-04-04T15:00:00Z'
}
```

### 6.2 Decision Maker — Context Update (Transition)

The Decision Maker reads `flow.state.context`, checks that the current mode is
`NORMAL` (no prayer, no event blocking), and applies the context delta:

**Before:**
```js
context.spaces.a2.background = { type: 'AMBIENCE', contentId: 'ambience_2' }
```

**After (context delta applied):**
```js
context.spaces.a2.background = { type: 'AMBIENCE', contentId: 'ambience_1' }
```

The Transition emitted to the Action Planner:

```js
{
  contextDelta: {
    spaces: { a2: { background: { type: 'AMBIENCE', contentId: 'ambience_1' } } }
  },
  reconcile: {
    kind: 'setAmbience',
    playableId: 'ambience_1',
    scope: { spaces: ['a2'] }
  }
}
```

> A1, A3, and LS backgrounds are **not changed** — their `contentId` values
> remain as they were. Only Atrium 2 is affected.

### 6.3 Action Planner — ActionPlan

The Action Planner looks up `actionMap['ambience_1']` (the full recipe for
Ambience 1 across all spaces):

```js
actionMap['ambience_1'] = [
  { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a1' },
  { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a2' },
  { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a3' },
  { type: 'watchout', command: 'start', timelineKey: 'bg_music_1' },
  { type: 'ma', command: 'GoCue', space: 'a1', labelId: 'ambience_1' },
  { type: 'ma', command: 'GoCue', space: 'a2', labelId: 'ambience_1' },
  { type: 'ma', command: 'GoCue', space: 'a3', labelId: 'ambience_1' },
  { type: 'ma', command: 'GoCue', space: 'ls', labelId: 'ambience_1' },
  { type: 'qsys', command: 'RecallScene', scene: 'Ambience' },
  { type: 'qsys', command: 'SetBgmMute', value: 0 }
]
```

Because `scope.spaces = ['a2']`, the Action Planner **filters** this list,
keeping only actions that:
- have `space === 'a2'`, **or**
- have no `space` field at all (i.e. they are global / not space-specific).

**Resulting ActionPlan (emitted to the Director):**

```js
[
  { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a2' },
  { type: 'ma',       command: 'GoCue', space: 'a2', labelId: 'ambience_1' },
  { type: 'qsys',     command: 'RecallScene', scene: 'Ambience' },
  { type: 'qsys',     command: 'SetBgmMute', value: 0 }
]
```

> The `bg_music_1` Watchout action (no space suffix → global) would also be
> included or excluded depending on whether your background music follows per-space
> scope rules or is always global. Adjust the scoping logic in the Action Planner
> accordingly.

### 6.4 Director — Step Sequencing

The Director adds run metadata to each action:

```js
// Step 1 of 4
{ runId: 'run_abc123', step: 1, total: 4,
  action: { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a2' } }

// Step 2 of 4
{ runId: 'run_abc123', step: 2, total: 4,
  action: { type: 'ma', command: 'GoCue', space: 'a2', labelId: 'ambience_1' } }

// ... and so on
```

### 6.5 Adapters — Final Payloads

**Watchout adapter** resolves `timelineKey: 'ambience_1_a2'` from
`flow.watchout_mapping` (see [`docs/watchout-http-integration.md`](watchout-http-integration.md)):

```
POST /v0/play/3          (where "3" is watchoutTimelineId for ambience_1_a2)
```

**MA adapter** resolves `space: 'a2', labelId: 'ambience_1'` from
`flow.ma_cue_mapping['a2']['ambience_1']`. If that entry is of type
`executorCue`, the output is:

```json
{ "action": "goExecutorCue", "zones": ["1.202"], "cue": "4" }
```

→ sent to the MA Control pipeline.

**Q-Sys adapter** sends the RecallScene and SetBgmMute commands to the Q-Sys
REST/OSC endpoint.

---

## 7. Summary: What Each Layer is Responsible For

| Layer | Node-RED node(s) | Responsibility |
|---|---|---|
| `normalizeIntent` | Function node | Field normalisation, metadata stamping, validation |
| `policyGate` / Decision Maker | Function node | Guard checks, context updates, Transition emission |
| Action Planner | Function node (actionMap lookup) | Expand `playableId` → full action list; filter by `scope` |
| Director / Sequencer | Function node | Add `runId/step/total`; optionally sequence with delays |
| Dispatcher | Switch node | Route by `action.type` to correct adapter |
| Watchout Adapter | Function node | `timelineKey` → Watchout REST payload |
| MA Adapter | Function node | `space + labelId` → MA Control payload contract |
| Q-Sys Adapter | Function node | command + params → Q-Sys payload |

This separation means:
- **Ops can change MA cue numbers** in `flow.ma_cue_mapping` without touching show recipes.
- **Watchout timeline IDs** change only in the timeline mapping — not in orchestration logic.
- **Show recipes** (actionMap entries) stay readable and subsystem-agnostic.
- **New adapters** (e.g. Pharos, ISAAC) can be added by wiring a new branch from the Dispatcher, with no changes to the Decision Maker or Action Planner.
