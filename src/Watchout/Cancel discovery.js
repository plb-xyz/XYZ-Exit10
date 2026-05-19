// Cancel pending discovery
flow.set('watchout_pending', null);
node.send({ payload: { status: 'cancelled' }, topic: 'watchout/cancel' });
return null;