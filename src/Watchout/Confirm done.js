// Confirm & Save completed: mapping (with cues) has been persisted.
const mapping = flow.get('watchout_mapping') || {};
const count = Object.keys(mapping).length;
node.status({ fill: 'green', shape: 'dot', text: 'Saved: ' + count + ' timelines (with cues)' });
node.send({
    payload: {
        status:  'saved',
        mapping: mapping,
        savedAt: msg._savedAt || new Date().toISOString()
    },
    topic: 'watchout/confirm'
});
return null;