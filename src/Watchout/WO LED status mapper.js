// Input can be:
// - msg.watchout_sse_status
// - msg.payload.status
// - or read from flow context
const raw =
  msg.watchout_sse_status ||
  msg.payload?.watchout_sse_status ||
  flow.get("watchout_sse_status");

let state = "disconnected";
if (raw === "connected") state = "connected";
else if (raw === "disconnected") state = "disconnected";
else if (raw === "error") state = "error";
else if (raw === "connecting") state = "connecting"; // if you add this in your flow

msg.payload = {
  state,
  label: "Watchout",
  layout: "row",
};

return msg;