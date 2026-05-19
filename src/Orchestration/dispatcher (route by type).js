// Routes each action to the proper subsystem.
// Input:
//   msg.payload = { runId, step, total, action }
// Output 1: watchout
// Output 2: ma
// Output 3: qsys
// Output 4: pharos
// Output 5: status/debug

const p = msg.payload || {};
const action = (p.action || {});

if (!action.type) {
  msg.payload = { error: 'Action missing type', p };
  return [null, null, null, null, msg];
}

const t = String(action.type).toLowerCase();

// Pass along run metadata for logging
msg.run = { runId: p.runId, step: p.step, total: p.total };

if (t === 'watchout') return [msg, null, null, null, null];
if (t === 'ma')       return [null, msg, null, null, null];
if (t === 'qsys')     return [null, null, msg, null, null];
if (t === 'pharos')   return [null, null, null, msg, null];

msg.payload = { error: 'Unknown action.type: ' + action.type, p };
return [null, null, null, null, msg];