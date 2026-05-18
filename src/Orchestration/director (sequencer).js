// Simple sequential director.
// It emits ONE action at a time to the dispatcher.
// After each dispatch, it waits either:
// - action.waitMs (timer)
// - action.waitFor (status bus event)
// - or immediately continues.
//
// Implementation notes:
// - Uses node context to store an in-progress run.
// - Uses node.send() for async steps.
// - Listens for status events via the 'director/status' link-in.

function startRun(msg) {
  const runId = (Date.now().toString(36) + Math.random().toString(36).slice(2, 8)).toUpperCase();
  const actions = Array.isArray(msg.actions) ? msg.actions : [];

  context.set('run', {
    runId,
    idx: 0,
    actions,
    intent: msg.intent,
    startedAt: new Date().toISOString(),
    waitingFor: null
  });

  node.status({ fill: 'blue', shape: 'dot', text: `Run ${runId}: start (${actions.length} actions)` });
  emitNext();
}

function emitNext() {
  const run = context.get('run');
  if (!run) return;

  if (run.idx >= run.actions.length) {
    node.status({ fill: 'green', shape: 'dot', text: `Run ${run.runId}: done` });
    node.send({
      topic: 'orchestration/done',
      payload: { success: true, runId: run.runId, intent: run.intent, finishedAt: new Date().toISOString() }
    });
    context.set('run', null);
    return;
  }

  const action = run.actions[run.idx];
  const step = run.idx + 1;

  // Emit action to dispatcher
  const out = {
    topic: 'orchestration/dispatch',
    payload: {
      runId: run.runId,
      step,
      total: run.actions.length,
      action
    },
    intent: run.intent
  };

  node.status({ fill: 'blue', shape: 'ring', text: `Run ${run.runId}: step ${step}/${run.actions.length} (${action.type}:${action.command})` });
  node.send([out, null]);

  // Determine wait behavior
  if (action.waitFor) {
    run.waitingFor = String(action.waitFor);
    context.set('run', run);
    return; // will resume on status message
  }

  const waitMs = Number(action.waitMs || 0);
  if (waitMs > 0) {
    setTimeout(() => {
      const r = context.get('run');
      if (!r) return;
      r.idx++;
      context.set('run', r);
      emitNext();
    }, waitMs);
    return;
  }

  // Immediate
  run.idx++;
  context.set('run', run);
  emitNext();
}

function handleStatus(msg) {
  const run = context.get('run');
  if (!run) return;

  const status = msg.payload || {};
  const key = status.key || status.topic || status.name;

  if (!run.waitingFor) return;
  if (String(key) !== String(run.waitingFor)) return;

  // Resume
  run.waitingFor = null;
  run.idx++;
  context.set('run', run);
  emitNext();
}

// Two inputs into this node:
// A) normal orchestration messages with msg.actions
// B) status bus messages with msg.topic === 'director/status'

if (msg && msg.topic === 'director/status') {
  handleStatus(msg);
  return null;
}

// Start a new run
startRun(msg);
return null;