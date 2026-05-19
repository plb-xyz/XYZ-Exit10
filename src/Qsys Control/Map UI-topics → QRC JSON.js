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

const baseTopic = "ui/audio";
const t = msg.topic;
const p = msg.payload;

function makeId() {
  return Date.now() % 1000000;
}

// Parse topic
// Expected:
// ui/audio/<space>/level/<inputKey>
// ui/audio/<space>/<inputKey>Enabled
// Accept both:
// ui/audio/<space>/<inputKey>/enabled
// ui/audio/<space>/<inputKey>Enabled
const m = t.match(/^ui\/audio\/([^/]+)\/(level\/([^/]+)|([^/]+)\/enabled|([^/]+)Enabled)$/);
if (!m) return null;

const space = m[1];
const inputKey = m[3] || m[4] || m[5];
const isLevel = !!m[3];
const isEnabled = !!(m[4] || m[5]);

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

if (isLevel) {
  let val = Number(p);
  if (Number.isNaN(val)) return null;
  val = Math.max(-60, Math.min(10, val));
  req = {
    jsonrpc: "2.0",
    method: "Mixer.SetInputGain",
    params: {
      Name: mixerName,
      Inputs: inputSelector,
      Value: val
    },
    id: makeId()
  };
}

if (isEnabled) {
  const enabled = !!p;
  req = {
    jsonrpc: "2.0",
    method: "Mixer.SetInputMute",
    params: {
      Name: mixerName,
      Inputs: inputSelector,
      Value: !enabled
    },
    id: makeId()
  };
}

if (!req) return null;

msg.qrc = req;
msg.payload = JSON.stringify(req) + "\u0000";
return msg;