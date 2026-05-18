// Split QRC stream payload into individual JSON strings
let s = msg.payload;

// If payload is a Buffer, convert it
if (Buffer.isBuffer(s)) s = s.toString("utf8");

// Split on null terminator and emit one message per JSON string
const parts = s.split("\u0000").filter(p => p.trim().length);

return parts.map(p => ({
  ...msg,
  payload: p
}));