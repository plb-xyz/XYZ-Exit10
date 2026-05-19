'use strict';
var input = msg.payload || {};
var action = input.action;
var maConfig = global.get('ma_config') || {};

function sendCmd(cmdStr) {
    node.send([{ topic: '/cmd', payload: cmdStr }, null]);
}
function sendStatus(topic, payload) {
    node.send([null, { topic: topic, payload: payload }]);
}

if (action === 'setOwner') {
    var newOwner = (input.owner != null && input.owner !== '') ? input.owner : null;
    global.set('ma_owner', newOwner);
    global.set('ma_owner_setBy', input.setBy || 'nodered-ui');
    sendStatus('ma/owner', { action: 'setOwner', owner: newOwner, setBy: global.get('ma_owner_setBy') });
    return null;
}

// --- goExecutorCue (Page/Executor formatting; no config required) ---
if (action === 'goExecutorCue') {
    var zones = Array.isArray(input.zones) ? input.zones : [];
    if (zones.length === 0) {
        sendStatus('ma/error', { error: "'zones' must be a non-empty array for goExecutorCue" });
        return null;
    }
    if (input.cue == null) {
        sendStatus('ma/error', { error: "'cue' is required for goExecutorCue" });
        return null;
    }

    // zoneExecutor OPTIONAL (only used if caller sends 'a1'/'a2'/etc)
    var zoneExecutor = (maConfig && maConfig.zoneExecutor) ? maConfig.zoneExecutor : null;

    function toPageExec(token) {
        var t = String(token);
        if (zoneExecutor && zoneExecutor[t] !== undefined) {
            t = String(zoneExecutor[t]);
        }
        // 'page.executor' format -> Go+ Page X Executor Y
        var m = /^(\d+)\.(\d+)$/.exec(t);
        if (m) return { page: m[1], exec: m[2] };
        // exec-only -> assume page 1
        var m2 = /^(\d+)$/.exec(t);
        if (m2) return { page: '1', exec: m2[1] };
        return { page: null, exec: t };
    }

    var msgs = zones.map(function(zoneOrExec) {
        var pe = toPageExec(zoneOrExec);
        if (!pe.page) {
            return { topic: '/cmd', payload: 'Go+ Executor ' + pe.exec + ' Cue ' + input.cue };
        }
        return { topic: '/cmd', payload: 'Go+ Page ' + pe.page + ' Executor ' + pe.exec + ' Cue ' + input.cue };
    });
    node.send([msgs, null]);
    return null;
}

if (action === 'goSequenceCue') {
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

// --- goCmd: emit one or more raw MA command strings ---
if (action === 'goCmd') {
    var commands = Array.isArray(input.commands) ? input.commands : [String(input.command || '')];
    commands = commands.map(function(c) { return String(c).trim(); }).filter(function(c) { return c.length > 0; });
    if (commands.length === 0) {
        sendStatus('ma/error', { error: "'commands' must be a non-empty array for goCmd" });
        return null;
    }
    var cmdMsgs = commands.map(function(c) { return { topic: '/cmd', payload: c }; });
    node.send([cmdMsgs, null]);
    return null;
}

// --- goMacro: call a grandMA3 macro by number or name ---
if (action === 'goMacro') {
    if (input.macro == null || String(input.macro).trim() === '') {
        sendStatus('ma/error', { error: "'macro' is required for goMacro" });
        return null;
    }
    sendCmd('Go+ Macro ' + input.macro);
    return null;
}

sendStatus('ma/error', { error: "Unknown action: '" + action + "'" });
return null;
