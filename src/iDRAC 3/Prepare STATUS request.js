const devices = flow.get('idrac_devices') || {};
const name = flow.get('idrac_selected_name');
if (!name || !devices[name]) return null;

const ip = devices[name];
const auth = 'Basic ' + Buffer.from('root:calvin').toString('base64');

msg.method = 'GET';
msg.url = `https://${ip}/redfish/v1/Systems/System.Embedded.1`;
msg.headers = { 'Authorization': auth, 'Content-Type': 'application/json' };
msg.device = { name, ip };
msg._kind = 'status';
msg.payload = null;
return msg;