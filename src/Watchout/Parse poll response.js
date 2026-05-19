// Handle the GET /v0/state poll response
const statusCode = msg.statusCode || 200;
if (statusCode !== 200) {
    node.warn('[Watchout Poll] HTTP ' + statusCode);
    return null;
}

const state = msg.payload;
flow.set('watchout_state', state);

// Pass downstream (and also preserve your existing wrapper shape)
msg.topic = 'watchout/state';
msg.payload = { type: 'poll', data: state };
return msg;