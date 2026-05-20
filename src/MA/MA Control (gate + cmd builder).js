'use strict';
var input = msg.payload || {};
var action = input.action;

function sendCmd(cmdStr) {
    node.send([{ topic: '/cmd', payload: cmdStr }, null]);
}
function sendStatus(topic, payload) {
    node.send([null, { topic: topic, payload: payload }]);
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