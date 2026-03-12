/**
 * @deprecated v0.1 — Use ma-control.js instead.
 *
 * This script (ma-cmd.js) sends UDP directly from JavaScript and reads
 * targets from flow context.  It has been superseded by ma-control.js
 * (Option 1 architecture) where:
 *   - JS outputs plain msg.topic="/cmd" / msg.payload="<MA command>" messages,
 *   - an OSC encoder Function node encodes the binary frame, and
 *   - two UDP Out nodes in the flow own the target IPs / ports.
 *
 * See: node-red/functions/ma-control.js
 *      node-red/functions/ma-init.js
 *      node-red/flows/ma-integration.json
 *
 * ─────────────────────────────────────────────────────────────────────────
 * grandMA3 OSC Command — Node-RED Function Node
 * v0.1 (legacy)
 *
 * Accepts a message, validates the ma.owner gate, builds the MA command
 * string, and broadcasts it as an OSC /cmd,s,<string> UDP datagram to both
 * configured MA targets.
 *
 * Input msg.payload:
 *   {
 *     command: 'goExecutor'    — Go+ on a zone's executor
 *            | 'goExecutorCue' — Go+ on a specific cue of a zone's executor
 *            | 'goSequenceCue' — Go+ on a specific cue of a sequence
 *            | 'offExecutor'   — Off a zone's executor
 *            | 'raw',          — Send a raw MA command string
 *
 *     zone:  'a1' | 'a2' | 'a3' | 'ls',  // for goExecutor / goExecutorCue / offExecutor
 *     cue:   number | string,             // for goExecutorCue / goSequenceCue
 *     seq:   number | string,             // for goSequenceCue
 *     cmd:   string,                      // for 'raw'
 *     owner: string,                      // optional — must match flow.get('ma_owner') if set
 *   }
 *
 * Output msg.payload:
 *   {
 *     success:   boolean,
 *     command:   string,
 *     cmdString: string,   // the MA command string that was sent
 *     sent:      string[], // targets that accepted the UDP datagram
 *     errors:    string[], // targets that failed (partial failure is non-fatal)
 *     error:     string    // only present on complete failure
 *   }
 *
 * Flow context variables used:
 *   flow.get('ma_config')  — { targets: [{host, port}], zoneExecutor: {} }
 *   flow.get('ma_owner')   — string | null  (owner gate; null = ungated)
 */

'use strict';

const dgram = require('dgram');

// ─── Config ────────────────────────────────────────────────────────────────

const cfg = flow.get('ma_config') || {};

const TARGETS = cfg.targets || [];
// NOTE: No hardcoded IP fallback. Targets must be provided in flow context
// 'ma_config.targets'.  In the new Option 1 architecture (ma-control.js)
// UDP targets live entirely in the UDP Out nodes — this file is deprecated.

const ZONE_EXECUTOR = cfg.zoneExecutor || {
    a1: '1.101',
    a2: '1.102',
    a3: '1.103',
    ls: '1.104',
};

// ─── Owner gate ────────────────────────────────────────────────────────────

const currentOwner = flow.get('ma_owner') || null;
const msgOwner = (msg.payload && msg.payload.owner != null)
    ? msg.payload.owner
    : (msg.owner != null ? msg.owner : null);

if (currentOwner !== null && msgOwner !== currentOwner) {
    node.warn(`[MA] Command blocked — caller: '${msgOwner}' current owner: '${currentOwner}'`);
    return null;
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function oscString(str) {
    const len = Buffer.byteLength(str, 'utf8') + 1;
    const padded = Math.ceil(len / 4) * 4;
    const buf = Buffer.alloc(padded, 0);
    buf.write(str, 0, 'utf8');
    return buf;
}

function encodeOscCmd(cmdValue) {
    return Buffer.concat([oscString('/cmd'), oscString(',s'), oscString(cmdValue)]);
}

function resolveExecutor(zone) {
    return ZONE_EXECUTOR[zone] !== undefined ? ZONE_EXECUTOR[zone] : String(zone);
}

function broadcast(cmdString) {
    return new Promise((resolve, reject) => {
        const buf = encodeOscCmd(cmdString);
        const socket = dgram.createSocket('udp4');
        if (socket.unref) socket.unref();

        const sent = [];
        const errors = [];
        let remaining = TARGETS.length;

        if (remaining === 0) {
            socket.close();
            resolve({ cmdString, sent, errors });
            return;
        }

        const finish = () => {
            socket.close(() => {
                if (errors.length === TARGETS.length) {
                    reject(new Error(errors.join('; ')));
                } else {
                    resolve({ cmdString, sent, errors });
                }
            });
        };

        TARGETS.forEach(target => {
            socket.send(buf, 0, buf.length, target.port, target.host, (err) => {
                if (err) {
                    errors.push(`${target.host}:${target.port} – ${err.message}`);
                } else {
                    sent.push(`${target.host}:${target.port}`);
                }
                remaining--;
                if (remaining === 0) finish();
            });
        });
    });
}

// ─── Build MA command string ───────────────────────────────────────────────

const input = msg.payload || {};
const command = input.command;

function buildCmdString() {
    switch (command) {
        case 'goExecutor':
            if (!input.zone) throw new Error("'zone' is required for goExecutor");
            return `Go+ Executor ${resolveExecutor(input.zone)}`;

        case 'goExecutorCue':
            if (!input.zone) throw new Error("'zone' is required for goExecutorCue");
            if (input.cue == null) throw new Error("'cue' is required for goExecutorCue");
            return `Go+ Executor ${resolveExecutor(input.zone)} Cue ${input.cue}`;

        case 'goSequenceCue':
            if (input.seq == null) throw new Error("'seq' is required for goSequenceCue");
            if (input.cue == null) throw new Error("'cue' is required for goSequenceCue");
            return `Go+ Sequence ${input.seq} Cue ${input.cue}`;

        case 'offExecutor':
            if (!input.zone) throw new Error("'zone' is required for offExecutor");
            return `Off Executor ${resolveExecutor(input.zone)}`;

        case 'raw':
            if (!input.cmd) throw new Error("'cmd' is required for raw");
            return String(input.cmd);

        default:
            throw new Error(`Unknown command: '${command}'`);
    }
}

// ─── Main ──────────────────────────────────────────────────────────────────

async function execute() {
    const cmdString = buildCmdString();
    const result = await broadcast(cmdString);
    return { success: true, command, ...result };
}

execute()
    .then(payload => node.send({ payload, topic: `ma/${command}` }))
    .catch(err => node.send({ payload: { success: false, command, error: err.message }, topic: `ma/${command}` }));

return null; // async
