// Store cue result for the current timeline, then advance the loop.
// Output 1: next fetch request → HTTP node (loop)
// Output 2: all timelines processed → final file write

const timelineKey = msg._fetchTimelineKey;
const statusCode  = msg.statusCode || 200;

const mapping = flow.get('watchout_mapping') || {};
const cfg     = flow.get('watchout_config') || {};
const baseUrl = 'http://' + (cfg.host || 'localhost') + ':' + (cfg.port || 3019);

// Normalize cue name → cueKey (same rules as timeline names)
function normalizeName(name) {
    if (!name || String(name).startsWith('_')) return null;
    const key = String(name).trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
    return key || null;
}

if (timelineKey && statusCode < 300) {
    const cueList = Array.isArray(msg.payload) ? msg.payload : [];
    const cues = {};
    cueList.forEach(c => {
        const cueKey = normalizeName(c.name);
        if (!cueKey) return; // skip cues with null or invalid names
        cues[cueKey] = {
            displayName: c.name,
            watchoutCueId: String(c.id)
        };
    });
    if (mapping[timelineKey]) {
        mapping[timelineKey].cues = cues;
    }
    flow.set('watchout_mapping', mapping);
}

// Advance queue
const queue = flow.get('watchout_cue_queue') || [];
let idx = (flow.get('watchout_cue_index') || 0) + 1;
flow.set('watchout_cue_index', idx);

if (idx < queue.length) {
    // More timelines to fetch
    const next = queue[idx];
    msg.method = 'GET';
    msg.url = baseUrl + '/v0/cues/' + encodeURIComponent(next.watchoutTimelineId);
    msg._fetchTimelineKey = next.timelineKey;
    msg.payload = null;
    return [msg, null]; // loop back to HTTP node
}

// All done — write final mapping with cues
msg.filename = cfg.mappingFile || '/projects/XYZ-Exit10/node-red/data/timeline-mapping.json';
msg.payload  = JSON.stringify(mapping, null, 2);
msg._savedAt = new Date().toISOString();
return [null, msg]; // to file write