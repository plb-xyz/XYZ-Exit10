const device = msg.device || {};
const body = msg.payload || {};

const out = {
  device: device.name,
  statusCode: msg.statusCode,
  powerState: body.PowerState,
  // if Redfish returns an error shape, show it
  error: body.error || undefined,
  odata: body['@odata.id'] || undefined
};

msg.payload = JSON.stringify(out, null, 2);
return msg;