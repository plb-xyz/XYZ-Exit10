// name=Status Snapshot Handler (stable)
const KEY = "exit10_status_snapshot";

// UI request: reply with snapshot only
if (msg?.payload?.ui === "getSnapshot") {
    const snap = global.get(KEY) || {};
    return { payload: snap, _from: "snapshotReply" };
}

// Normal update: merge into snapshot and forward
if (msg.payload && typeof msg.payload === "object") {
    const snap = global.get(KEY) || {};

    // single {id, state, ...}
    if (msg.payload.id) {
        const { id, ...rest } = msg.payload;
        if (!snap[id] || typeof snap[id] !== "object") snap[id] = {};
        Object.assign(snap[id], rest);
    } else {
        // bulk { id1: "connected", id2: {state, meta}, ... }
        for (const [id, val] of Object.entries(msg.payload)) {
            if (val && typeof val === "object") {
                if (!snap[id] || typeof snap[id] !== "object") snap[id] = {};
                Object.assign(snap[id], val);
            } else if (typeof val === "string") {
                if (!snap[id] || typeof snap[id] !== "object") snap[id] = {};
                snap[id].state = val;
            }
        }
    }

    global.set(KEY, snap);
    return msg; // forward to UI
}

return null;