# grandMA (MA) — Node-RED Command Contract (OSC /cmd)

This repo’s MA integration is designed around a **message contract** inside Node-RED:

**Node-RED msg.payload (semantic command)**
→ **MA Control function** (validates owner-gate + maps zones → executors)
→ emits **OSC command strings** as `{ topic:"/cmd", payload:"..." }`
→ **OSC encoder node** (e.g. `node-red-contrib-osc` “osc” node)
→ **UDP Out node(s)** to MA (Primary + Backup)

There is **no HTTP API** and no external MA module that “receives commands” in the same way Watchout does. The MA “module” here is essentially the **Function node contract** + wiring to OSC/UDP nodes.

---

## 1) Where config lives

### Zone → Executor mapping
The MA Control function resolves zone IDs using:

- `node-red/config/ma-config.json` → `zoneExecutor`

Example (typical):
- `a1 → 1.101`
- `a2 → 1.102`
- `a3 → 1.103`
- `ls → 1.104`

### MA network targets (IP/port)
MA targets **do not** live in JavaScript/config for this approach.

They live in the Node-RED flow as **UDP Out** node configuration (Primary/Backup), typically port `8000`.

---

## 2) Input message contract (what the MA Control function expects)

The MA control Function node expects a **single input** message where:

- `msg.payload.action` is required
- other fields depend on the action

### 2.1 `action: "setOwner"`
Claims or clears the ownership gate.

**Payload:**
```json
{
  "action": "setOwner",
  "owner": "nodered"
}
```

**Allowed owner values (convention):**
- `"nodered"` — Node-RED UI/manual control is authoritative
- `"watchout"` — Watchout-driven cues are authoritative
- `null` — **open gate** (no restriction; both are allowed)

**Meaning:**
- When `owner` is **null**, MA commands are allowed regardless of which source is calling.
- When `owner` is non-null, some actions may be blocked depending on the policy (see §3).

**Inject examples (copy/paste):**
```json
{ "action": "setOwner", "owner": "nodered" }
```
```json
{ "action": "setOwner", "owner": "watchout" }
```
```json
{ "action": "setOwner", "owner": null }
```

---

### 2.2 `action: "goExecutorCue"`
Triggers a cue on one or more **executors** derived from **zones**.

**Payload:**
```json
{
  "action": "goExecutorCue",
  "zones": ["a1", "ls"],
  "cue": 5
}
```

**Fields:**
- `zones` (string[]) — zone IDs (e.g. `["a1","a2","a3","ls"]`)
- `cue` (number|string) — cue number

**Behavior:**
- The function resolves each `zone` to an executor number using `zoneExecutor`
- It emits **one MA /cmd message per zone**

**Resulting MA command strings (examples):**
- `Go+ Executor 1.101 Cue 5`
- `Go+ Executor 1.104 Cue 5`

---

### 2.3 `action: "goSequenceCue"`
Triggers a cue on a **sequence**.

**Payload:**
```json
{
  "action": "goSequenceCue",
  "sequence": 2,
  "cue": 1
}
```

**Fields:**
- `sequence` (number|string)
- `cue` (number|string)

**Resulting MA command string (example):**
- `Go+ Sequence 2 Cue 1`

---

## 3) Owner-gate policy (blocking rules)

The integration uses a global owner-gate (commonly `global.ma_owner`) to prevent two control sources from fighting.

**Recommended policy (as used in this project’s design):**
- `owner === null` → open gate → allow both executor cues and sequence cues
- `owner === "nodered"` → allow **goExecutorCue**, block **goSequenceCue**
- `owner === "watchout"` → allow **goSequenceCue**, block **goExecutorCue**

When blocked, the MA Control function should emit a status/debug message indicating:
- attempted action
- required owner
- current owner

(Exact status message shape depends on the specific function node implementation in your flow.)

---

## 4) Output message contract (what MA Control emits)

The MA Control function emits messages intended for the OSC encoder node.

### 4.1 OSC command output (to OSC node)
Each command message typically looks like:

```json
{
  "topic": "/cmd",
  "payload": "Go+ Executor 1.101 Cue 5"
}
```

or

```json
{
  "topic": "/cmd",
  "payload": "Go+ Sequence 2 Cue 1"
}
```

### 4.2 How the OSC node encodes it
The OSC encoder node should produce an OSC message:

- OSC address: `/cmd`
- OSC type tags: `,s`
- OSC string argument: the MA command string (e.g. `"Go+ Executor 1.101 Cue 5"`)

### 4.3 UDP delivery
The encoded OSC packet is then sent by UDP Out node(s) to:
- MA Primary (IP:port configured in UDP Out)
- MA Backup (IP:port configured in UDP Out)

---

## 5) Comparison to Watchout command structure

The Watchout integration (see `docs/watchout-http-integration.md`) is an **HTTP API** driven contract:

Example:
```json
{ "command": "start", "contentId": "show_1" }
```

- Watchout: semantic command → Node-RED builds an HTTP request → Watchout REST endpoint
- MA: semantic command → Node-RED builds a **console command string** → OSC `/cmd` → UDP

Both use “semantic JSON payloads”, but:
- Watchout’s transport is **HTTP**
- MA’s transport is **OSC over UDP**
- Watchout commands target timelines/inputs by ID/key
- MA commands target executors/sequences by number and cue

---

## 6) Troubleshooting checklist

- If nothing reaches MA:
  1) Confirm the MA Control function is emitting `{topic:"/cmd", payload:"..."}` messages.
  2) Confirm the OSC node is configured to encode `/cmd` with a string argument.
  3) Confirm UDP Out nodes point to the correct MA IP(s) and port (commonly `8000`).
  4) Confirm `global.ma_owner` is not blocking your action (try setting owner to `null`).

- If only some zones work:
  - Confirm `zoneExecutor` mapping in `node-red/config/ma-config.json` includes all zones you’re sending.
