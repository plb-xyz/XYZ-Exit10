// Prepare mapping JSON for initial file write (without cues).
// Cues will be fetched and added to the mapping in a subsequent step.
const pending = flow.get('watchout_pending');
if (!pending) {
    node.send({ payload: { status: 'nothing_pending' }, topic: 'watchout/confirm' });
    return null;
}

flow.set('watchout_mapping', pending);
flow.set('watchout_pending', null);

const cfg = flow.get('watchout_config') || {};

msg.filename = cfg.mappingFile || '/projects/XYZ-Exit10/node-red/data/timeline-mapping.json';
msg.payload  = JSON.stringify(pending, null, 2);
return msg;