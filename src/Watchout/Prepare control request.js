// Validate input and build HTTP request for Watchout control.
// Output 1: valid command  → HTTP Request node
// Output 2: invalid command → error object (wire this to debug / ui toast)
//
// Expected input (msg.payload):
//   Timelines:
//     { command: "start"|"stop"|"pause", timelineKey: "show_1" }
//     { command: "playAll" }
//     { command: "getState" }
//
//   Jump to Time:
//     { command: "jumpToTime", timelineKey: "show_1", milliseconds: 12345, state?: "pause"|"play" }
//
//   Jump to Cue:
//     { command: "jumpToCue", timelineKey: "show_1", cueKey: "shows", state?: "pause"|"play" }
//     Resolves timelineKey → watchoutTimelineId and cueKey → watchoutCueId from mapping.
//
//   Get Timeline Cues:
//     { command: "getCues", timelineKey: "show_1" }
//
//   Inputs (Watchout UI calls these "Variables"; HTTP API calls them "Inputs"):
//     { command: "setVar",  varName: "MyInput", varValue: 0.5 }
//     { command: "setVars", vars: [{key, value, duration?}, ...] }
//
//   Cue Group State (Cue Sets):
//     { command: "getCueGroupStatesById" }
//     { command: "getCueGroupStatesByName" }
//     { command: "setCueGroupVariantById", groupId: "1", variantId: "2" }
//     { command: "setCueGroupVariantByName", groupName: "Group A", variantName: "Variant 1" }
//     { command: "setCueGroupVariantsById", states: { "groupId1": "variantId1", ... } }
//     { command: "setCueGroupVariantsByName", states: { "groupName1": "variantName1", ... } }
//       - Reset all to defaults: { command: "setCueGroupVariantsByName", states: {} }

const cfg = flow.get('watchout_config') || {};
const host = cfg.host || 'localhost';
const port = cfg.port || 3019;
const baseUrl = 'http://' + host + ':' + port;

const input = msg.payload || {};
const command = input.command;

const mapping = flow.get('watchout_mapping') || {};

// Resolve timelineKey → { watchoutTimelineId, displayName }
function resolveTimeline(timelineKey) {
    if (!timelineKey) return { watchoutTimelineId: null, displayName: undefined };
    const entry = mapping[timelineKey];
    if (!entry) return { watchoutTimelineId: null, displayName: undefined };
    const watchoutTimelineId = (entry.watchoutTimelineId !== undefined && entry.watchoutTimelineId !== null)
        ? String(entry.watchoutTimelineId)
        : null;
    const displayName = (entry.displayName !== undefined && entry.displayName !== null)
        ? String(entry.displayName)
        : undefined;
    return { watchoutTimelineId, displayName };
}

// Resolve cueKey → watchoutCueId from mapping[timelineKey].cues
function resolveCue(timelineKey, cueKey) {
    if (!timelineKey || !cueKey) return null;
    const entry = mapping[timelineKey];
    if (!entry || !entry.cues) return null;
    const cueEntry = entry.cues[cueKey];
    if (!cueEntry) return null;
    return (cueEntry.watchoutCueId !== undefined && cueEntry.watchoutCueId !== null)
        ? String(cueEntry.watchoutCueId)
        : null;
}

function badRequest(errorText) {
    const errMsg = {
        statusCode: 400,
        payload: { success: false, error: errorText }
    };
    return [null, errMsg];
}

msg._command = command;
msg.headers = { 'Content-Type': 'application/json' };

switch (command) {
    // --------------------
    // Timelines
    // --------------------
    case 'playAll': {
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/play';
        msg.payload = null;
        return [msg, null];
    }

    case 'start':
    case 'stop':
    case 'pause': {
        const timelineKey = input.timelineKey;
        if (!timelineKey) {
            return badRequest('Missing payload.timelineKey for command: ' + command);
        }
        const resolved = resolveTimeline(timelineKey);
        if (!resolved.watchoutTimelineId) {
            return badRequest('Unable to resolve timelineKey "' + timelineKey + '" — run timeline discovery first');
        }
        msg._timelineKey = timelineKey;
        msg._watchoutTimelineId = resolved.watchoutTimelineId;
        msg._displayName = resolved.displayName;
        msg.method = 'POST';
        const action = (command === 'start') ? 'play' : command;
        msg.url = baseUrl + '/v0/' + action + '/' + encodeURIComponent(resolved.watchoutTimelineId);
        msg.payload = null;
        return [msg, null];
    }

    // --------------------
    // Jump to Time
    // --------------------
    case 'jumpToTime': {
        const timelineKey = input.timelineKey;
        if (!timelineKey) {
            return badRequest('Missing payload.timelineKey for command: jumpToTime');
        }
        if (input.milliseconds === undefined || input.milliseconds === null) {
            return badRequest('Missing payload.milliseconds for command: jumpToTime');
        }
        const resolved = resolveTimeline(timelineKey);
        if (!resolved.watchoutTimelineId) {
            return badRequest('Unable to resolve timelineKey "' + timelineKey + '" — run timeline discovery first');
        }
        msg._timelineKey = timelineKey;
        msg._watchoutTimelineId = resolved.watchoutTimelineId;
        msg._displayName = resolved.displayName;
        let qs = '?time=' + encodeURIComponent(String(input.milliseconds));
        if (input.state !== undefined && input.state !== null && input.state !== '') {
            qs += '&state=' + encodeURIComponent(String(input.state));
        }
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/jump-to-time/' + encodeURIComponent(resolved.watchoutTimelineId) + qs;
        msg.payload = null;
        return [msg, null];
    }

    // --------------------
    // Jump to Cue
    // --------------------
    case 'jumpToCue': {
        const timelineKey = input.timelineKey;
        const cueKey = input.cueKey;
        if (!timelineKey) {
            return badRequest('Missing payload.timelineKey for command: jumpToCue');
        }
        if (!cueKey) {
            return badRequest('Missing payload.cueKey for command: jumpToCue');
        }
        const resolved = resolveTimeline(timelineKey);
        if (!resolved.watchoutTimelineId) {
            return badRequest('Unable to resolve timelineKey "' + timelineKey + '" — run timeline discovery first');
        }
        const watchoutCueId = resolveCue(timelineKey, cueKey);
        if (watchoutCueId === null) {
            return badRequest('Unable to resolve cueKey "' + cueKey + '" on timeline "' + timelineKey + '" — run Confirm & Save to cache cues');
        }
        msg._timelineKey = timelineKey;
        msg._watchoutTimelineId = resolved.watchoutTimelineId;
        msg._displayName = resolved.displayName;
        msg._cueKey = cueKey;
        msg._watchoutCueId = watchoutCueId;
        let qs = '';
        if (input.state !== undefined && input.state !== null && input.state !== '') {
            qs = '?state=' + encodeURIComponent(String(input.state));
        }
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/jump-to-cue/' +
            encodeURIComponent(resolved.watchoutTimelineId) + '/' +
            encodeURIComponent(watchoutCueId) + qs;
        msg.payload = null;
        return [msg, null];
    }

    // --------------------
    // Get Timeline Cues
    // --------------------
    case 'getCues': {
        const timelineKey = input.timelineKey;
        if (!timelineKey) {
            return badRequest('Missing payload.timelineKey for command: getCues');
        }
        const resolved = resolveTimeline(timelineKey);
        if (!resolved.watchoutTimelineId) {
            return badRequest('Unable to resolve timelineKey "' + timelineKey + '" — run timeline discovery first');
        }
        msg._timelineKey = timelineKey;
        msg._watchoutTimelineId = resolved.watchoutTimelineId;
        msg._displayName = resolved.displayName;
        msg.method = 'GET';
        msg.url = baseUrl + '/v0/cues/' + encodeURIComponent(resolved.watchoutTimelineId);
        msg.payload = null;
        return [msg, null];
    }

    // --------------------
    // Inputs (Variables)
    // --------------------
    case 'setVar': {
        if (!input.varName) return badRequest('Missing payload.varName for command: setVar');
        if (input.varValue === undefined) return badRequest('Missing payload.varValue for command: setVar');
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/input/' + encodeURIComponent(String(input.varName)) +
            '?value=' + encodeURIComponent(String(input.varValue));
        msg.payload = null;
        return [msg, null];
    }

    case 'setVars': {
        if (!Array.isArray(input.vars)) return badRequest('Missing payload.vars array for command: setVars');
        for (let i = 0; i < input.vars.length; i++) {
            const v = input.vars[i];
            if (!v || typeof v !== 'object') return badRequest('setVars: vars[' + i + '] must be an object');
            if (!('key' in v)) return badRequest('setVars: vars[' + i + '] missing "key"');
            if (!('value' in v)) return badRequest('setVars: vars[' + i + '] missing "value"');
        }
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/inputs';
        msg.payload = input.vars;
        return [msg, null];
    }

    case 'getState': {
        msg.method = 'GET';
        msg.url = baseUrl + '/v0/state';
        msg.payload = null;
        return [msg, null];
    }

    // --------------------
    // Cue Sets / Cue Group State
    // --------------------
    case 'getCueGroupStatesById': {
        msg.method = 'GET';
        msg.url = baseUrl + '/v0/cue-group-state/by-id';
        msg.payload = null;
        return [msg, null];
    }

    case 'getCueGroupStatesByName': {
        msg.method = 'GET';
        msg.url = baseUrl + '/v0/cue-group-state/by-name';
        msg.payload = null;
        return [msg, null];
    }

    case 'setCueGroupVariantById': {
        if (input.groupId === undefined || input.groupId === null || input.groupId === '') {
            return badRequest('Missing payload.groupId for command: setCueGroupVariantById');
        }
        if (input.variantId === undefined || input.variantId === null || input.variantId === '') {
            return badRequest('Missing payload.variantId for command: setCueGroupVariantById');
        }
        msg._groupId = String(input.groupId);
        msg._variantId = String(input.variantId);
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/cue-group-state/by-id/' +
            encodeURIComponent(String(input.groupId)) + '/' +
            encodeURIComponent(String(input.variantId));
        msg.payload = null;
        return [msg, null];
    }

    case 'setCueGroupVariantByName': {
        if (!input.groupName) return badRequest('Missing payload.groupName for command: setCueGroupVariantByName');
        if (!input.variantName) return badRequest('Missing payload.variantName for command: setCueGroupVariantByName');
        msg._groupName = String(input.groupName);
        msg._variantName = String(input.variantName);
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/cue-group-state/by-name/' +
            encodeURIComponent(String(input.groupName)) + '/' +
            encodeURIComponent(String(input.variantName));
        msg.payload = null;
        return [msg, null];
    }

    case 'setCueGroupVariantsById': {
        const states = ('states' in input) ? input.states : input.payload;
        if (states === undefined || states === null || typeof states !== 'object' || Array.isArray(states)) {
            return badRequest('Missing payload.states object for command: setCueGroupVariantsById');
        }
        msg._states = states;
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/cue-group-state/by-id';
        msg.payload = states;
        return [msg, null];
    }

    case 'setCueGroupVariantsByName': {
        const states = ('states' in input) ? input.states : input.payload;
        if (states === undefined || states === null || typeof states !== 'object' || Array.isArray(states)) {
            return badRequest('Missing payload.states object for command: setCueGroupVariantsByName');
        }
        msg._states = states;
        msg.method = 'POST';
        msg.url = baseUrl + '/v0/cue-group-state/by-name';
        msg.payload = states;
        return [msg, null];
    }

    default:
        return badRequest('Unknown command: ' + command);
}