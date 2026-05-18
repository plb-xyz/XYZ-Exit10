const device = msg.device || {};
const kind = msg._kind || 'unknown';
const status = msg.statusCode;
const ok = (typeof status === 'number') && status >= 200 && status < 300;
const now = new Date().toLocaleString();

const ui = flow.get('idrac_ui') || {};
ui.device = device.name || ui.device;

if (kind === 'status') {
  // update power state from GET
  const body = msg.payload || {};
  if (typeof body.PowerState === 'string') ui.powerState = body.PowerState;
  ui.lastStatusUpdate = now;
  flow.set('idrac_ui', ui);

  // push UI (tile + operator panel)
  return [{payload:ui},{payload:ui}];
}

if (kind === 'command') {
  // command result panel only (avoid poll making it look like it failed)
  ui.lastCommandResult = ok ? `Accepted (${status})` : `Failed (${status || '—'})`;
  flow.set('idrac_ui', ui);

  // After any command, schedule a refresh status (separate inject below)
  return [{payload:ui},{payload:ui},{payload:'REFRESH_AFTER_COMMAND'}];
}

return [{payload:ui},{payload:ui}];