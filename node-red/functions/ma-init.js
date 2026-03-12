/**
 * grandMA3 Init — Node-RED Function Node (ma-init.js)
 * v1.0
 *
 * Paste this as the body of a Function node wired from an Inject node
 * configured to trigger once at startup / on deploy.
 *
 * Reads node-red/config/ma-config.json from disk (relative to the Node-RED
 * userDir) and populates global context variables used by ma-control.js.
 *
 * ─── Global context set ────────────────────────────────────────────────────
 *
 *   global.ma_config      — full parsed ma-config.json object
 *   global.ma_owner       — set to "nodered" on first run; preserved on redeploy
 *   global.ma_owner_setBy — "ma-init" on first run; preserved on redeploy
 *   global.ma_zones       — { a1:false, a2:false, a3:false, ls:false } (first run only)
 *   global.ma_exec_cue    — 1 (first run only)
 *   global.ma_seq_id      — 1 (first run only)
 *   global.ma_seq_cue     — 1 (first run only)
 *
 * ─── Output ────────────────────────────────────────────────────────────────
 *
 *   On success:
 *     msg.topic   = "ma/init"
 *     msg.payload = { config, owner, setBy, message }
 *
 *   On error (config file not found / parse failure):
 *     msg.topic   = "ma/init/error"
 *     msg.payload = { error, path }
 */

'use strict';

var fs   = require('fs');
var path = require('path');

var configPath = path.join(RED.settings.userDir, 'node-red', 'config', 'ma-config.json');
// Path assumes this is a Node-RED Project where userDir is the project root
// (the directory that contains package.json and flows.json at its top level).
// Adjust the relative path below if your Node-RED installation stores the
// project files elsewhere relative to userDir.

var config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
    node.error('[MA Init] Failed to read config from ' + configPath + ': ' + err.message);
    return { topic: 'ma/init/error', payload: { error: err.message, path: configPath } };
}

global.set('ma_config', config);

// Only set owner on first run; preserve explicit changes across redeploys.
if (global.get('ma_owner') === undefined) {
    global.set('ma_owner', 'nodered');
    global.set('ma_owner_setBy', 'ma-init');
}

// Initialise UI state only if not yet present (survive redeploys).
if (!global.get('ma_zones'))              global.set('ma_zones',     { a1: false, a2: false, a3: false, ls: false });
if (global.get('ma_exec_cue') === undefined) global.set('ma_exec_cue', 1);
if (global.get('ma_seq_id')   === undefined) global.set('ma_seq_id',   1);
if (global.get('ma_seq_cue')  === undefined) global.set('ma_seq_cue',  1);

var owner  = global.get('ma_owner');
var setBy  = global.get('ma_owner_setBy');
var zones  = Object.keys(config.zoneExecutor || {}).join(', ');

node.log('[MA Init] Config loaded from ' + configPath + '. Zones: ' + zones + '. Owner: ' + owner);

return {
    topic: 'ma/init',
    payload: {
        config:  config,
        owner:   owner,
        setBy:   setBy,
        message: 'MA config loaded. Zones: ' + zones + '. Owner: ' + owner
    }
};
