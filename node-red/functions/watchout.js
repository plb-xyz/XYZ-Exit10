/**
 * Watchout 7 HTTP Integration Module
 * v0.1 - Show Controller Architecture / Watchout Integration Layer
 *
 * Handles:
 *  - Timeline discovery via GET /v0/timelines on startup
 *  - Building a contentId → timelineId mapping in global context
 *  - Timeline control (start / stop / pause) via HTTP POST
 *  - Variable / input setting via POST /v0/input/{key}
 *  - Real-time state monitoring via Server-Sent Events (SSE)
 *  - Status polling fallback via GET /v0/state
 *
 * Default Watchout 7 HTTP API port: 3019
 *
 * Usage in a Node-RED "function" node (inject on startup):
 *   const wo = global.get('watchout');
 *   wo.init();
 *
 * All public methods return Promises and resolve with the JSON response
 * body (where applicable) or reject on error.
 */

'use strict';

const http = require('http');

// ---------------------------------------------------------------------------
// Configuration helpers
// ---------------------------------------------------------------------------

/**
 * Resolve config from Node-RED global context (set by a config-inject flow)
 * or fall back to the defaults baked into watchout.json.
 *
 * The calling function node should have already stored watchout.json
 * contents into global context under the key "watchoutConfig".
 */
function resolveConfig(globalContext) {
    const stored = globalContext.get('watchoutConfig') || {};
    return {
        host:               stored.host              || '127.0.0.1',
        port:               stored.port              || 3019,
        pollIntervalMs:     stored.pollIntervalMs    || 5000,
        sseReconnectDelayMs: stored.sseReconnectDelayMs || 3000,
        timelineNamePrefix: stored.timelineNamePrefix || '_',
        requestTimeoutMs:   stored.requestTimeoutMs  || 5000,
    };
}

// ---------------------------------------------------------------------------
// Low-level HTTP helpers (no external dependencies)
// ---------------------------------------------------------------------------

/**
 * Perform an HTTP request and return a Promise<{ statusCode, body }>.
 *
 * @param {object} options  - Node.js http.request options
 * @param {string} [body]   - Optional request body (string)
 * @param {number} timeoutMs
 */
function httpRequest(options, body, timeoutMs) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.setEncoding('utf8');
            res.on('data', (chunk) => { data += chunk; });
            res.on('end', () => {
                resolve({ statusCode: res.statusCode, body: data });
            });
        });

        req.setTimeout(timeoutMs, () => {
            req.destroy(new Error(`HTTP request timed out after ${timeoutMs}ms`));
        });

        req.on('error', reject);

        if (body) {
            req.write(body);
        }
        req.end();
    });
}

/**
 * Parse a JSON response body; return null on parse error rather than throwing.
 */
function safeParseJson(text) {
    try {
        return JSON.parse(text);
    } catch (_) {
        return null;
    }
}

// ---------------------------------------------------------------------------
// WatchoutClient factory
// ---------------------------------------------------------------------------

/**
 * Create and return a WatchoutClient bound to the given Node-RED
 * global context and node (for logging).
 *
 * @param {object} globalContext  - Node-RED global context
 * @param {object} node           - Node-RED node (for node.warn / node.error / node.log)
 */
function createWatchoutClient(globalContext, node) {
    const cfg = resolveConfig(globalContext);
    const BASE = { host: cfg.host, port: cfg.port };

    let _pollTimer    = null;
    let _sseRequest   = null;
    let _sseReconnectTimer = null;
    let _destroyed    = false;

    // -----------------------------------------------------------------------
    // Internal helpers
    // -----------------------------------------------------------------------

    function _log(msg)  { if (node && node.log)   node.log(`[Watchout] ${msg}`); }
    function _warn(msg) { if (node && node.warn)  node.warn(`[Watchout] ${msg}`); }
    function _err(msg)  { if (node && node.error) node.error(`[Watchout] ${msg}`); }

    /** Publish state to global context and emit a Node-RED message. */
    function _publishState(state) {
        globalContext.set('watchoutState', state);
        if (node && node.send) {
            node.send({ topic: 'watchout/state', payload: state });
        }
    }

    /** Publish timeline mapping to global context. */
    function _publishMapping(mapping) {
        globalContext.set('watchoutTimelines', mapping);
        if (node && node.send) {
            node.send({ topic: 'watchout/timelines', payload: mapping });
        }
    }

    // -----------------------------------------------------------------------
    // Timeline discovery
    // -----------------------------------------------------------------------

    /**
     * Discover all timelines from Watchout, build a contentId → timelineId
     * mapping, and store it in global context under "watchoutTimelines".
     *
     * Timeline names prefixed with cfg.timelineNamePrefix (default "_") are
     * treated as addressable content timelines. The prefix is stripped to
     * derive the contentId key (e.g. "_Show1" → "show1").
     *
     * All timelines are stored regardless; only prefixed ones are keyed by
     * content name for easy lookup by the show controller.
     *
     * @returns {Promise<object>} mapping  { contentId: timelineId, ... }
     */
    async function discoverTimelines() {
        const options = {
            ...BASE,
            path:   '/v0/timelines',
            method: 'GET',
            headers: { Accept: 'application/json' },
        };

        const { statusCode, body } = await httpRequest(options, null, cfg.requestTimeoutMs);

        if (statusCode !== 200) {
            throw new Error(`Timeline discovery failed – HTTP ${statusCode}`);
        }

        const timelines = safeParseJson(body);
        if (!Array.isArray(timelines)) {
            throw new Error('Timeline discovery returned unexpected payload');
        }

        // Build content mapping: strip prefix, lowercase → id
        const mapping = {};
        timelines.forEach((tl) => {
            if (typeof tl.name === 'string' && typeof tl.id === 'string') {
                const isContent = tl.name.startsWith(cfg.timelineNamePrefix);
                const contentId = isContent
                    ? tl.name.slice(cfg.timelineNamePrefix.length).toLowerCase()
                    : null;

                // Always keep the raw list for operator visibility
                if (!mapping._all) mapping._all = [];
                mapping._all.push({ id: tl.id, name: tl.name, contentId });

                // Index by contentId for programmatic access
                if (contentId) {
                    mapping[contentId] = tl.id;
                }
            }
        });

        const contentKeys = Object.keys(mapping).filter(k => k !== '_all');
        _publishMapping(mapping);
        _log(`Discovered ${timelines.length} timeline(s) (${contentKeys.length} addressable content timeline(s)): ${
            contentKeys.join(', ') || '(none)'
        }`);

        return mapping;
    }

    // -----------------------------------------------------------------------
    // State polling (fallback / verification)
    // -----------------------------------------------------------------------

    /**
     * Fetch the current state from Watchout and publish to global context.
     *
     * @returns {Promise<object>} state  Raw /v0/state response
     */
    async function fetchState() {
        const options = {
            ...BASE,
            path:   '/v0/state',
            method: 'GET',
            headers: { Accept: 'application/json' },
        };

        const { statusCode, body } = await httpRequest(options, null, cfg.requestTimeoutMs);

        if (statusCode !== 200) {
            throw new Error(`State fetch failed – HTTP ${statusCode}`);
        }

        const state = safeParseJson(body);
        if (!state || typeof state !== 'object') {
            throw new Error('State fetch returned unexpected payload');
        }

        _publishState(state);
        return state;
    }

    /** Start the polling timer. */
    function _startPolling() {
        if (_pollTimer !== null) return;
        _pollTimer = setInterval(async () => {
            try {
                await fetchState();
            } catch (e) {
                _warn(`State poll failed: ${e.message}`);
            }
        }, cfg.pollIntervalMs);
    }

    /** Stop the polling timer. */
    function _stopPolling() {
        if (_pollTimer !== null) {
            clearInterval(_pollTimer);
            _pollTimer = null;
        }
    }

    // -----------------------------------------------------------------------
    // Server-Sent Events (real-time state monitoring)
    // -----------------------------------------------------------------------

    /**
     * Open an SSE connection to /v0/events.
     * Parses incoming events and publishes state changes via _publishState.
     * Automatically reconnects on connection loss.
     */
    function _connectSSE() {
        if (_destroyed) return;

        const options = {
            ...BASE,
            path:    '/v0/events',
            method:  'GET',
            headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
        };

        _log('Connecting to SSE event stream…');

        const req = http.request(options, (res) => {
            if (res.statusCode !== 200) {
                _warn(`SSE connection rejected – HTTP ${res.statusCode}; will retry`);
                res.resume();
                _scheduleSSEReconnect();
                return;
            }

            _log('SSE connection established');
            globalContext.set('watchoutConnected', true);

            let buffer = '';

            res.setEncoding('utf8');
            res.on('data', (chunk) => {
                buffer += chunk;
                const lines = buffer.split('\n');
                buffer = lines.pop() || ''; // keep incomplete last line

                let eventType = 'message';
                let dataLines = [];

                lines.forEach((line) => {
                    if (line.startsWith('event:')) {
                        eventType = line.slice(6).trim();
                    } else if (line.startsWith('data:')) {
                        dataLines.push(line.slice(5).trim());
                    } else if (line === '' && dataLines.length > 0) {
                        // Dispatch complete event
                        const rawData = dataLines.join('\n');
                        const parsed  = safeParseJson(rawData);
                        _handleSSEEvent(eventType, parsed || rawData);
                        eventType  = 'message';
                        dataLines  = [];
                    }
                });
            });

            res.on('end', () => {
                _log('SSE connection closed by server; will reconnect');
                globalContext.set('watchoutConnected', false);
                _scheduleSSEReconnect();
            });

            res.on('error', (err) => {
                _warn(`SSE stream error: ${err.message}; will reconnect`);
                globalContext.set('watchoutConnected', false);
                _scheduleSSEReconnect();
            });
        });

        req.on('error', (err) => {
            _warn(`SSE request error: ${err.message}; will reconnect`);
            globalContext.set('watchoutConnected', false);
            _scheduleSSEReconnect();
        });

        req.end();
        _sseRequest = req;
    }

    /** Handle a parsed SSE event. */
    function _handleSSEEvent(eventType, data) {
        if (data && typeof data === 'object') {
            // Watchout emits the full state object on each change
            _publishState(data);
        }
        if (node && node.send) {
            node.send({ topic: `watchout/sse/${eventType}`, payload: data });
        }
    }

    /** Schedule an SSE reconnect after the configured delay. */
    function _scheduleSSEReconnect() {
        if (_destroyed) return;
        if (_sseReconnectTimer !== null) return; // already scheduled
        _sseReconnectTimer = setTimeout(() => {
            _sseReconnectTimer = null;
            if (!_destroyed) _connectSSE();
        }, cfg.sseReconnectDelayMs);
    }

    // -----------------------------------------------------------------------
    // Timeline control
    // -----------------------------------------------------------------------

    /**
     * Send a control command to a timeline.
     *
     * @param {string} timelineId  - Watchout timeline ID (numeric string)
     * @param {'start'|'stop'|'pause'} command
     * @param {object} [params]    - Optional body params (e.g. { time: 0 })
     * @returns {Promise<object>}
     */
    async function controlTimeline(timelineId, command, params) {
        const allowed = ['start', 'stop', 'pause'];
        if (!allowed.includes(command)) {
            throw new Error(`Unknown timeline command "${command}"; use: ${allowed.join(', ')}`);
        }

        const bodyStr = params ? JSON.stringify(params) : null;

        const options = {
            ...BASE,
            path:   `/v0/timelines/${encodeURIComponent(timelineId)}/${command}`,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Accept:         'application/json',
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
            },
        };

        const { statusCode, body } = await httpRequest(options, bodyStr, cfg.requestTimeoutMs);

        if (statusCode < 200 || statusCode >= 300) {
            throw new Error(`Timeline ${command} failed for id=${timelineId} – HTTP ${statusCode}`);
        }

        _log(`Timeline ${timelineId} ${command} → OK`);
        return safeParseJson(body) || {};
    }

    /**
     * Start a timeline by content name (resolved via global timeline mapping).
     *
     * @param {string} contentId  e.g. "show1"
     * @returns {Promise<object>}
     */
    async function startByContent(contentId) {
        const mapping = globalContext.get('watchoutTimelines') || {};
        const id = mapping[contentId.toLowerCase()];
        if (!id) {
            throw new Error(`No timeline found for contentId "${contentId}". Run discoverTimelines() first.`);
        }
        return controlTimeline(id, 'start');
    }

    /**
     * Stop a timeline by content name.
     *
     * @param {string} contentId
     * @returns {Promise<object>}
     */
    async function stopByContent(contentId) {
        const mapping = globalContext.get('watchoutTimelines') || {};
        const id = mapping[contentId.toLowerCase()];
        if (!id) {
            throw new Error(`No timeline found for contentId "${contentId}". Run discoverTimelines() first.`);
        }
        return controlTimeline(id, 'stop');
    }

    /**
     * Pause a timeline by content name.
     *
     * @param {string} contentId
     * @returns {Promise<object>}
     */
    async function pauseByContent(contentId) {
        const mapping = globalContext.get('watchoutTimelines') || {};
        const id = mapping[contentId.toLowerCase()];
        if (!id) {
            throw new Error(`No timeline found for contentId "${contentId}". Run discoverTimelines() first.`);
        }
        return controlTimeline(id, 'pause');
    }

    // -----------------------------------------------------------------------
    // Variable / input setting
    // -----------------------------------------------------------------------

    /**
     * Set a Watchout input (variable) value.
     *
     * @param {string} key    - Input key
     * @param {*}      value  - Value to set (will be JSON-serialised)
     * @returns {Promise<object>}
     */
    async function setInput(key, value) {
        if (!key || typeof key !== 'string') {
            throw new Error('setInput: key must be a non-empty string');
        }

        const bodyStr = JSON.stringify({ value });
        const options = {
            ...BASE,
            path:   `/v0/input/${encodeURIComponent(key)}`,
            method: 'POST',
            headers: {
                'Content-Type':   'application/json',
                Accept:           'application/json',
                'Content-Length': Buffer.byteLength(bodyStr),
            },
        };

        const { statusCode, body } = await httpRequest(options, bodyStr, cfg.requestTimeoutMs);

        if (statusCode < 200 || statusCode >= 300) {
            throw new Error(`setInput failed for key="${key}" – HTTP ${statusCode}`);
        }

        _log(`Input "${key}" set to ${JSON.stringify(value)} → OK`);
        return safeParseJson(body) || {};
    }

    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------

    /**
     * Initialise the Watchout integration.
     *
     * Call this on Node-RED startup (inject node / on-start hook).
     * Order of operations:
     *  1. Discover and cache all timelines (populates global context)
     *  2. Fetch initial state snapshot
     *  3. Open SSE connection for real-time updates
     *  4. Start polling timer as fallback / verification
     *
     * @returns {Promise<void>}
     */
    async function init() {
        _destroyed = false;
        _log('Initialising…');

        try {
            await discoverTimelines();
        } catch (e) {
            _err(`Timeline discovery failed on init: ${e.message}`);
        }

        try {
            await fetchState();
        } catch (e) {
            _warn(`Initial state fetch failed: ${e.message}`);
        }

        _connectSSE();
        _startPolling();

        _log('Initialisation complete');
    }

    /**
     * Cleanly shut down the integration (stop polling, close SSE).
     * Call this in a Node-RED "close" handler.
     */
    function destroy() {
        _destroyed = true;
        _stopPolling();

        if (_sseReconnectTimer !== null) {
            clearTimeout(_sseReconnectTimer);
            _sseReconnectTimer = null;
        }

        if (_sseRequest) {
            try { _sseRequest.destroy(); } catch (_) {}
            _sseRequest = null;
        }

        globalContext.set('watchoutConnected', false);
        _log('Destroyed');
    }

    // -----------------------------------------------------------------------
    // Public API
    // -----------------------------------------------------------------------

    return {
        init,
        destroy,
        discoverTimelines,
        fetchState,
        controlTimeline,
        startByContent,
        stopByContent,
        pauseByContent,
        setInput,
    };
}

// ---------------------------------------------------------------------------
// Node-RED entry point
// ---------------------------------------------------------------------------

/**
 * Attach the Watchout client to global context so any function node in
 * the flow can use it:
 *
 *   const wo = global.get('watchout');
 *   await wo.startByContent('show1');
 *
 * Paste the following into a Node-RED "function" node wired to an "inject"
 * node set to fire on deploy/startup:
 *
 *   const config = global.get('watchoutConfig');  // loaded from watchout.json
 *   const wo = createWatchoutClient(global, node);
 *   global.set('watchout', wo);
 *   await wo.init();
 *
 * This file can also be loaded via Node-RED's "functionGlobalContext"
 * in settings.js:
 *
 *   functionGlobalContext: {
 *     createWatchoutClient: require('./functions/watchout')
 *   }
 *
 * Then in any function node:
 *   const create = global.get('createWatchoutClient');
 *   const wo     = create(global, node);
 *   global.set('watchout', wo);
 *   await wo.init();
 */

module.exports = createWatchoutClient;
