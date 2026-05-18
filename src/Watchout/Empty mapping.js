// Mapping file missing — start with empty mapping
flow.set('watchout_mapping', {});
flow.set('watchout_pending', null);
node.warn('[Watchout] timeline-mapping.json not found — starting with empty mapping');
return null;