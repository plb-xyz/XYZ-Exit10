// Parse QRC State Response
// Converts Component.GetControls responses from Q-SYS into audio.init messages
// that the mixer UI components use to seed their display on connect.
//
// Wire: [Parse QRC Buffer output 1] → this node → [link out to mixer ui_template inputs]
// Only Component.GetControls responses pass through; all others return null (dropped).

// Input channel number → inputKey mapping
// Must match the inputsShared table in "Map cmd envelope → QRC JSON.js"
const inputsShared = {
  special: [1, 2],
  bgm:     [3, 4],
  show:    [5, 6, 7, 8],
  mic1:    [9],
  mic2:    [10],
  mixer:   [11, 12]
};

// Build reverse map: channel number → inputKey
const channelToKey = {};
for (const [key, chs] of Object.entries(inputsShared)) {
  for (const ch of chs) {
    channelToKey[ch] = key;
  }
}

let resp;
try {
  resp = JSON.parse(msg.payload);
} catch (e) {
  return null; // not valid JSON (shouldn't happen after Parse QRC Buffer, but be safe)
}

// Only handle Component.GetControls success responses
if (!resp.result || !resp.result.Name || !Array.isArray(resp.result.Controls)) {
  return null;
}

const space = resp.result.Name;
const controls = resp.result.Controls;
const channels = {};
const mutes = {};

for (const ctrl of controls) {
  // Q-SYS Mixer component control naming: "input.gain.X" and "input.mute.X"
  const gainMatch = ctrl.Name.match(/^input\.gain\.(\d+)$/);
  const muteMatch = ctrl.Name.match(/^input\.mute\.(\d+)$/);

  if (gainMatch) {
    const chNum = parseInt(gainMatch[1]);
    const key = channelToKey[chNum];
    if (key !== undefined && channels[key] === undefined) {
      // Use first channel of each key; round to 1 decimal
      channels[key] = Math.round(ctrl.Value * 10) / 10;
    }
  }

  if (muteMatch) {
    const chNum = parseInt(muteMatch[1]);
    const key = channelToKey[chNum];
    if (key !== undefined && mutes[key] === undefined) {
      mutes[key] = Boolean(ctrl.Value);
    }
  }
}

if (Object.keys(channels).length === 0 && Object.keys(mutes).length === 0) {
  return null; // no recognised controls in the response
}

node.status({ fill: 'blue', shape: 'dot', text: `init ${space}: ${Object.keys(channels).length} ch` });

return {
  topic: 'audio.init',
  payload: { space, channels, mutes }
};
