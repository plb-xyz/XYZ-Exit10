'use strict';
var mapping = global.get('ma_cue_mapping') || { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} };
var data    = msg.payload || {};
var space   = data.space;
var labelId = data.labelId;

if (!mapping[space] || !mapping[space][labelId]) {
    node.warn('[MA Cue Mapper] Delete: not found: ' + space + '/' + labelId);
    return null;
}

delete mapping[space][labelId];
global.set('ma_cue_mapping', mapping);
node.log('[MA Cue Mapper] Deleted: ' + space + '/' + labelId);

var cfg = flow.get('ma_cue_cfg') || {};
msg.filename   = cfg.mappingFile || '/data/ma-cue-mapping.json';
msg.payload    = JSON.stringify(mapping, null, 2);
msg.cueMapping = mapping;
return msg;
