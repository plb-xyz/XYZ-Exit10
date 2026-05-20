'use strict';
var mapping = global.get('ma_cue_mapping') || { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} };
msg.topic = 'ma/cue-map/updated';
msg.payload = mapping;
return msg;
