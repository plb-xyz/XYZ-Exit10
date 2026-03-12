/**
 * Watchout 7 HTTP Integration Module
 * v0.1 - Show Controller Architecture: Watchout integration layer ONLY
 *
 * Handles:
 *  - Timeline discovery via GET /v0/timelines on startup
 *  - Timeline control (start/stop/pause) via HTTP POST endpoints
 *  - Variable/input setting via POST /v0/input/{key}
 *  - Real-time state monitoring via Server-Sent Events (SSE)
 *  - Status polling fallback via GET /v0/state
 *
 * Watchout 7 HTTP API default port: 3019
 * Reference: https://docs.dataton.com/watchout-7/external_protocol/ext_wo7.html
 */

'use strict';

const http = require('http');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3019;
const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_SSE_RECONNECT_DELAY_MS = 3000;
const SSE_MAX_RECONNECT_DELAY_MS = 30000;

/**
 * WatchoutIntegration
 *
 * Usage in a Node-RED function node or custom node:
 *
 *   const WatchoutIntegration = require('./modules/watchout-integration');
 *
 *   const wo = new WatchoutIntegration({
 *     host: '192.168.1.100',
 *     port: 3019,
 *     onStateChange: (state) => { node.warn(state); },
 *     onTimelinesReady: (mapping) => { context.global.set('woTimelines', mapping); }
 *   });
 *
 *   await wo.initialize();
 */
class WatchoutIntegration {
    /**
     * @param {object} options
     * @param {string}   [options.host='localhost']         Watchout host IP or hostname
     * @param {number}   [options.port=3019]                Watchout HTTP API port
     * @param {number}   [options.pollIntervalMs=5000]      Fallback polling interval (ms)
     * @param {number}   [options.sseReconnectDelayMs=3000] Initial SSE reconnect delay (ms)
     * @param {Function} [options.onStateChange]            Callback when state changes (SSE or poll)
     * @param {Function} [options.onTimelinesReady]         Callback with timeline mapping on startup
     * @param {Function} [options.onError]                  Callback for non-fatal errors
     */
    constructor(options = {}) {
        this.host = options.host || DEFAULT_HOST;
        this.port = options.port || DEFAULT_PORT;
        this.pollIntervalMs = options.pollIntervalMs || DEFAULT_POLL_INTERVAL_MS;
        this.sseReconnectDelayMs = options.sseReconnectDelayMs || DEFAULT_SSE_RECONNECT_DELAY_MS;

        this.onStateChange = options.onStateChange || null;
        this.onTimelinesReady = options.onTimelinesReady || null;
        this.onError = options.onError || null;

        // contentId (timeline name) → timelineId (numeric id from WO)
        this.timelineMapping = {};

        this._sseRequest = null;
        this._sseActive = false;
        this._sseReconnectTimer = null;
        this._sseCurrentDelay = this.sseReconnectDelayMs;

        this._pollTimer = null;
        this._destroyed = false;
    }

    // ─────────────────────────────────────────────
    // Public API
    // ─────────────────────────────────────────────

    /**
     * Initialize the integration:
     *  1. Discover timelines and build mapping
     *  2. Populate Node-RED context via onTimelinesReady callback
     *  3. Start SSE listener for real-time state changes
     *  4. Start polling fallback
     */
    async initialize() {
        this._log('Initializing Watchout 7 HTTP integration');

        try {
            await this._discoverTimelines();
        } catch (err) {
            this._error('Timeline discovery failed on startup: ' + err.message);
            // Non-fatal: proceed without initial mapping; caller can retry
        }

        this._startSSE();
        this._startPolling();

        this._log('Watchout integration ready');
    }

    /**
     * Gracefully shut down SSE connection and polling timers.
     */
    destroy() {
        this._destroyed = true;
        this._stopSSE();
        this._stopPolling();
        this._log('Watchout integration destroyed');
    }

    /**
     * Re-run timeline discovery manually (e.g. after Watchout project reload).
     * Updates timelineMapping and fires onTimelinesReady callback.
     */
    async rediscover() {
        return this._discoverTimelines();
    }

    /**
     * Start (play) a timeline by its timeline ID.
     * @param {number|string} timelineId
     */
    async startTimeline(timelineId) {
        return this._post(`/v0/play/${timelineId}`);
    }

    /**
     * Pause a timeline by its timeline ID.
     * @param {number|string} timelineId
     */
    async pauseTimeline(timelineId) {
        return this._post(`/v0/pause/${timelineId}`);
    }

    /**
     * Stop a timeline by its timeline ID.
     * @param {number|string} timelineId
     */
    async stopTimeline(timelineId) {
        return this._post(`/v0/stop/${timelineId}`);
    }

    /**
     * Resolve a content ID (timeline name) to its Watchout numeric timeline ID.
     * Returns undefined if not found.
     * @param {string} contentId  e.g. "show1"
     * @returns {string|undefined}
     */
    resolveTimelineId(contentId) {
        return this.timelineMapping[contentId];
    }

    /**
     * Set a single input/variable on Watchout.
     * @param {string}        key    Input key, e.g. "A1_CONTENT"
     * @param {string|number} value  Value to set
     * @param {number}        [interpolationTime=0]  Interpolation time in ms (optional)
     */
    async setInput(key, value, interpolationTime) {
        let path = `/v0/input/${encodeURIComponent(key)}?value=${encodeURIComponent(value)}`;
        if (interpolationTime !== undefined) {
            path += `&time=${encodeURIComponent(interpolationTime)}`;
        }
        return this._post(path);
    }

    /**
     * Set multiple inputs/variables at once.
     * @param {Array<{key: string, value: string|number, time?: number}>} inputs
     */
    async setInputs(inputs) {
        return this._post('/v0/inputs', inputs);
    }

    /**
     * Poll the current Watchout state immediately.
     * @returns {Promise<object>} Parsed state object
     */
    async getState() {
        return this._get('/v0/state');
    }

    // ─────────────────────────────────────────────
    // Internal: Timeline Discovery
    // ─────────────────────────────────────────────

    async _discoverTimelines() {
        this._log('Discovering timelines...');
        const timelines = await this._get('/v0/timelines');

        const mapping = {};
        if (Array.isArray(timelines)) {
            timelines.forEach(tl => {
                if (tl && tl.id !== undefined && tl.name) {
                    // Use the timeline name as the contentId key.
                    // Names starting with '_' are Watchout system timelines; include them all.
                    const contentId = tl.name;
                    mapping[contentId] = String(tl.id);
                }
            });
        }

        this.timelineMapping = mapping;
        this._log(`Discovered ${Object.keys(mapping).length} timeline(s): ${Object.keys(mapping).join(', ')}`);

        if (this.onTimelinesReady) {
            this.onTimelinesReady(mapping);
        }

        return mapping;
    }

    // ─────────────────────────────────────────────
    // Internal: SSE (Server-Sent Events)
    // ─────────────────────────────────────────────

    _startSSE() {
        if (this._destroyed) return;
        this._log('Starting SSE listener on /v0/state/changes');
        this._connectSSE();
    }

    _connectSSE() {
        if (this._destroyed) return;

        const options = {
            hostname: this.host,
            port: this.port,
            path: '/v0/state/changes',
            method: 'GET',
            headers: {
                Accept: 'text/event-stream',
                'Cache-Control': 'no-cache',
            },
        };

        const req = http.request(options, (res) => {
            if (res.statusCode !== 200) {
                this._error(`SSE endpoint returned HTTP ${res.statusCode}; will retry`);
                res.resume();
                this._scheduleSSEReconnect();
                return;
            }

            this._sseActive = true;
            this._sseCurrentDelay = this.sseReconnectDelayMs; // reset backoff on success
            this._log('SSE connection established');

            let buffer = '';

            res.setEncoding('utf8');

            res.on('data', (chunk) => {
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop(); // keep incomplete line for next chunk

                let eventData = null;
                for (const line of lines) {
                    const trimmed = line.trimEnd();
                    if (trimmed.startsWith('data:')) {
                        const raw = trimmed.slice(5).trim();
                        try {
                            eventData = JSON.parse(raw);
                        } catch {
                            eventData = raw; // pass raw string if not JSON
                        }
                    } else if (trimmed === '' && eventData !== null) {
                        // Dispatch the event
                        if (this.onStateChange) {
                            this.onStateChange(eventData);
                        }
                        eventData = null;
                    }
                }
            });

            res.on('end', () => {
                this._sseActive = false;
                if (!this._destroyed) {
                    this._log('SSE connection closed by server; reconnecting...');
                    this._scheduleSSEReconnect();
                }
            });

            res.on('error', (err) => {
                this._sseActive = false;
                if (!this._destroyed) {
                    this._error('SSE response error: ' + err.message);
                    this._scheduleSSEReconnect();
                }
            });
        });

        req.on('error', (err) => {
            this._sseActive = false;
            if (!this._destroyed) {
                this._error('SSE request error: ' + err.message);
                this._scheduleSSEReconnect();
            }
        });

        req.end();
        this._sseRequest = req;
    }

    _scheduleSSEReconnect() {
        if (this._destroyed) return;

        const delay = this._sseCurrentDelay;
        this._log(`SSE reconnect in ${delay}ms`);

        this._sseReconnectTimer = setTimeout(() => {
            this._connectSSE();
        }, delay);

        // Exponential backoff capped at max
        this._sseCurrentDelay = Math.min(
            this._sseCurrentDelay * 2,
            SSE_MAX_RECONNECT_DELAY_MS
        );
    }

    _stopSSE() {
        if (this._sseReconnectTimer) {
            clearTimeout(this._sseReconnectTimer);
            this._sseReconnectTimer = null;
        }
        if (this._sseRequest) {
            this._sseRequest.destroy();
            this._sseRequest = null;
        }
        this._sseActive = false;
    }

    // ─────────────────────────────────────────────
    // Internal: Status Polling Fallback
    // ─────────────────────────────────────────────

    _startPolling() {
        this._pollTimer = setInterval(async () => {
            // Only poll if SSE is not active (fallback scenario)
            if (!this._sseActive) {
                try {
                    const state = await this.getState();
                    if (this.onStateChange) {
                        this.onStateChange(state);
                    }
                } catch (err) {
                    this._error('Polling /v0/state failed: ' + err.message);
                }
            }
        }, this.pollIntervalMs);

        if (this._pollTimer.unref) {
            this._pollTimer.unref(); // Don't keep Node.js process alive
        }
    }

    _stopPolling() {
        if (this._pollTimer) {
            clearInterval(this._pollTimer);
            this._pollTimer = null;
        }
    }

    // ─────────────────────────────────────────────
    // Internal: HTTP helpers
    // ─────────────────────────────────────────────

    /**
     * Send HTTP GET and return parsed JSON body.
     * @param {string} path
     * @returns {Promise<any>}
     */
    _get(path) {
        return new Promise((resolve, reject) => {
            const options = {
                hostname: this.host,
                port: this.port,
                path,
                method: 'GET',
                headers: { Accept: 'application/json' },
            };

            const req = http.request(options, (res) => {
                let body = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { body += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(JSON.parse(body));
                        } catch {
                            resolve(body);
                        }
                    } else {
                        reject(new Error(`GET ${path} returned HTTP ${res.statusCode}: ${body}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy(new Error(`GET ${path} timed out`));
            });
            req.end();
        });
    }

    /**
     * Send HTTP POST with optional JSON body and return parsed JSON body.
     * @param {string} path
     * @param {any}    [body]  Optional payload (will be JSON-serialised)
     * @returns {Promise<any>}
     */
    _post(path, body) {
        return new Promise((resolve, reject) => {
            const payload = body !== undefined ? JSON.stringify(body) : '';

            const options = {
                hostname: this.host,
                port: this.port,
                path,
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    ...(payload ? {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(payload),
                    } : {}),
                },
            };

            const req = http.request(options, (res) => {
                let responseBody = '';
                res.setEncoding('utf8');
                res.on('data', (chunk) => { responseBody += chunk; });
                res.on('end', () => {
                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        try {
                            resolve(responseBody ? JSON.parse(responseBody) : null);
                        } catch {
                            resolve(responseBody || null);
                        }
                    } else {
                        reject(new Error(`POST ${path} returned HTTP ${res.statusCode}: ${responseBody}`));
                    }
                });
            });

            req.on('error', reject);
            req.setTimeout(10000, () => {
                req.destroy(new Error(`POST ${path} timed out`));
            });

            if (payload) {
                req.write(payload);
            }
            req.end();
        });
    }

    // ─────────────────────────────────────────────
    // Internal: Logging
    // ─────────────────────────────────────────────

    _log(msg) {
        console.log(`[WatchoutIntegration] ${msg}`);
    }

    _error(msg) {
        console.error(`[WatchoutIntegration] ERROR: ${msg}`);
        if (this.onError) {
            this.onError(new Error(msg));
        }
    }
}

module.exports = WatchoutIntegration;
