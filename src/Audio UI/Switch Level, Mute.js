// Route audio commands: setLevel → output 1, mute/unmute → output 2
const action = msg?.payload?.action;

if (action === 'audio.setLevel') {
  return [msg, null];
}

if (action === 'audio.mute' || action === 'audio.unmute') {
  return [null, msg];
}

return [null, null];