// Route levels through delay, mute bypasses
const t = msg.topic || "";

if (/^ui\/audio\/[^/]+\/level\/.+/.test(t)) {
  // output 1 = level
  return [msg, null];
}

if (/^ui\/audio\/[^/]+\/[^/]+\/(enabled|Enabled)$/.test(t)) {
  // output 2 = mute
  return [null, msg];
}

return [null, null];