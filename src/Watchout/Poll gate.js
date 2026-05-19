// Only poll Watchout state when SSE is not connected (fallback mode)
if (flow.get('watchout_sse_status') === 'connected') {
    return null;
}

const cfg  = flow.get('watchout_config') || {};
const host = cfg.host || 'localhost';
const port = cfg.port || 3019;
msg.method  = 'GET';
msg.url     = 'http://' + host + ':' + port + '/v0/state';
msg.headers = { 'Content-Type': 'application/json' };
return msg;