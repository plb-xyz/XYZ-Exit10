const devices = flow.get('idrac_devices') || {};
const name = flow.get('idrac_selected_name');
if (!name || !devices[name]) return null;

const ip = devices[name];
const auth = 'Basic ' + Buffer.from('root:calvin').toString('base64');

const resetType = msg.payload; // On / GracefulShutdown / ForceOff / ForceRestart

// Update operator UI model (no flip-flop from polling)
const ui = flow.get('idrac_ui') || {};
ui.device = name;
ui.lastCommand = friendly(resetType);
ui.lastCommandResult = 'Sending…';
flow.set('idrac_ui', ui);
node.send([{payload: ui},{payload: ui}]);

msg.method = 'POST';
msg.url = `https://${ip}/redfish/v1/Systems/System.Embedded.1/Actions/ComputerSystem.Reset`;
msg.headers = { 'Authorization': auth, 'Content-Type': 'application/json' };
msg.payload = { ResetType: resetType };
msg.device = { name, ip };
msg._kind = 'command';
msg._resetType = resetType;
return msg;

function friendly(rt){
  if (rt==='On') return 'Power On';
  if (rt==='GracefulShutdown') return 'Shutdown (Graceful)';
  if (rt==='ForceOff') return 'Power Off (Hard)';
  if (rt==='ForceRestart') return 'Reboot (Hard)';
  return rt;
}