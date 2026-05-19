const devices = flow.get('idrac_devices') || {};
const selectedName = flow.get('idrac_selected_name');

if (!selectedName || !devices[selectedName]) {
  msg.payload = 'Select a computer first.';
  return [null, msg];
}

const ip = devices[selectedName];
const baseUrl = `https://${ip}`;

// buttons send either ResetType value or STATUS
const action = msg.payload;

// Basic auth header root:calvin
const auth = 'Basic ' + Buffer.from('root:calvin').toString('base64');

msg.headers = {
  'Content-Type': 'application/json',
  'Authorization': auth
};

msg.device = { name: selectedName, ip };

if (action === 'STATUS') {
  msg.method = 'GET';
  msg.url = `${baseUrl}/redfish/v1/Systems/System.Embedded.1`;
  msg.payload = null;
  return [msg, null];
}

msg.method = 'POST';
msg.url = `${baseUrl}/redfish/v1/Systems/System.Embedded.1/Actions/ComputerSystem.Reset`;
msg.payload = { ResetType: action };

return [msg, null];