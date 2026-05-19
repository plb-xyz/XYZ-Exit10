'use strict';
var mapping = flow.get('ma_cue_mapping') || { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} };
var data    = msg.payload || {};
var space   = data.space;
var entry   = data.entry || {};
var oldId   = data.editingLabelId || null;

if (!entry.displayName || !entry.displayName.trim()) {
    node.warn('[MA Cue Mapper] Save: displayName required');
    return null;
}
if (!['a1','a2','a3','ls','cmd','mx'].includes(space)) {
    node.warn('[MA Cue Mapper] Save: invalid space: ' + space);
    return null;
}

// Normalize labelId (trim/lowercase/underscore/strip)
var labelId = entry.displayName.trim().toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '');

if (!labelId) {
    node.warn('[MA Cue Mapper] Save: cannot normalize label: ' + entry.displayName);
    return null;
}

if (!mapping[space]) mapping[space] = {};

// If editing and labelId changed, remove old entry
if (oldId && oldId !== labelId) {
    delete mapping[space][oldId];
}

var record = {
    displayName: entry.displayName.trim(),
    type: entry.type,
    notes: entry.notes || ''
};

// Enforce type/space compatibility
var cueSpaces = ['a1','a2','a3','ls'];
if (cueSpaces.includes(space) && (entry.type === 'command' || entry.type === 'macro')) {
    node.warn('[MA Cue Mapper] Save: type ' + entry.type + ' is not allowed in space ' + space);
    return null;
}
if (space === 'cmd' && entry.type !== 'command') {
    node.warn('[MA Cue Mapper] Save: only command type allowed in cmd space');
    return null;
}
if (space === 'mx' && entry.type !== 'macro') {
    node.warn('[MA Cue Mapper] Save: only macro type allowed in mx space');
    return null;
}

if (entry.type === 'sequenceCue') {
    if (!entry.sequence) { node.warn('[MA Cue Mapper] Save: sequence required for sequenceCue'); return null; }
    if (!entry.cue)      { node.warn('[MA Cue Mapper] Save: cue required for sequenceCue');      return null; }
    record.sequence = String(entry.sequence);
    record.cue      = String(entry.cue);
} else if (entry.type === 'executorCue') {
    if (!entry.executor) { node.warn('[MA Cue Mapper] Save: executor required for executorCue'); return null; }
    if (!entry.cue)      { node.warn('[MA Cue Mapper] Save: cue required for executorCue');      return null; }
    record.executor = String(entry.executor);
    record.cue      = String(entry.cue);
} else if (entry.type === 'command') {
    // Accept commands as array (from UI) or as newline-separated string (commandsText)
    var rawCmds = Array.isArray(entry.commands)
        ? entry.commands
        : String(entry.commandsText || entry.commands || '').split('\n');
    var cmds = rawCmds.map(function(c) { return String(c).trim(); }).filter(function(c) { return c.length > 0; });
    if (cmds.length === 0) {
        node.warn('[MA Cue Mapper] Save: at least one command required for command type');
        return null;
    }
    record.commands = cmds;
} else if (entry.type === 'macro') {
    var macroVal = entry.macro;
    if (macroVal == null || String(macroVal).trim() === '') {
        node.warn('[MA Cue Mapper] Save: macro number/name required for macro type');
        return null;
    }
    record.macro = String(macroVal).trim();
} else {
    node.warn('[MA Cue Mapper] Save: invalid type: ' + entry.type);
    return null;
}

mapping[space][labelId] = record;
flow.set('ma_cue_mapping', mapping);
node.log('[MA Cue Mapper] Saved: ' + space + '/' + labelId);

var cfg = flow.get('ma_cue_cfg') || {};
msg.filename   = cfg.mappingFile || '/data/ma-cue-mapping.json';
msg.payload    = JSON.stringify(mapping, null, 2);
msg.cueMapping = mapping;
return msg;
