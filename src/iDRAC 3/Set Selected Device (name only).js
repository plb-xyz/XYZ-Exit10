const name = (typeof msg.payload === 'string') ? msg.payload.trim() : '';
if (!name) return null;
flow.set('idrac_selected_name', name);

const ui = flow.get('idrac_ui') || {};
ui.device = name;
flow.set('idrac_ui', ui);

return msg;