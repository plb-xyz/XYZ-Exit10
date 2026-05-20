'use strict';
var mapping = global.get('ma_cue_mapping') || { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} };
var data    = msg.payload || {};
var space   = data.space || msg.space;
var labelId = data.labelId;

// Support external trigger: { space, label } — normalize label to labelId
if (!labelId) {
    var rawLabel = data.label || msg.label;
    if (!rawLabel) {
        node.warn('[MA Cue Mapper] Fire: no labelId or label provided');
        return null;
    }
    // Normalize labelId (trim/lowercase/underscore/strip)
    labelId = rawLabel.trim().toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}

if (!['a1','a2','a3','ls','cmd','mx'].includes(space)) {
    node.warn('[MA Cue Mapper] Fire: invalid space: ' + space);
    return null;
}

var entry = (mapping[space] || {})[labelId];
if (!entry) {
    node.warn('[MA Cue Mapper] Fire: not found: ' + space + '/' + labelId);
    msg.topic   = 'ma/cue-map/error';
    msg.payload = { error: 'Not found: "' + labelId + '" in ' + space };
    return [null, msg];
}

var cuePayload;
var info;

if (entry.type === 'sequenceCue') {
    cuePayload = { action: 'goSequenceCue', sequence: entry.sequence, cue: entry.cue };
    info = 'Go+ Sequence ' + entry.sequence + ' Cue ' + entry.cue;
} else if (entry.type === 'executorCue') {
    cuePayload = { action: 'goExecutorCue', zones: [entry.executor], cue: entry.cue };
    info = 'Go+ Page (executor) ' + entry.executor + ' Cue ' + entry.cue;
} else if (entry.type === 'command') {
    cuePayload = { action: 'goCmd', commands: entry.commands };
    info = (entry.commands || []).join(' | ');
} else if (entry.type === 'macro') {
    cuePayload = { action: 'goMacro', macro: entry.macro };
    info = 'Go+ Macro ' + entry.macro;
} else {
    node.warn('[MA Cue Mapper] Fire: unknown type: ' + entry.type);
    return null;
}

node.log('[MA Cue Mapper] Fire: ' + space + '/' + entry.displayName + ' \u2192 ' + info);

return [
    { payload: cuePayload },
    { topic: 'ma/cue-map/fire/ok', payload: { space: space, labelId: labelId, info: info, command: cuePayload } }
];
