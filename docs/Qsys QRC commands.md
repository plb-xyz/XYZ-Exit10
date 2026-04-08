# QRC Commands (Q-SYS External Control API)

> Source: Q-SYS Help — **QRC Commands**.

## Overview

QRC is a Unicode-based TCP/IP control protocol. The client connects to the Q-SYS Core (or emulator) on port **1710** and sends **JSON-RPC 2.0** commands **terminated by a null** character. The `id` field is a numeric identifier echoed in responses to match requests. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

**Response shape (general):**
- `jsonrpc`: `"2.0"`
- `id`: the request id
- `result` (on success) or `error` (on failure) ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

---

## Connection Methods

### `Logon`
Logs on to the system.

**Params**
- `User`
- `Password` ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

### `NoOp`
“Do nothing” keepalive to keep the socket open. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

---

## Status Methods

### `EngineStatus`
Auto-sent on connect or status changes.  
**Params**
- `State`: `"Idle" | "Active" | "Standby"`
- `DesignName`
- `DesignCode`
- `IsRedundant`
- `IsEmulator` ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

### `StatusGet`
Manually request current status; returns an `EngineStatus`-like object. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

---

## Control Methods (Named Controls)

### `Control.Get`
Get one or more Named Controls.

### `Control.Set`
Set a single Named Control.  
**Params**: `Name`, `Value`, optional `Ramp`. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

---

## Component Control Methods (Named Components)

### `Component.Get`
Get one or more control values within a named component. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

### `Component.GetControls`
Returns a full table of controls for a named component (name, type, value, min/max, direction, etc.). ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

### `Component.Set`
Set one or more controls for a named component; can optionally return new values. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

---

## Change Group Methods

> Max of **4** change groups. No limit on controls per group. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

- `ChangeGroup.AddControl`
- `ChangeGroup.AddComponentControl`
- `ChangeGroup.Remove`
- `ChangeGroup.Poll`
- `ChangeGroup.Destroy`
- `ChangeGroup.Invalidate`
- `ChangeGroup.Clear`
- `ChangeGroup.AutoPoll`

**AutoPoll response** returns `{ Id, Changes: [...] }`. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

---

## Mixer Control Methods

Mixer uses **string selectors** for input/output selection: ranges, lists, `*` for all, and `!` for exclusion. ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

Key mixer methods:
- `Mixer.SetCrossPointGain`
- `Mixer.SetCrossPointDelay`
- `Mixer.SetInputGain`
- `Mixer.SetInputMute`
- `Mixer.SetInputSolo`
- `Mixer.SetOutputGain`
- `Mixer.SetOutputMute`
- `Mixer.SetCueMute`
- `Mixer.SetCueGain` ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))

---

# Examples — QRC Connection & Keepalive (Node.js)

```js
import net from "net";

const HOST = "192.168.1.50";
const PORT = 1710;

let idCounter = 1;

const socket = net.createConnection({ host: HOST, port: PORT }, () => {
  console.log("Connected to Q-SYS QRC");

  // Logon
  sendQrc({
    jsonrpc: "2.0",
    method: "Logon",
    params: { User: "username", Password: "1234" },
    id: nextId(),
  });

  // Keepalive every 30s
  setInterval(() => {
    sendQrc({
      jsonrpc: "2.0",
      method: "NoOp",
      params: {},
      id: nextId(),
    });
  }, 30000);
});

socket.on("data", (data) => {
  // QRC messages are null-terminated JSON
  const chunks = data.toString("utf8").split("\0").filter(Boolean);
  for (const chunk of chunks) {
    try {
      const msg = JSON.parse(chunk);
      console.log("QRC RX:", msg);
    } catch (e) {
      console.warn("Bad JSON:", chunk);
    }
  }
});

socket.on("close", () => console.log("Disconnected"));
socket.on("error", (err) => console.error("Socket error:", err));

function sendQrc(obj) {
  const payload = JSON.stringify(obj) + "\0"; // null terminator required
  socket.write(payload);
}

function nextId() {
  return idCounter++;
}
```

---

# Examples — Mixer.SetInputGain / Mixer.SetInputMute

```json
{
  "jsonrpc": "2.0",
  "method": "Mixer.SetInputGain",
  "params": {
    "Name": "Parade",
    "Inputs": "1-3",
    "Value": -6.0,
    "Ramp": 0.5
  },
  "id": 1001
}
```

```json
{
  "jsonrpc": "2.0",
  "method": "Mixer.SetInputMute",
  "params": {
    "Name": "Parade",
    "Inputs": "4-6",
    "Value": true,
    "Ramp": 0.0
  },
  "id": 1002
}
```

---

# Example — Receive Meter Data (Change Groups)

## 1) Discover meter control names
```json
{
  "jsonrpc": "2.0",
  "id": 2001,
  "method": "Component.GetControls",
  "params": {
    "Name": "My Meter"
  }
}
```

## 2) Add meter controls to a Change Group
```json
{
  "jsonrpc": "2.0",
  "id": 2002,
  "method": "ChangeGroup.AddComponentControl",
  "params": {
    "Id": "meter-group-1",
    "Component": {
      "Name": "My Meter",
      "Controls": [
        { "Name": "CONTROL_NAME_FROM_GETCONTROLS_1" },
        { "Name": "CONTROL_NAME_FROM_GETCONTROLS_2" }
      ]
    }
  }
}
```

## 3) Enable AutoPoll for meter updates
```json
{
  "jsonrpc": "2.0",
  "id": 2003,
  "method": "ChangeGroup.AutoPoll",
  "params": {
    "Id": "meter-group-1",
    "Rate": 0.2
  }
}
```

## 4) Example AutoPoll response (meter values in `Changes`)
```json
{
  "jsonrpc": "2.0",
  "id": 2003,
  "result": {
    "Id": "meter-group-1",
    "Changes": [
      {
        "Component": "My Meter",
        "Name": "CONTROL_NAME_FROM_GETCONTROLS_1",
        "Value": -12.4,
        "String": "-12.4dB"
      }
    ]
  }
}
```

---

## Error Code Reference (JSON-RPC)

Standard JSON-RPC errors:
- `-32700` Parse error  
- `-32600` Invalid request  
- `-32601` Method not found  
- `-32602` Invalid params  
- `-32603` Server error  
- `-32604` Core on Standby (not active in redundant config) ([q-syshelp.qsc.com](https://q-syshelp.qsc.com/Content/External_Control_APIs/QRC/QRC_Commands.htm))
