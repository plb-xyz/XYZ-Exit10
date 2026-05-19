// Parse ma-cue-mapper-config.json
var cfg = {};
try {
    cfg = JSON.parse(msg.payload);
} catch(e) {
    node.warn('[MA Cue Mapper] Config parse error, using defaults: ' + e.message);
}
cfg.mappingFile = cfg.mappingFile || '/data/ma-cue-mapping.json';
flow.set('ma_cue_cfg', cfg);
node.status({ fill: 'green', shape: 'dot', text: 'Config loaded' });
msg.filename = cfg.mappingFile;
return msg;