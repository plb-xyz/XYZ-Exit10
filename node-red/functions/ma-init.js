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
 *   global.ma_owner       — set to null on first run (open gate); preserved on redeploy
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

var userDir = (typeof RED !== 'undefined' && RED.settings && RED.settings.userDir)
    ? RED.settings.userDir : process.cwd();

// Resolve config path robustly for Node-RED Projects in Docker.
// Tries, in order:
//   1) <userDir>/projects/<name>/node-red/config/ma-config.json  (Node-RED Project)
//   2) <userDir>/node-red/config/ma-config.json
//   3) <userDir>/config/ma-config.json
function findConfigPath(dir) {
    var tried = [];
    try {
        var projDir = path.join(dir, 'projects');
        var projects = fs.readdirSync(projDir);
        for (var i = 0; i < projects.length; i++) {
            var p = path.join(projDir, projects[i], 'node-red', 'config', 'ma-config.json');
            tried.push(p);
            if (fs.existsSync(p)) return { path: p, tried: tried };
        }
    } catch (e) {
        if (e.code !== 'ENOENT' && e.code !== 'ENOTDIR') {
            node.warn('[MA Init] projects dir scan: ' + e.message);
        }
    }
    var p2 = path.join(dir, 'node-red', 'config', 'ma-config.json');
    tried.push(p2);
    if (fs.existsSync(p2)) return { path: p2, tried: tried };
    var p3 = path.join(dir, 'config', 'ma-config.json');
    tried.push(p3);
    if (fs.existsSync(p3)) return { path: p3, tried: tried };
    return { path: null, tried: tried };
}

var found = findConfigPath(userDir);
if (!found.path) {
    node.error('[MA Init] ma-config.json not found. Tried: ' + found.tried.join(', '));
    return { topic: 'ma/init/error', payload: { error: 'ma-config.json not found', attempted: found.tried } };
}
var configPath = found.path;

var config;
try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
} catch (err) {
    node.error('[MA Init] Failed to read config from ' + configPath + ': ' + err.message);
    return { topic: 'ma/init/error', payload: { error: err.message, path: configPath } };
}

global.set('ma_config', config);

// Only set owner on first run; preserve explicit changes across redeploys.
// null = open gate (both nodered and watchout actions allowed).
if (global.get('ma_owner') === undefined) {
    global.set('ma_owner', null);
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
