// After writing default mapping, initialise UI
var mapping = flow.get('ma_cue_mapping') || { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} };
msg.payload = mapping;
msg.topic   = 'ma/cue-map/updated';
return msg;
