// Mapping file missing — start with empty mapping
var emptyMapping = { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} };
global.set('ma_cue_mapping', emptyMapping);
node.warn('[MA Cue Mapper] Mapping not found — writing empty mapping');
var cfg = flow.get('ma_cue_cfg') || {};
msg.filename = cfg.mappingFile || '/data/ma-cue-mapping.json';
msg.payload  = JSON.stringify(emptyMapping, null, 2);
return msg;
