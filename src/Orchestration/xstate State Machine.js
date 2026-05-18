// ─── Get the running actor ─────────────────────────────────────────────────
const actor = flow.get('xstate_actor');

if (!actor) {
    node.warn("State machine actor not ready — redeploy to restart");
    return null;
}

// ─── Accept event in multiple formats ─────────────────────────────────────
// Format A: msg.payload = { "event": "Trans to Normal" }
// Format B: msg.payload = { "type": "Trans to Normal" }  (XState native)
// Format C: msg.payload = "Trans to Normal"  (plain string)
// Format D: msg.topic   = "Trans to Normal"  (topic as event)

let eventType = null;

if (typeof msg.payload === "string") {
    eventType = msg.payload;
} else if (msg.payload && msg.payload.event) {
    eventType = msg.payload.event;
} else if (msg.payload && msg.payload.type) {
    eventType = msg.payload.type;
} else if (msg.topic) {
    eventType = msg.topic;
}

if (!eventType) {
    node.warn("No event found in msg — expected msg.payload.event, msg.payload, or msg.topic");
    return null;
}

// ─── Send the event to the actor ──────────────────────────────────────────
// The actor's subscribe() will fire automatically if a transition occurs
const before = actor.getSnapshot().value;
actor.send({ type: eventType });
const after = actor.getSnapshot().value;

// ─── Log ignored events (no transition occurred) ──────────────────────────
if (JSON.stringify(before) === JSON.stringify(after)) {
    node.warn(`Event "${eventType}" had no effect in state: ${JSON.stringify(before)}`);
}

// subscribe() handles output — nothing to return here
return null;