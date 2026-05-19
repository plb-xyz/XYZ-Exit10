// Parse GET /v0/timelines response and build diff

if (msg.statusCode !== 200) {
    msg.payload = { status: 'error', error: 'Watchout returned HTTP ' + (msg.statusCode || 'unknown') };
    return msg;
}

function parseTimelineName(name) {
    if (!name || name.startsWith('_')) return null;
    return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function compareMapping(oldMap, newMap) {
    const oldKeys = Object.keys(oldMap);
    const newKeys = Object.keys(newMap);
    return {
        removed: oldKeys.filter(k => !(k in newMap)),
        added: newKeys.filter(k => !(k in oldMap)),
        unchanged: oldKeys.filter(k => (k in newMap) && String(oldMap[k]?.watchoutTimelineId) === String(newMap[k]?.watchoutTimelineId)),
        changed: oldKeys.filter(k => (k in newMap) && String(oldMap[k]?.watchoutTimelineId) !== String(newMap[k]?.watchoutTimelineId)),
    };
}

function formatDiff(diff) {
    const lines = [];
    diff.removed.forEach(n => lines.push("REMOVED  : Timeline '" + n + "' no longer exists"));
    diff.added.forEach(n => lines.push("ADDED    : New timeline '" + n + "' discovered"));
    diff.changed.forEach(n => lines.push("CHANGED  : Timeline '" + n + "' ID has changed"));
    diff.unchanged.forEach(n => lines.push("OK       : '" + n + "'"));
    return lines;
}

const timelines = Array.isArray(msg.payload) ? msg.payload : [];

const newMapping = {};
timelines.forEach(tl => {
    const timelineKey = parseTimelineName(tl.name);
    if (!timelineKey) return;

    newMapping[timelineKey] = {
        displayName: tl.name,
        watchoutTimelineId: String(tl.id)
    };
});

const storedMapping = flow.get('watchout_mapping') || {};
const diff = compareMapping(storedMapping, newMapping);
const diffLines = formatDiff(diff);

flow.set('watchout_pending', newMapping);

const count = Object.keys(newMapping).length;
node.status({ fill: 'green', shape: 'dot', text: 'Discovered: ' + count + ' timelines' });

msg.payload = { status: 'discovered', count, diffLines, newMapping, diff };
return msg;