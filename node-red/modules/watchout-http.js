/**
 * Watchout 7 HTTP Integration Module (v0.1)
 *
 * Provides manual timeline discovery, change detection, persistent mapping
 * storage, timeline control, real-time SSE monitoring, and fallback status
 * polling for Dataton Watchout 7 via its HTTP API.
 *
 * Default port: 3019 (Watchout 7 HTTP API)
 *
 * Usage in Node-RED function node:
 *   const WatchoutHTTP = global.get('watchout_module');
 *   // or: const WatchoutHTTP = require('/path/to/watchout-http.js');
 *   const wo = new WatchoutHTTP({ host: '192.168.1.10', port: 3019 });
 */

'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const EventEmitter = require('events');

const DEFAULT_HOST = 'localhost';
const DEFAULT_PORT = 3019;
const POLL_INTERVAL_MS = 5000;
const SSE_RECONNECT_DELAY_MS = 5000;
const REQUEST_TIMEOUT_MS = 10000;

class WatchoutHTTP extends EventEmitter {
  /**
   * @param {object} options
   * @param {string}  [options.host='localhost']         Watchout host IP or hostname
   * @param {number}  [options.port=3019]                Watchout HTTP API port
   * @param {string}  [options.storageFile]              Path to persist timeline mapping JSON
   * @param {object}  [options.context]                  Node-RED flow/global context object
   */
  constructor(options = {}) {
    super();

    this.host = options.host || DEFAULT_HOST;
    this.port = options.port || DEFAULT_PORT;
    this.storageFile =
      options.storageFile ||
      path.join(__dirname, '../data/timeline-mapping.json');
    this.context = options.context || null;

    /** @type {{ [contentId: string]: { displayName: string, watchoutId: string } }} contentId → { displayName, watchoutId } */
    this._mapping = {};

    this._sseRequest = null;
    this._pollTimer = null;
    this._connected = false;

    /** Pending new mapping waiting for operator confirmation */
    this._pendingDiscovery = null;

    this._loadMapping();
  }

  // ─── Persistent Storage ────────────────────────────────────────────────────

  /**
   * Load stored mapping from Node-RED context (first choice) or file system.
   * Called once on construction.
   */
  _loadMapping() {
    if (this.context) {
      const ctx = this.context.get('watchout_mapping');
      if (ctx && typeof ctx === 'object') {
        this._mapping = ctx;
        return;
      }
    }

    try {
      if (fs.existsSync(this.storageFile)) {
        const raw = fs.readFileSync(this.storageFile, 'utf-8');
        const data = JSON.parse(raw);
        this._mapping = data.mapping || {};
      }
    } catch (err) {
      console.warn(
        '[WatchoutHTTP] Failed to load mapping from file:',
        err.message
      );
      this._mapping = {};
    }
  }

  /**
   * Persist mapping to both Node-RED context and file system.
   * @param {{ [contentId: string]: string }} mapping
   */
  _saveMapping(mapping) {
    this._mapping = mapping;
    this._pendingDiscovery = null;

    if (this.context) {
      this.context.set('watchout_mapping', mapping);
    }

    try {
      const dir = path.dirname(this.storageFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = { mapping, lastSaved: new Date().toISOString() };
      fs.writeFileSync(this.storageFile, JSON.stringify(data, null, 2));
    } catch (err) {
      console.warn(
        '[WatchoutHTTP] Failed to save mapping to file:',
        err.message
      );
    }
  }

  /** Return a copy of the current stored mapping. */
  getMapping() {
    return { ...this._mapping };
  }

  // ─── HTTP Helpers ──────────────────────────────────────────────────────────

  /**
   * Perform an HTTP request against the Watchout API.
   * @param {string} method  HTTP verb (GET, POST, PUT, DELETE)
   * @param {string} urlPath API path (e.g. '/v0/timelines')
   * @param {object} [body]  Optional JSON body
   * @returns {Promise<{ statusCode: number, body: any }>}
   */
  _request(method, urlPath, body = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: this.host,
        port: this.port,
        path: urlPath,
        method,
        headers: { 'Content-Type': 'application/json' },
      };

      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          let parsed;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {
            parsed = data;
          }
          resolve({ statusCode: res.statusCode, body: parsed });
        });
        res.on('error', reject);
      });

      req.on('error', reject);
      req.setTimeout(REQUEST_TIMEOUT_MS, () => {
        req.destroy(new Error('Request timed out'));
      });

      if (body !== null) {
        req.write(JSON.stringify(body));
      }
      req.end();
    });
  }

  // ─── Timeline Name Parsing ─────────────────────────────────────────────────

  /**
   * Convert a Watchout timeline name to a content ID.
   *
   * Rules:
   * - Names beginning with '_' are treated as system/internal timelines and
   *   are skipped (returns null).
   * - The name is trimmed, lower-cased, spaces are replaced with underscores,
   *   and any remaining non-alphanumeric/underscore characters are removed.
   *
   * Examples:
   *   "Show 1"       → "show_1"
   *   "_SystemClock" → null  (skipped)
   *   "Ambience 2"   → "ambience_2"
   *
   * @param {string} name
   * @returns {string|null}
   */
  parseTimelineName(name) {
    if (!name || name.startsWith('_')) return null;
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');
  }

  // ─── Manual Discovery ──────────────────────────────────────────────────────

  /**
   * Fetch the timeline list from Watchout and compare it against the stored
   * mapping.  Does NOT save yet — call confirmDiscovery() after the operator
   * reviews the diff.
   *
   * @returns {Promise<{
   *   newMapping: { [contentId: string]: { displayName: string, watchoutId: string } },
   *   diff: { added: string[], removed: string[], unchanged: string[], changed: string[] },
   *   hasChanges: boolean
   * }>}
   */
  async discoverTimelines() {
    let timelines;

    try {
      const result = await this._request('GET', '/v0/timelines');
      if (result.statusCode !== 200) {
        throw new Error(`Watchout returned HTTP ${result.statusCode}`);
      }
      timelines = Array.isArray(result.body) ? result.body : [];
    } catch (err) {
      throw new Error(
        `Failed to fetch timelines from Watchout at ${this.host}:${this.port} — ${err.message}`
      );
    }

    const newMapping = {};
    for (const tl of timelines) {
      const contentId = this.parseTimelineName(tl.name);
      if (contentId) {
        newMapping[contentId] = { displayName: tl.name, watchoutId: String(tl.id) };
      }
    }

    const diff = this._compareMapping(this._mapping, newMapping);
    this._pendingDiscovery = newMapping;

    return {
      newMapping,
      diff,
      hasChanges: diff.added.length > 0 || diff.removed.length > 0 || diff.changed.length > 0,
    };
  }

  /**
   * Confirm and persist the most recent discovery result.
   * Should be called after the operator clicks [Confirm & Save].
   *
   * @returns {{ success: boolean, mapping: object }}
   */
  confirmDiscovery() {
    if (!this._pendingDiscovery) {
      throw new Error('No pending discovery to confirm. Run discoverTimelines() first.');
    }
    const mapping = this._pendingDiscovery;
    this._saveMapping(mapping);
    this.emit('mapping-updated', mapping);
    return { success: true, mapping };
  }

  /**
   * Cancel the pending discovery (operator clicked [Cancel]).
   * Clears the pending mapping without saving.
   */
  cancelDiscovery() {
    this._pendingDiscovery = null;
  }

  /**
   * Compare old and new mappings and return categorised differences.
   *
   * @param {{ [contentId: string]: { displayName: string, watchoutId: string } }} oldMapping
   * @param {{ [contentId: string]: { displayName: string, watchoutId: string } }} newMapping
   * @returns {{ added: string[], removed: string[], unchanged: string[], changed: string[] }}
   */
  _compareMapping(oldMapping, newMapping) {
    const oldKeys = Object.keys(oldMapping);
    const newKeys = Object.keys(newMapping);

    const removed = oldKeys.filter((k) => !Object.prototype.hasOwnProperty.call(newMapping, k));
    const added = newKeys.filter((k) => !Object.prototype.hasOwnProperty.call(oldMapping, k));
    const unchanged = oldKeys.filter(
      (k) =>
        Object.prototype.hasOwnProperty.call(newMapping, k) &&
        oldMapping[k].watchoutId === newMapping[k].watchoutId
    );
    const changed = oldKeys.filter(
      (k) =>
        Object.prototype.hasOwnProperty.call(newMapping, k) &&
        oldMapping[k].watchoutId !== newMapping[k].watchoutId
    );

    return { added, removed, unchanged, changed };
  }

  /**
   * Format a discovery diff into human-readable lines for the operator.
   *
   * @param {{ added: string[], removed: string[], unchanged: string[], changed: string[] }} diff
   * @returns {string[]}
   */
  formatDiff(diff) {
    const lines = [];
    for (const name of diff.removed) {
      lines.push(`❌ Removed  : Timeline '${name}' no longer exists`);
    }
    for (const name of diff.added) {
      lines.push(`✨ Added    : New timeline '${name}' discovered`);
    }
    for (const name of diff.changed) {
      lines.push(`🔄 Changed  : Timeline '${name}' ID has changed`);
    }
    for (const name of diff.unchanged) {
      lines.push(`✓  Unchanged: '${name}'`);
    }
    return lines;
  }

  // ─── Timeline Control ──────────────────────────────────────────────────────

  /**
   * Resolve a contentId to a Watchout timeline ID using the stored mapping.
   * If the value is not in the mapping, it is assumed to already be a timeline ID.
   *
   * @param {string} contentIdOrTimelineId
   * @returns {string}
   */
  _resolveTimelineId(contentIdOrTimelineId) {
    const entry = this._mapping[contentIdOrTimelineId];
    if (entry) return String(entry.watchoutId);
    return String(contentIdOrTimelineId);
  }

  /**
   * Start (play) a timeline.
   * @param {string} contentId  Content ID from the mapping, or a raw timeline ID
   * @returns {Promise<{ timelineId: string, statusCode: number, body: any }>}
   */
  async startTimeline(contentId) {
    const timelineId = this._resolveTimelineId(contentId);
    const result = await this._request('POST', `/v0/timelines/${timelineId}/play`);
    return { timelineId, statusCode: result.statusCode, body: result.body };
  }

  /**
   * Stop a timeline.
   * @param {string} contentId  Content ID from the mapping, or a raw timeline ID
   * @returns {Promise<{ timelineId: string, statusCode: number, body: any }>}
   */
  async stopTimeline(contentId) {
    const timelineId = this._resolveTimelineId(contentId);
    const result = await this._request('POST', `/v0/timelines/${timelineId}/stop`);
    return { timelineId, statusCode: result.statusCode, body: result.body };
  }

  /**
   * Pause a timeline.
   * @param {string} contentId  Content ID from the mapping, or a raw timeline ID
   * @returns {Promise<{ timelineId: string, statusCode: number, body: any }>}
   */
  async pauseTimeline(contentId) {
    const timelineId = this._resolveTimelineId(contentId);
    const result = await this._request('POST', `/v0/timelines/${timelineId}/pause`);
    return { timelineId, statusCode: result.statusCode, body: result.body };
  }

  /**
   * Set a Watchout variable.
   * @param {string} name   Variable name
   * @param {*}      value  Variable value
   * @returns {Promise<{ statusCode: number, body: any }>}
   */
  async setVariable(name, value) {
    const result = await this._request(
      'PUT',
      `/v0/vars/${encodeURIComponent(name)}`,
      { value }
    );
    return { statusCode: result.statusCode, body: result.body };
  }

  /**
   * Fetch the current Watchout system state.
   * @returns {Promise<any>}
   */
  async getState() {
    const result = await this._request('GET', '/v0/state');
    return result.body;
  }

  // ─── Real-time SSE Monitoring ──────────────────────────────────────────────

  /**
   * Start the SSE listener.  Emits 'state-change' events as Watchout pushes
   * updates.  Automatically falls back to polling if the SSE stream drops.
   */
  startMonitoring() {
    if (this._sseRequest) return;
    this._connectSSE();
  }

  _connectSSE() {
    const options = {
      hostname: this.host,
      port: this.port,
      path: '/v0/events',
      method: 'GET',
      headers: { Accept: 'text/event-stream', 'Cache-Control': 'no-cache' },
    };

    const req = http.request(options, (res) => {
      if (res.statusCode !== 200) {
        res.destroy();
        this._handleSSEFailure(
          new Error(`SSE endpoint returned HTTP ${res.statusCode}`)
        );
        return;
      }

      this._connected = true;
      this._stopPolling();
      this.emit('connected');

      let buffer = '';

      res.on('data', (chunk) => {
        buffer += chunk.toString();
        const parts = buffer.split('\n\n');
        buffer = parts.pop(); // keep the incomplete trailing fragment

        for (const block of parts) {
          const event = this._parseSSEBlock(block);
          if (event) {
            this.emit('state-change', event);
          }
        }
      });

      res.on('end', () => {
        this._sseRequest = null;
        this._connected = false;
        this.emit('disconnected');
        this._startPolling();
        setTimeout(() => this._connectSSE(), SSE_RECONNECT_DELAY_MS);
      });

      res.on('error', (err) => {
        this._sseRequest = null;
        this._connected = false;
        this.emit('error', err);
        this._handleSSEFailure(err);
      });
    });

    req.on('error', (err) => {
      this._sseRequest = null;
      this._connected = false;
      this._handleSSEFailure(err);
    });

    req.end();
    this._sseRequest = req;
  }

  _parseSSEBlock(block) {
    const event = {};
    for (const line of block.split('\n')) {
      if (line.startsWith('event:')) {
        event.type = line.slice(6).trim();
      } else if (line.startsWith('data:')) {
        const raw = line.slice(5).trim();
        try {
          event.data = JSON.parse(raw);
        } catch {
          event.data = raw;
        }
      }
    }
    return event.type || event.data !== undefined ? event : null;
  }

  _handleSSEFailure(err) {
    this.emit('error', err);
    this._startPolling();
    setTimeout(() => this._connectSSE(), SSE_RECONNECT_DELAY_MS);
  }

  /**
   * Stop the SSE listener and any running poll timer.
   */
  stopMonitoring() {
    if (this._sseRequest) {
      this._sseRequest.destroy();
      this._sseRequest = null;
    }
    this._stopPolling();
    this._connected = false;
  }

  // ─── Status Polling (SSE fallback) ─────────────────────────────────────────

  _startPolling() {
    if (this._pollTimer) return;
    this._pollTimer = setInterval(async () => {
      try {
        const state = await this.getState();
        this.emit('state-change', { type: 'poll', data: state });
      } catch (err) {
        this.emit('error', err);
      }
    }, POLL_INTERVAL_MS);
  }

  _stopPolling() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer);
      this._pollTimer = null;
    }
  }

  /** @returns {boolean} Whether the SSE stream is currently connected */
  get isConnected() {
    return this._connected;
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────────────

  /** Stop monitoring and clean up resources. */
  destroy() {
    this.stopMonitoring();
    this.removeAllListeners();
  }
}

module.exports = WatchoutHTTP;
