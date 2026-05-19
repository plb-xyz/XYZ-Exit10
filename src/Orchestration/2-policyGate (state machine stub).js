// Policy/state-machine gate.
// Decides whether the intent is allowed, and (optionally) modifies intent.
//
// This is intentionally simple: it demonstrates the architectural split.
// Replace with your real rules (prayer lockout, mode ownership, etc.) later.
//
// Inputs:
//   msg.intent = { action, key, target, cueName, source, ts }
// Outputs:
//   output 1 (allowed): msg.intent (unchanged), continue
//   output 2 (blocked): msg.payload = { error, intent }

const intent = msg.intent || {};

// Example system state variables (you can set these from elsewhere)
const systemMode = flow.get('system_mode') || 'AUTO'; // AUTO|EVENT|MAINT
const prayerLockout = flow.get('prayer_lockout') || false;

// Simple block rules
if (systemMode === 'EVENT') {
  msg.payload = { error: 'Blocked: system_mode=EVENT', intent };
  return [null, msg];
}

// Example: block show starts during prayer
if (prayerLockout && String(intent.action || '').toLowerCase() === 'start' && String(intent.key || '').startsWith('show_')) {
  msg.payload = { error: 'Blocked: prayer_lockout=true (shows)', intent };
  return [null, msg];
}

// Allowed
return [msg, null];