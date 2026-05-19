// Config file missing — create defaults
const defaultCfg = {
    host: 'localhost',
    port: 3019,
    mappingFile: '/projects/XYZ-Exit10/node-red/data/timeline-mapping.json'
};
flow.set('watchout_config', defaultCfg);
node.warn('[Watchout] watchout-config.json not found — writing defaults');
msg.filename = '/config/watchout-config.json';
msg.payload  = JSON.stringify(defaultCfg, null, 2);
return msg;