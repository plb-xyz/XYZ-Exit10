// Build the HTTP GET request for /v0/timelines
const cfg  = flow.get('watchout_config') || {};
const host = cfg.host || 'localhost';
const port = cfg.port || 3019;
msg.method  = 'GET';
msg.url     = 'http://' + host + ':' + port + '/v0/timelines';
msg.headers = { 'Content-Type': 'application/json' };
return msg;