// QRC Mixer Mapping — edit only the sections below
// ===============================================

// 1) Space → Mixer mapping
const spaceToMixer = {
  a1: "a1",
  a2: "a2",
  a3: "a3",
  ls: "ls"
};

// 2) Input mapping (shared across all spaces by default)
const inputsShared = {
  special: [1, 2],
  bgm: [3, 4],
  show: [5, 6, 7, 8],     // stereo
  mic1: [9],
  mic2: [10], // example: 4ch (expand as needed)
  mixer: [11, 12],
};

// 3) Optional per-space overrides (only if a space differs)
const inputsPerSpace = {
  // a2: { bgm: [7, 8] }, // example override
};

// ====== internal logic (no edits needed) ======

// Accept two shapes:
//  A) UI cmd bus:  msg.topic === 'cmd', msg.payload = { action, target, params }
//  B) Director:   msg.payload = { runId, step, total, action: { type:'qsys', command, target, params } }
let env;
if (msg.topic === 'cmd') {
  env = msg.payload || {};
} else {
  // Director-originated: unwrap the action object into the same shape
  const dirAction = (msg.payload || {}).action || {};
  if (dirAction.type !== 'qsys') return null;
  env = {
    action: dirAction.command,
    target: dirAction.target,
    params: dirAction.params || {}
  };
}

const action = env.action;
const target = env.target;
const params = env.params || {};

if (!action || typeof action !== 'string' || !action.startsWith('audio.')) return null;

// Extract space from target item id (e.g. "a1.audio" → "a1")
const space = typeof target === 'string' ? target.split('.')[0] : null;
if (!space) return null;

const inputKey = params.inputKey;
if (!inputKey) return null;

function makeId() {
  return Date.now() % 1000000;
}

const mixerName = spaceToMixer[space];
if (!mixerName) return null;

// Resolve input channels (shared + overrides)
const perSpace = inputsPerSpace[space] || {};
const channels = perSpace[inputKey] || inputsShared[inputKey];
if (!channels || !channels.length) return null;

// Build Q-SYS mixer selector string: "1", "5,6", "1-60"
const inputSelector = Array.isArray(channels)
  ? (channels.length === 1 ? `${channels[0]}` : channels.join(","))
  : `${channels}`;

let req = null;

if (action === 'audio.setLevel') {
  let val = Number(params.db);
  if (Number.isNaN(val)) return null;
  val = Math.max(-60, Math.min(10, val));
  const qrcParams = {
    Name: mixerName,
    Inputs: inputSelector,
    Value: val
  };
  if (params.ramp != null) qrcParams.Ramp = Number(params.ramp);
  req = {
    jsonrpc: "2.0",
    method: "Mixer.SetInputGain",
    params: qrcParams,
    id: makeId()
  };
}

if (action === 'audio.mute' || action === 'audio.unmute') {
  req = {
    jsonrpc: "2.0",
    method: "Mixer.SetInputMute",
    params: {
      Name: mixerName,
      Inputs: inputSelector,
      Value: action === 'audio.mute'
    },
    id: makeId()
  };
}

if (!req) return null;

msg.qrc = req;
msg.payload = JSON.stringify(req) + "\u0000";
return msg;