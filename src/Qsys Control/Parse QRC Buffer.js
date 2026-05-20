// Split QRC stream payload into individual JSON strings
let s = msg.payload;

// If payload is a Buffer, convert it
if (Buffer.isBuffer(s)) s = s.toString("utf8");

// Split on null terminator and emit one message per JSON string
const parts = s.split("\u0000").filter(p => p.trim().length);

// Detect EngineStatus notification — sent by Core when TCP connection is established
// Output 2 emits a trigger message on connect so QRC Fetch Initial State can run
let connectTrigger = null;

for (const part of parts) {
  try {
    const obj = JSON.parse(part);
    if (obj.method === 'EngineStatus') {
      const state = obj.params?.State ?? 'Active';
      const platform = obj.params?.Platform ?? '';
      node.status({ fill: 'green', shape: 'dot', text: `${state} · ${platform}` });
      if (state === 'Active') {
        connectTrigger = { topic: 'qrc.connected', payload: obj.params };
      }
    } else if (obj.method === 'KeepAlive') {
      node.status({ fill: 'green', shape: 'ring', text: `keepalive ok` });
    }
  } catch (e) { /* not JSON or incomplete frame */ }
}

// Output 1: all QRC messages | Output 2: connection trigger (null if no EngineStatus)
return [
  parts.map(p => ({ ...msg, payload: p })),
  connectTrigger ? [connectTrigger] : null
];