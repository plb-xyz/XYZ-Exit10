// Normalize incoming triggers into a consistent intent shape.
// Expected inputs:
// - From your UI/scheduler: msg.payload can be an object or string.
// Examples you can send in:
//   msg.payload = { action: 'start', key: 'show_1' }
//   msg.payload = { key: 'ambience_1' }
//   msg.payload = 'show_1'
//
// Output:
//   msg.intent = { action, key, target, cueName, source }
//
// If you wire a ui-button directly, set its payload to e.g. {"key":"show_1"}

const now = new Date().toISOString();
const p = msg.payload;

let key = null;
let action = 'start';
let target = 'all';
let cueName = null;

if (typeof p === 'string') {
  key = p;
} else if (p && typeof p === 'object') {
  key = p.key || p.playableId || p.contentId || p.timelineId || p.id || (p.params && p.params.key) || null;
  if (p.action) action = p.action;
  if (!p.action && p.kind) action = p.kind;
  if (p.target) target = p.target;
  if (!p.target && p.scope) target = p.scope;
  cueName = p.cueName || p.cue || null;
}

// Allow the link-in node name to imply key if payload was empty
if (!key) {
  if (msg._linkSourceName && msg._linkSourceName.includes('Show 1')) key = 'show_1';
  if (msg._linkSourceName && msg._linkSourceName.includes('Ambience 1')) key = 'ambience_1';
}

if (!key) {
  node.status({ fill: 'red', shape: 'ring', text: 'Missing key' });
  return null;
}

msg.intent = {
  action,
  key,
  target,
  cueName,
  source: p.source || msg.source || 'ui',
  ts: now
};

msg.topic = 'orchestration/intent';
return msg;