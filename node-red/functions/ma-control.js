/**
 * grandMA3 Control — Node-RED Function Node (ma-control.js)
 * v1.0
 *
 * Paste this as the body of a Function node (2 outputs).
 * This node is the single gate + command-builder for all MA actions.
 * It does NOT send UDP — output 1 feeds an OSC encoder node which feeds
 * two UDP Out nodes configured with the MA target IPs and port 8000.
 *
 * ─── Input msg.payload (semantic API) ─────────────────────────────────────
 *
 *   setOwner:
 *     { action: "setOwner", owner: "nodered"|"watchout"|null, setBy?: string }
 *
 *   goExecutorCue:
 *     { action: "goExecutorCue", zones: ["a1"|"a2"|"a3"|"ls"...], cue: number|string }
 *     Requires global.ma_owner === "nodered" (or null/unclaimed).
 *     Emits one /cmd message per zone on output 1.
 *
 *   goSequenceCue:
 *     { action: "goSequenceCue", sequence: number|string, cue: number|string }
 *     Requires global.ma_owner === "watchout" (or null/unclaimed).
 *
 * ─── Global context used ───────────────────────────────────────────────────
 *
 *   global.ma_owner      — "nodered" | "watchout" | null
 *   global.ma_owner_setBy — string (who last set the owner)
 *   global.ma_config     — { zoneExecutor: { a1:"1.101", ... } }
 *                          Loaded by ma-init.js at startup.
 *
 * ─── Output 1 (OSC /cmd messages — pipe to OSC encoder then UDP Out nodes) ─
 *
 *   msg.topic   = "/cmd"
 *   msg.payload = MA command string, e.g. "Go+ Executor 1.101 Cue 5"
 *
 * ─── Output 2 (status / blocked / error) ──────────────────────────────────
 *
 *   Blocked:
 *     msg.topic   = "ma/<action>/blocked"
 *     msg.payload = { action, requiredOwner, currentOwner }
 *
 *   Owner change:
 *     msg.topic   = "ma/owner"
 *     msg.payload = { action, owner, setBy }
 *
 *   Error:
 *     msg.topic   = "ma/error"
 *     msg.payload = { error }
 */

'use strict';

var input = msg.payload || {};
var action = input.action;

var rawOwner = global.get('ma_owner');
var currentOwner = (rawOwner !== undefined) ? rawOwner : null;

var maConfig = global.get('ma_config') || {};

function sendCmd(cmdStr) {
    node.send([{ topic: '/cmd', payload: cmdStr }, null]);
}

function sendStatus(topic, payload) {
    node.send([null, { topic: topic, payload: payload }]);
}

// ─── setOwner ───────────────────────────────────────────────────────────────

if (action === 'setOwner') {
    var newOwner = (input.owner != null && input.owner !== '') ? input.owner : null;
    global.set('ma_owner', newOwner);
    global.set('ma_owner_setBy', input.setBy || 'nodered-ui');
    sendStatus('ma/owner', {
        action:  'setOwner',
        owner:   newOwner,
        setBy:   global.get('ma_owner_setBy')
    });
    return null;
}

// ─── goExecutorCue ──────────────────────────────────────────────────────────

if (action === 'goExecutorCue') {
    if (currentOwner !== null && currentOwner !== 'nodered') {
        sendStatus('ma/goExecutorCue/blocked', {
            action:        action,
            requiredOwner: 'nodered',
            currentOwner:  currentOwner
        });
        return null;
    }

    var zoneExecutor = maConfig.zoneExecutor;
    if (!zoneExecutor) {
        sendStatus('ma/error', { error: 'global.ma_config.zoneExecutor not set — run init first' });
        return null;
    }

    var zones = Array.isArray(input.zones) ? input.zones : [];
    if (zones.length === 0) {
        sendStatus('ma/error', { error: "'zones' must be a non-empty array for goExecutorCue" });
        return null;
    }

    if (input.cue == null) {
        sendStatus('ma/error', { error: "'cue' is required for goExecutorCue" });
        return null;
    }

    var msgs = zones.map(function (zone) {
        var exec = (zoneExecutor[zone] !== undefined) ? String(zoneExecutor[zone]) : String(zone);
        return { topic: '/cmd', payload: 'Go+ Executor ' + exec + ' Cue ' + input.cue };
    });
    node.send([msgs, null]);
    return null;
}

// ─── goSequenceCue ──────────────────────────────────────────────────────────

if (action === 'goSequenceCue') {
    if (currentOwner !== null && currentOwner !== 'watchout') {
        sendStatus('ma/goSequenceCue/blocked', {
            action:        action,
            requiredOwner: 'watchout',
            currentOwner:  currentOwner
        });
        return null;
    }

    if (input.sequence == null) {
        sendStatus('ma/error', { error: "'sequence' is required for goSequenceCue" });
        return null;
    }

    if (input.cue == null) {
        sendStatus('ma/error', { error: "'cue' is required for goSequenceCue" });
        return null;
    }

    sendCmd('Go+ Sequence ' + input.sequence + ' Cue ' + input.cue);
    return null;
}

// ─── Unknown action ─────────────────────────────────────────────────────────

sendStatus('ma/error', { error: "Unknown action: '" + action + "'" });
return null;
