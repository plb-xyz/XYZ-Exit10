/**
 * Watchout Timeline Discovery — Node-RED Function Node
 *
 * Trigger this node by wiring an "inject" or dashboard ui_button node to it.
 * It fetches timelines from Watchout, compares them to the stored mapping,
 * stores the pending diff in flow context, and outputs a message suitable
 * for displaying the diff in a UI template node.
 *
 * Flow context variables used:
 *   flow.get('watchout_config')   — { host, port, storageFile }
 *   flow.get('watchout_mapping')  — { [contentId]: { displayName, watchoutId } }
 *   flow.get('watchout_pending')  — pending new mapping (awaiting confirmation)
 *
 * Output msg.payload:
 *   {
 *     status:     'diff_ready' | 'no_changes' | 'error',
 *     hasChanges: boolean,
 *     diff:       { added: [], removed: [], unchanged: [], changed: [] },
 *     newMapping: { [contentId]: { displayName, watchoutId } },
 *     diffLines:  string[],   // human-readable lines for display
 *     error:      string      // only on status === 'error'
 *   }
 */

'use strict';

const http = require('http');

// ─── Config ────────────────────────────────────────────────────────────────

const cfg = flow.get('watchout_config') || {};
const host = cfg.host || 'localhost';
const port = cfg.port || 3019;
const REQUEST_TIMEOUT_MS = 10000;

// ─── Helpers ───────────────────────────────────────────────────────────────

function httpGet(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port,
            path: path,
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        };
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                try {
                    resolve({ statusCode: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ statusCode: res.statusCode, body: data });
                }
            });
            res.on('error', reject);
        });
        req.on('error', reject);
        req.setTimeout(REQUEST_TIMEOUT_MS, () => req.destroy(new Error('Request timed out')));
        req.end();
    });
}

function parseTimelineName(name) {
    if (!name || name.startsWith('_')) return null;
    return name.trim().toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
}

function compareMapping(oldMap, newMap) {
    const oldKeys = Object.keys(oldMap);
    const newKeys = Object.keys(newMap);
    return {
        removed:   oldKeys.filter(k => !(k in newMap)),
        added:     newKeys.filter(k => !(k in oldMap)),
        unchanged: oldKeys.filter(k => (k in newMap) && oldMap[k].watchoutId === newMap[k].watchoutId),
        changed:   oldKeys.filter(k => (k in newMap) && oldMap[k].watchoutId !== newMap[k].watchoutId),
    };
}

function formatDiff(diff) {
    const lines = [];
    diff.removed.forEach(n   => lines.push(`❌ Removed  : Timeline '${n}' no longer exists`));
    diff.added.forEach(n     => lines.push(`✨ Added    : New timeline '${n}' discovered`));
    diff.changed.forEach(n   => lines.push(`🔄 Changed  : Timeline '${n}' ID has changed`));
    diff.unchanged.forEach(n => lines.push(`✓  Unchanged: '${n}'`));
    return lines;
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function discover() {
    let result;
    try {
        result = await httpGet('/v0/timelines');
    } catch (err) {
        return { status: 'error', error: `Connection failed: ${err.message}` };
    }

    if (result.statusCode !== 200) {
        return { status: 'error', error: `Watchout returned HTTP ${result.statusCode}` };
    }

    const timelines = Array.isArray(result.body) ? result.body : [];

    // Build new mapping
    const newMapping = {};
    timelines.forEach(tl => {
        const contentId = parseTimelineName(tl.name);
        if (contentId) {
            newMapping[contentId] = { displayName: tl.name, watchoutId: String(tl.id) };
        }
    });

    // Compare with stored mapping
    const storedMapping = flow.get('watchout_mapping') || {};
    const diff = compareMapping(storedMapping, newMapping);
    const hasChanges = diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0;

    // Store pending mapping (not saved until confirmed)
    flow.set('watchout_pending', newMapping);

    return {
        status:     hasChanges ? 'diff_ready' : 'no_changes',
        hasChanges,
        diff,
        newMapping,
        diffLines:  formatDiff(diff),
    };
}

// Execute and pass result downstream
discover().then(payload => {
    node.send({ payload, topic: 'watchout/discovery' });
}).catch(err => {
    node.send({ payload: { status: 'error', error: err.message }, topic: 'watchout/discovery' });
});

return null; // async — result sent in promise callback
