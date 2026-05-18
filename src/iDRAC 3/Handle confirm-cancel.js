const cmd = msg.payload;
if (cmd === 'CANCEL') {
  flow.set('idrac_pending', null);
  return [{payload:{show:false}}, null];
}
if (cmd !== 'CONFIRM') return null;

const pending = flow.get('idrac_pending');
if (!pending) return [{payload:{show:false}}, null];
if (Date.now() > pending.expires) {
  flow.set('idrac_pending', null);
  return [{payload:{show:true, text:'Confirmation expired. Click the hard action again.'}}, null];
}

// clear confirm UI
flow.set('idrac_pending', null);

// send command (reuse Prepare COMMAND by building msg.payload=ResetType)
return [{payload:{show:false}}, {payload: pending.resetType}];