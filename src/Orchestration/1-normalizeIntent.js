// Normalize incoming triggers into a consistent intent shape.
// Expected inputs:
// - From your UI/scheduler: msg.payload can be an object or string.
// Examples you can send in:
//   msg.payload = { kind: 'start', playableId: 'show_1' }
//   msg.payload = { playableId: 'ambience_1' }
//   msg.payload = 'show_1'
//
// Output:
//   msg.intent = { kind, playableId, scope, source }
//
// If you wire a ui-button directly, set its payload to e.g. {"playableId":"show_1"}

const now = new Date().toISOString();
const p = msg.payload;

let playableId = null;
let kind = 'start';
let scope = { spaces: ['A1','A2','A3','LAND'] }; // default global

if (typeof p === 'string') {
  playableId = p;
} else if (p && typeof p === 'object') {
  playableId = p.playableId || p.contentId || p.timelineId || p.id || null;
  if (p.kind) kind = p.kind;
  if (p.scope) scope = p.scope;
}

// Allow the link-in node name to imply playableId if payload was empty
if (!playableId) {
  if (msg._linkSourceName && msg._linkSourceName.includes('Show 1')) playableId = 'show_1';
  if (msg._linkSourceName && msg._linkSourceName.includes('Ambience 1')) playableId = 'ambience_1';
}

if (!playableId) {
  node.status({ fill: 'red', shape: 'ring', text: 'Missing playableId' });
  return null;
}

msg.intent = {
  kind,
  playableId,
  scope,
  source: msg.source || 'ui',
  ts: now
};

msg.topic = 'orchestration/intent';
return msg;