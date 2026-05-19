// After initial mapping write: start sequential cue fetch for all timelines.
// Output 1: first cue fetch request → HTTP node
// Output 2: no timelines / skip → final file write

const mapping = flow.get('watchout_mapping') || {};
const cfg = flow.get('watchout_config') || {};
const baseUrl = 'http://' + (cfg.host || 'localhost') + ':' + (cfg.port || 3019);

const queue = Object.keys(mapping)
    .filter(key => mapping[key] && mapping[key].watchoutTimelineId)
    .map(key => ({ timelineKey: key, watchoutTimelineId: mapping[key].watchoutTimelineId }));

flow.set('watchout_cue_queue', queue);
flow.set('watchout_cue_index', 0);

if (queue.length === 0) {
    // No timelines to fetch cues for — write current mapping as-is
    msg.filename = cfg.mappingFile || '/projects/XYZ-Exit10/node-red/data/timeline-mapping.json';
    msg.payload = JSON.stringify(mapping, null, 2);
    msg._savedAt = new Date().toISOString();
    return [null, msg];
}

const first = queue[0];
msg.method = 'GET';
msg.url = baseUrl + '/v0/cues/' + encodeURIComponent(first.watchoutTimelineId);
msg._fetchTimelineKey = first.timelineKey;
msg.payload = null;
return [msg, null];