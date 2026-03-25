/**
 * Watchout Timeline Control — Node-RED Function Node
 *
 * Accepts an incoming message with a command and executes it against Watchout.
 *
 * Input msg.payload:
 *   {
 *     command:   'start' | 'stop' | 'pause' | 'setVar' | 'getState',
 *     contentId: string,    // for start / stop / pause  (looked up in mapping)
 *     varName:   string,    // for setVar
 *     varValue:  any,       // for setVar
 *   }
 *
 * Output msg.payload:
 *   {
 *     success:    boolean,
 *     command:    string,
 *     timelineId: string,   // resolved timeline ID (start / stop / pause)
 *     statusCode: number,
 *     body:       any,
 *     error:      string    // only on failure
 *   }
 *
 * Flow context variables used:
 *   flow.get('watchout_config')   — { host, port }
 *   flow.get('watchout_mapping')  — { [contentId]: { displayName, watchoutId } }
 */

'use strict';

const http = require('http');

// ─── Config ────────────────────────────────────────────────────────────────

const cfg = flow.get('watchout_config') || {};
const host = cfg.host || 'localhost';
const port = cfg.port || 3019;
const REQUEST_TIMEOUT_MS = 10000;

// ─── Helpers ───────────────────────────────────────────────────────────────

function httpRequest(method, urlPath, body) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: host,
            port: port,
            path: urlPath,
            method: method,
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
        if (body !== undefined) req.write(JSON.stringify(body));
        req.end();
    });
}

function resolveTimelineId(contentId) {
    const mapping = flow.get('watchout_mapping') || {};
    const entry = mapping[contentId];
    if (!entry) return String(contentId); // assume it is already a raw timeline ID
    return String(entry.watchoutId);
}

// ─── Main ──────────────────────────────────────────────────────────────────

const input = msg.payload || {};
const command = input.command;

async function execute() {
    let timelineId;

    switch (command) {
        case 'start': {
            timelineId = resolveTimelineId(input.contentId);
            const r = await httpRequest('POST', `/v0/timelines/${timelineId}/play`);
            return { success: r.statusCode < 300, command, timelineId, statusCode: r.statusCode, body: r.body };
        }
        case 'stop': {
            timelineId = resolveTimelineId(input.contentId);
            const r = await httpRequest('POST', `/v0/timelines/${timelineId}/stop`);
            return { success: r.statusCode < 300, command, timelineId, statusCode: r.statusCode, body: r.body };
        }
        case 'pause': {
            timelineId = resolveTimelineId(input.contentId);
            const r = await httpRequest('POST', `/v0/timelines/${timelineId}/pause`);
            return { success: r.statusCode < 300, command, timelineId, statusCode: r.statusCode, body: r.body };
        }
        case 'setVar': {
            const r = await httpRequest('PUT', `/v0/vars/${encodeURIComponent(input.varName)}`, { value: input.varValue });
            return { success: r.statusCode < 300, command, statusCode: r.statusCode, body: r.body };
        }
        case 'getState': {
            const r = await httpRequest('GET', '/v0/state');
            return { success: r.statusCode < 300, command, statusCode: r.statusCode, body: r.body };
        }
        default:
            throw new Error(`Unknown command: '${command}'`);
    }
}

execute().then(payload => {
    node.send({ payload, topic: `watchout/${command}` });
}).catch(err => {
    node.send({ payload: { success: false, command, error: err.message }, topic: `watchout/${command}` });
});

return null; // async
