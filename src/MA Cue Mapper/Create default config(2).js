// Config file missing — create defaults
var defaultCfg = {
    "_comment": "MA Cue Mapper — Node-RED configuration",
    "mappingFile": "/data/ma-cue-mapping.json"
};
flow.set('ma_cue_cfg', defaultCfg);
node.warn('[MA Cue Mapper] Config not found — writing defaults');
msg.filename = '/config/ma-cue-mapper-config.json';
msg.payload  = JSON.stringify(defaultCfg, null, 2);
return msg;