/**
 * grandMA3 OSC Integration Module
 * v0.1 — Show Controller Architecture: grandMA3 integration layer
 *
 * Handles:
 *  - Encoding grandMA3 OSC /cmd,s,<string> messages
 *  - Broadcasting every command to both MA targets over UDP
 *  - Zone → executor mapping  (a1 → 1.101, a2 → 1.102, a3 → 1.103, ls → 1.104)
 *  - Lightweight ma.owner gate to serialise competing flow ownership
 *
 * grandMA3 OSC UDP port: 8000
 *
 * Usage in a Node-RED function node or custom node:
 *
 *   const MaOsc = require('./modules/ma-osc');
 *
 *   const ma = new MaOsc();            // uses built-in defaults
 *   ma.claim('show-flow');             // optional ownership claim
 *
 *   await ma.goExecutor('a1');                    // Go+ Executor 1.101
 *   await ma.goExecutorCue('a2', 5);              // Go+ Executor 1.102 Cue 5
 *   await ma.goSequenceCue(5, 12);                // Go+ Sequence 5 Cue 12
 *   await ma.offExecutor('ls');                   // Off Executor 1.104
 *   await ma.sendCmd('Go+ Executor 1.103 Cue 3'); // raw /cmd string
 */

'use strict';

const dgram = require('dgram');

// ─── Defaults ─────────────────────────────────────────────────────────────────

/**
 * Both MA targets receive every command.
 * @deprecated — Targets are now configured in the UDP Out nodes of the
 * Node-RED flow (Option 1 architecture).  Pass explicit targets to the
 * MaOsc constructor; this default is intentionally left empty so any
 * caller that omits targets gets an obvious "nothing sent" result rather
 * than silently sending to a hardcoded production address.
 */
const DEFAULT_TARGETS = [];

/** Canonical zone IDs → MA executor numbers. */
const DEFAULT_ZONE_EXECUTOR = {
    a1: '1.101',
    a2: '1.102',
    a3: '1.103',
    ls: '1.104',
};

// ─── OSC Encoding ─────────────────────────────────────────────────────────────

/**
 * Encode a string as a null-terminated, 4-byte-padded OSC string buffer.
 * @param {string} str
 * @returns {Buffer}
 */
function oscString(str) {
    const len = Buffer.byteLength(str, 'utf8') + 1; // +1 for null terminator
    const padded = Math.ceil(len / 4) * 4;
    const buf = Buffer.alloc(padded, 0);
    buf.write(str, 0, 'utf8');
    return buf;
}

/**
 * Build an OSC 1.1 message: /cmd ,s <cmdValue>
 * @param {string} cmdValue  The MA command string, e.g. "Go+ Executor 1.101"
 * @returns {Buffer}
 */
function encodeOscCmd(cmdValue) {
    return Buffer.concat([
        oscString('/cmd'),
        oscString(',s'),
        oscString(cmdValue),
    ]);
}

// ─── MaOsc ────────────────────────────────────────────────────────────────────

/**
 * MaOsc — lightweight grandMA3 OSC client.
 */
class MaOsc {
    /**
     * @param {object}  [options]
     * @param {Array<{host: string, port: number}>} [options.targets]       MA UDP endpoints (default: primary + backup)
     * @param {{ [zone: string]: string }}          [options.zoneExecutor]  Zone → executor map
     */
    constructor(options = {}) {
        this.targets = options.targets || DEFAULT_TARGETS;
        this.zoneExecutor = options.zoneExecutor || DEFAULT_ZONE_EXECUTOR;
        this._owner = null;
    }

    // ─── Owner gate ─────────────────────────────────────────────────────────

    /**
     * Attempt to claim exclusive ownership of the MA.
     * Returns true if the claim succeeded (or the caller is already the owner).
     * Returns false if a different owner already holds the gate.
     * Pass owner = null to force a cold reset.
     *
     * @param {string|null} owner  Caller identifier, e.g. a flow name or scene ID
     * @returns {boolean}
     */
    claim(owner) {
        if (this._owner !== null && this._owner !== owner) return false;
        this._owner = owner;
        return true;
    }

    /**
     * Release ownership.  Only the current owner (or a null owner) can release.
     * @param {string|null} owner
     */
    release(owner) {
        if (this._owner === null || this._owner === owner) {
            this._owner = null;
        }
    }

    /** @returns {string|null} Current owner identifier, or null if unclaimed. */
    get owner() {
        return this._owner;
    }

    /**
     * Returns true if the gate is open for this caller.
     * The gate is open when the MA is unclaimed OR the caller is the owner.
     * @param {string|null} caller
     * @returns {boolean}
     */
    isOwner(caller) {
        return this._owner === null || this._owner === caller;
    }

    // ─── Zone helpers ────────────────────────────────────────────────────────

    /**
     * Resolve a zone ID to its MA executor number.
     * Falls through to the raw value if the zone is not in the map.
     * @param {string} zone  e.g. 'a1', 'a2', 'a3', 'ls'
     * @returns {string}     e.g. '1.101'
     */
    resolveExecutor(zone) {
        return this.zoneExecutor[zone] !== undefined
            ? this.zoneExecutor[zone]
            : String(zone);
    }

    // ─── Semantic commands ───────────────────────────────────────────────────

    /**
     * Go+ on a zone's executor (advance to next cue / trigger default).
     * Sends: Go+ Executor <executor>
     * @param {string} zone
     * @returns {Promise<{cmdString: string, sent: string[], errors: string[]}>}
     */
    goExecutor(zone) {
        return this.sendCmd(`Go+ Executor ${this.resolveExecutor(zone)}`);
    }

    /**
     * Go+ on a specific cue of a zone's executor.
     * Sends: Go+ Executor <executor> Cue <cue>
     * @param {string}        zone
     * @param {number|string} cue
     * @returns {Promise<{cmdString: string, sent: string[], errors: string[]}>}
     */
    goExecutorCue(zone, cue) {
        return this.sendCmd(
            `Go+ Executor ${this.resolveExecutor(zone)} Cue ${cue}`
        );
    }

    /**
     * Go+ on a specific cue of a sequence.
     * Sends: Go+ Sequence <sequenceId> Cue <cue>
     * @param {number|string} sequenceId
     * @param {number|string} cue
     * @returns {Promise<{cmdString: string, sent: string[], errors: string[]}>}
     */
    goSequenceCue(sequenceId, cue) {
        return this.sendCmd(`Go+ Sequence ${sequenceId} Cue ${cue}`);
    }

    /**
     * Send an Off command for a zone's executor.
     * Sends: Off Executor <executor>
     * @param {string} zone
     * @returns {Promise<{cmdString: string, sent: string[], errors: string[]}>}
     */
    offExecutor(zone) {
        return this.sendCmd(`Off Executor ${this.resolveExecutor(zone)}`);
    }

    /**
     * Send a raw MA /cmd string to all targets.
     * @param {string} cmdString  e.g. "Go+ Executor 1.101 Cue 3"
     * @returns {Promise<{cmdString: string, sent: string[], errors: string[]}>}
     */
    sendCmd(cmdString) {
        const buf = encodeOscCmd(cmdString);
        return this._broadcast(cmdString, buf);
    }

    // ─── Transport ───────────────────────────────────────────────────────────

    /**
     * Broadcast an OSC buffer to all configured targets.
     * Resolves once every send attempt has completed (even on partial failure).
     * Rejects only if every target fails.
     *
     * @param {string} cmdString  Original command string (included in result)
     * @param {Buffer} buf        Encoded OSC message
     * @returns {Promise<{cmdString: string, sent: string[], errors: string[]}>}
     */
    _broadcast(cmdString, buf) {
        return new Promise((resolve, reject) => {
            const socket = dgram.createSocket('udp4');
            if (socket.unref) socket.unref(); // don't keep the event loop alive

            const sent = [];
            const errors = [];
            let remaining = this.targets.length;

            if (remaining === 0) {
                socket.close();
                resolve({ cmdString, sent, errors });
                return;
            }

            const finish = () => {
                socket.close(() => {
                    if (errors.length === this.targets.length) {
                        reject(new Error(errors.join('; ')));
                    } else {
                        resolve({ cmdString, sent, errors });
                    }
                });
            };

            this.targets.forEach(target => {
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
}

module.exports = MaOsc;
module.exports.encodeOscCmd = encodeOscCmd;
module.exports.oscString = oscString;
module.exports.DEFAULT_TARGETS = DEFAULT_TARGETS;
module.exports.DEFAULT_ZONE_EXECUTOR = DEFAULT_ZONE_EXECUTOR;
