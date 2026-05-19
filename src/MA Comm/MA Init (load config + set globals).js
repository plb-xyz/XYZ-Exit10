'use strict';

// Just ensure expected globals exist with safe defaults.

// Optional: keep ma_config for future non-routing settings
var cfg = global.get('ma_config');
if (!cfg || typeof cfg !== 'object' || Array.isArray(cfg)) cfg = {};

// If you want a default executor page when user supplies "201" (not "1.201")
if (cfg.defaultExecPage == null) cfg.defaultExecPage = 1;

global.set('ma_config', cfg);

// Owner tracking (even if you no longer enforce owner gating)
if (global.get('ma_owner') === undefined) global.set('ma_owner', null);
if (global.get('ma_owner_setBy') === undefined) global.set('ma_owner_setBy', 'ma-init');

return {
  topic: 'ma/init',
  payload: {
    message: 'MA init OK (no file config; no zoneExecutor required)',
    owner: global.get('ma_owner'),
    config: global.get('ma_config')
  }
};