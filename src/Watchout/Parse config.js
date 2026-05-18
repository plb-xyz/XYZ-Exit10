// Parse watchout-config.json
let cfg = {};
try {
    cfg = JSON.parse(msg.payload);
} catch(e) {
    node.warn('[Watchout] watchout-config.json parse error, using defaults: ' + e.message);
}
cfg.host        = cfg.host        || 'localhost';
cfg.port        = cfg.port        || 3019;
cfg.mappingFile = cfg.mappingFile || '/projects/XYZ-Exit10/node-red/data/timeline-mapping.json';
flow.set('watchout_config', cfg);
node.status({ fill: 'green', shape: 'dot', text: 'Config: ' + cfg.host + ':' + cfg.port });
// Feed filename forward to read mapping file
msg.filename = cfg.mappingFile;
return msg;