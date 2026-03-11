/**
 * Node-RED Initialization Flow - Watchout 7 HTTP Integration
 * v0.1
 *
 * This file documents how to wire up the WatchoutIntegration module inside
 * Node-RED.  Import it into your Node-RED project or use the code snippets
 * in "exec" / "function" nodes as described below.
 *
 * ─── Flow overview ───────────────────────────────────────────────────────────
 *
 *  [inject: startup trigger]
 *       │
 *       ▼
 *  [function: initialize watchout]  ← loads watchout-integration.js
 *       │
 *       ├─→ global context: woTimelines  (contentId → timelineId map)
 *       ├─→ global context: woIntegration (WatchoutIntegration instance)
 *       └─→ [debug] logs discovered timelines
 *
 *  [inject: control trigger]
 *       │
 *       ▼
 *  [function: control timeline]
 *       │
 *       └─→ calls wo.startTimeline() / stopTimeline() / pauseTimeline()
 *
 *  [inject: set variable trigger]
 *       │
 *       ▼
 *  [function: set input]
 *       │
 *       └─→ calls wo.setInput(key, value)
 *
 * ─────────────────────────────────────────────────────────────────────────────
 */

'use strict';

/**
 * STEP 1 — Initialization function node
 *
 * Paste this code into a Node-RED "function" node wired after a startup
 * "inject" node (set "inject once after X seconds" to 1).
 *
 * Node properties required: none (uses global context)
 */
function initWatchout(msg, context, node, RED) {
    const WatchoutIntegration = require('/home/runner/work/XYZ-Exit10/XYZ-Exit10/node-red/modules/watchout-integration');
    // In a real deployment, require the module by its path relative to
    // the Node-RED userDir, e.g.:
    //   require(RED.settings.userDir + '/modules/watchout-integration')

    const config = {
        host: context.global.get('woHost') || 'localhost',
        port: context.global.get('woPort') || 3019,

        onTimelinesReady: (mapping) => {
            context.global.set('woTimelines', mapping);
            node.log('[Watchout] Timeline mapping stored: ' + JSON.stringify(mapping));
        },

        onStateChange: (state) => {
            context.global.set('woState', state);
            // Optionally emit a message into the flow:
            // node.send({ topic: 'wo/state', payload: state });
        },

        onError: (err) => {
            node.error('[Watchout] ' + err.message);
        },
    };

    const wo = new WatchoutIntegration(config);

    // Store instance globally so other function nodes can access it
    context.global.set('woIntegration', wo);

    wo.initialize()
        .then(() => {
            node.log('[Watchout] Integration initialized');
        })
        .catch((err) => {
            node.error('[Watchout] Initialization error: ' + err.message);
        });

    return msg;
}

/**
 * STEP 2 — Timeline control function node
 *
 * Paste this code into a Node-RED "function" node.
 * Expects msg.payload = { action: 'start'|'stop'|'pause', timelineId: '1' }
 * or use msg.payload.contentId to resolve from the timeline mapping.
 */
function controlTimeline(msg, context, node) {
    const wo = context.global.get('woIntegration');
    if (!wo) {
        node.error('WatchoutIntegration not initialized');
        return null;
    }

    let timelineId = msg.payload.timelineId;

    // Optionally resolve by content ID (timeline name)
    if (!timelineId && msg.payload.contentId) {
        timelineId = wo.resolveTimelineId(msg.payload.contentId);
        if (!timelineId) {
            node.error('Unknown contentId: ' + msg.payload.contentId);
            return null;
        }
    }

    const action = msg.payload.action || 'start';
    let promise;

    switch (action) {
        case 'start':
        case 'play':
            promise = wo.startTimeline(timelineId);
            break;
        case 'pause':
            promise = wo.pauseTimeline(timelineId);
            break;
        case 'stop':
            promise = wo.stopTimeline(timelineId);
            break;
        default:
            node.error('Unknown action: ' + action);
            return null;
    }

    promise
        .then(() => node.log(`[Watchout] ${action} timeline ${timelineId} OK`))
        .catch((err) => node.error(`[Watchout] ${action} timeline ${timelineId} failed: ${err.message}`));

    return msg;
}

/**
 * STEP 3 — Set input/variable function node
 *
 * Expects msg.payload = { key: 'A1_CONTENT', value: 5 }
 * or     msg.payload = [ { key: 'A1_CONTENT', value: 5 }, { key: 'A2_CONTENT', value: 3 } ]
 */
function setInput(msg, context, node) {
    const wo = context.global.get('woIntegration');
    if (!wo) {
        node.error('WatchoutIntegration not initialized');
        return null;
    }

    let promise;

    if (Array.isArray(msg.payload)) {
        promise = wo.setInputs(msg.payload);
    } else {
        const { key, value, time } = msg.payload;
        promise = wo.setInput(key, value, time);
    }

    promise
        .then(() => node.log('[Watchout] Input set OK'))
        .catch((err) => node.error('[Watchout] Set input failed: ' + err.message));

    return msg;
}

module.exports = {
    initWatchout,
    controlTimeline,
    setInput,
};
