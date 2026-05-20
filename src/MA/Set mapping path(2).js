// After writing default config, continue to mapping read
var cfg = flow.get('ma_cue_cfg') || {};
msg.filename = cfg.mappingFile || '/data/ma-cue-mapping.json';
return msg;