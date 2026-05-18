// After writing default config, continue to mapping read
const cfg = flow.get('watchout_config') || {};
msg.filename = cfg.mappingFile || '/projects/XYZ-Exit10/node-red/data/timeline-mapping.json';
return msg;