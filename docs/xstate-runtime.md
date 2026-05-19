# XState Runtime Setup (Node-RED)

## Purpose

This document defines how XState is loaded and used by the orchestration state machine files:

- `src/Orchestration/xstate State Machine.initialize.js`
- `src/Orchestration/xstate State Machine.js`

The runtime is strict: Function nodes expect XState to be available in Node-RED global function context.

## Dependency

Install and pin XState in project dependencies:

```json
"xstate": "^5.31.1"
```

Install in the project root:

```bash
npm install
```

## Node-RED Runtime Loading

Expose XState in `settings.js`:

```js
functionGlobalContext: {
  xstate: require('xstate')
}
```

Without this, the initialize function will fail fast and show:

- node status: `xstate missing in runtime`
- error: `XState runtime not available...`

## Deploy / Restart Procedure

1. Install dependencies: `npm install`
2. Confirm `settings.js` includes `functionGlobalContext.xstate`
3. Restart Node-RED runtime
4. Deploy flows
5. Verify state machine initialize node status and logs

## Strict Event Schema

The runtime input node accepts only:

1. XState-native event object

```json
{
  "type": "SHOW_GO",
  "key": "show_1",
  "target": "a2",
  "source": "ui",
  "params": {}
}
```

2. Command envelope (mapped to canonical machine events)

```json
{
  "v": 1,
  "source": "ui",
  "target": "a2",
  "action": "show.go",
  "params": { "key": "show_1" }
}
```

Supported command envelope actions:

- `sys.ready` -> `SYS_READY`
- `normal.enter` -> `NORMAL_ENTER`
- `show.go` -> `SHOW_GO`
- `show.end` -> `SHOW_END`
- `show.stop` -> `SHOW_END`

Unsupported actions are logged and ignored.

## Canonical Machine Events

- `SYS_READY`
- `NORMAL_ENTER`
- `GOTO_IDLE`
- `SHOW_GO`
- `SHOW_END`
- `A1_AUDIO_SPECIAL`, `A1_AUDIO_NONE`, `A1_AUDIO_BGM`
- `A2_AUDIO_SPECIAL`, `A2_AUDIO_NONE`, `A2_AUDIO_BGM` (if added)
- `A3_AUDIO_SPECIAL`, `A3_AUDIO_NONE`, `A3_AUDIO_BGM` (if added)
- `LS_AUDIO_SPECIAL`, `LS_AUDIO_NONE`, `LS_AUDIO_BGM`
- `A1_EVENT_SIMPLE_START`, `A1_EVENT_SIMPLE_END`
- `A1_EVENT_COMPLEX_START`, `A1_EVENT_COMPLEX_END`
- `A2_EVENT_SIMPLE_START`, `A2_EVENT_SIMPLE_END`
- `A2_EVENT_COMPLEX_START`, `A2_EVENT_COMPLEX_END`
- `A3_EVENT_SIMPLE_START`, `A3_EVENT_SIMPLE_END`
- `A3_EVENT_COMPLEX_START`, `A3_EVENT_COMPLEX_END`
- `A1_ONTOP_START`, `A1_ONTOP_END`, `A1_FULLSCREEN_START`, `A1_FULLSCREEN_END`
- `A2_ONTOP_START`, `A2_ONTOP_END`, `A2_FULLSCREEN_START`, `A2_FULLSCREEN_END`
- `A3_ONTOP_START`, `A3_ONTOP_END`, `A3_FULLSCREEN_START`, `A3_FULLSCREEN_END`

## Operations Notes

- The initialize node stops any previously stored actor before creating a new one.
- Current show key is stored in flow context as `xstate_active_show_key` when `SHOW_GO` is processed.
- Entry/exit actions emit strict command envelopes (`show.go`, `show.end`) on output 2.
