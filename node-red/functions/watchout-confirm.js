/**
 * Watchout Discovery Confirm — Node-RED Function Node
 *
 * Wire this node from a dashboard [Confirm & Save] button or HTTP endpoint.
 * It takes the pending mapping stored by the discovery node and persists it
 * to both flow context and the file system.
 *
 * Flow context variables used:
 *   flow.get('watchout_pending')  — the new mapping to confirm
 *   flow.set('watchout_mapping')  — updated with confirmed mapping
 *   flow.get('watchout_config')   — { storageFile } (optional path override)
 *
 * Output msg.payload:
 *   { status: 'saved' | 'nothing_pending' | 'error', mapping: {}, savedAt: string }
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const pending = flow.get('watchout_pending');

if (!pending) {
    node.send({ payload: { status: 'nothing_pending' }, topic: 'watchout/confirm' });
    return null;
}

// Persist to flow context
flow.set('watchout_mapping', pending);
flow.set('watchout_pending', null);

// Persist to file
const cfg         = flow.get('watchout_config') || {};
const storageFile = cfg.storageFile || path.join(__dirname, '../data/timeline-mapping.json');

try {
    const dir = path.dirname(storageFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const data = { mapping: pending, lastSaved: new Date().toISOString() };
    fs.writeFileSync(storageFile, JSON.stringify(data, null, 2));
    node.log('[WatchoutHTTP] Timeline mapping saved to ' + storageFile);
} catch (err) {
    node.warn('[WatchoutHTTP] Could not save mapping to file: ' + err.message);
    node.send({ payload: { status: 'error', error: err.message }, topic: 'watchout/confirm' });
    return null;
}

const savedAt = new Date().toISOString();
node.send({
    payload: { status: 'saved', mapping: pending, savedAt },
    topic:   'watchout/confirm',
});

return null;
