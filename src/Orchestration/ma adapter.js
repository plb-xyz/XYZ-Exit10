// Orchestration → MA adapter
// Input from director/dispatcher:
//   msg.payload = { runId, step, total, action }
// where action looks like:
//   { type:'ma', command:'GoCue', cue:'SHOW_1_START' }          // treated as label/displayName
//   { type:'ma', command:'RunMacro', macro:'SHOW_1_INIT' }      // treated as label/displayName
//
// Output 1: msg.payload = MA Control contract (action: goSequenceCue|goExecutorCue|goCmd|goMacro)
// Output 2: errors/debug

const p = msg.payload || {};
const action = p.action || {};
const cmd = String(action.command || '');

function targetToSpace(target) {
    if (!target) return null;
    if (typeof target === 'string') {
        const s = target.trim().toLowerCase();
        if (!s) return null;
        if (s.includes('.')) return s.split('.')[0];
        return s;
    }
    if (Array.isArray(target)) {
        return targetToSpace(target[0]);
    }
    if (typeof target === 'object') {
        if (typeof target.space === 'string') return targetToSpace(target.space);
        return null;
    }
    return null;
}

function normalizeLabelId(s) {
    // match the labelId normalization rules from the MA mapper doc
    // (trim, lowercase, spaces->_, strip non [a-z0-9_], collapse _, trim _)
    return String(s || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '')
        .replace(/_+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function fail(message, extra = {}) {
    msg.topic = 'ma/adapter/error';
    msg.payload = { error: message, cmd, action, run: msg.run, ...extra };
    return [null, msg];
}

// Only handle MA actions
if (String(action.type || '').toLowerCase() !== 'ma') {
    return fail('Not an MA action (wrong adapter wired?)');
}

const mapping = global.get('ma_cue_mapping');
if (!mapping) {
x/    return fail('global.ma_cue_mapping is missing (MA cue mapper not initialized yet)');
}

// Resolve which mapping space + key to use
let space = targetToSpace(action.target);
let key = null;

if (cmd === 'GoCue') {
    space = space || 'cmd';           // convention: cue-like things in Commands space
    key = action.key || action.labelId || action.cue;
} else if (cmd === 'RunMacro') {
    space = space || 'mx';            // convention: macros in mx space
    key = action.key || action.labelId || action.macro;
} else {
    return fail('Unsupported MA command: ' + cmd);
}

if (!space) return fail('MA action missing space (and no default applied?)');
if (!key) return fail(`MA action missing key (expected labelId or ${cmd === 'GoCue' ? 'cue' : 'macro'})`);

const spaceMap = mapping[space];
if (!spaceMap) {
    return fail(`Unknown MA mapping space '${space}'`, { knownSpaces: Object.keys(mapping) });
}

// Allow key to be either labelId or displayName; normalize to labelId
let labelId = key;
if (!spaceMap[labelId]) {
    labelId = normalizeLabelId(key);
}

const entry = spaceMap[labelId];
if (!entry) {
    return fail(`No MA mapping entry for space='${space}' key='${key}' (labelId tried='${labelId}')`);
}

// Convert mapping entry → MA Control payload contract
let out = null;

if (entry.type === 'sequenceCue') {
    out = { action: 'goSequenceCue', sequence: String(entry.sequence), cue: String(entry.cue) };
} else if (entry.type === 'executorCue') {
    // ma-cue-mapper doc: executor is stored like "1.201" and should become zones:["1.201"] citeturn3search0
    out = { action: 'goExecutorCue', zones: [String(entry.executor)], cue: String(entry.cue) };
} else if (entry.type === 'command') {
    out = { action: 'goCmd', commands: entry.commands };
} else if (entry.type === 'macro') {
    out = { action: 'goMacro', macro: String(entry.macro) };
} else {
    return fail(`Unsupported mapping entry type '${entry.type}'`, { entry });
}

// Emit MA Control command
msg.topic = 'ma/control';
msg.payload = out;

// Keep run metadata for logging/correlation downstream if you want
msg.ma = { resolved: { space, labelId, displayName: entry.displayName, type: entry.type } };

return [msg, null];