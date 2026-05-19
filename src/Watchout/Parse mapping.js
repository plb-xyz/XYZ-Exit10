// Parse timeline-mapping.json (flat format: { timelineKey: { displayName, watchoutTimelineId, cues? } })
let mapping = {};
try {
    const raw = JSON.parse(msg.payload);
    mapping = raw || {};
} catch(e) {
    node.warn('[Watchout] timeline-mapping.json parse error, starting empty: ' + e.message);
}
flow.set('watchout_mapping', mapping);
flow.set('watchout_pending', null);
const count = Object.keys(mapping).length;
node.status({ fill: 'green', shape: 'dot', text: 'Mapping loaded: ' + count + ' timelines' });
return null;