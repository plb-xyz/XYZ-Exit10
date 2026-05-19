// In array-trigger mode, ping node emits one msg per target
// and includes original object under msg.ping (per node help).

const p = msg.ping || {};
const name = p.name || p.host || "unknown_device";
const ip = p.ip || p.host || "";
const rtt = (typeof msg.payload === "number" && isFinite(msg.payload)) ? msg.payload : null;
const status = (rtt !== null) ? "connected" : "disconnected";

// snapshot state
let snapshot = flow.get("ping_snapshot") || {};
snapshot[name] = status;
flow.set("ping_snapshot", snapshot);

// Output 1: per-device
const perDevice = {
    topic: `ping/status/${name}`,
    payload: { [name]: status },
    ip,
    name,
    status,
    rtt
};

// Output 2: full snapshot
const full = {
    topic: "ping/status/all",
    payload: snapshot
};

return [perDevice, full];