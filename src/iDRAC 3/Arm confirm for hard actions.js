const rt = msg.payload;
const name = flow.get('idrac_selected_name') || '—';
flow.set('idrac_pending', { resetType: rt, name, expires: Date.now()+10000 });
msg.payload = {
  show: true,
  text: `Confirm ${rt === 'ForceOff' ? 'Power Off (Hard)' : 'Reboot (Hard)'} for ${name} within 10 seconds.`
};
return msg;