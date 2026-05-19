const devices = flow.get('idrac_devices') || {};
const names = Object.keys(devices).sort((a,b) => a.localeCompare(b));

// Dashboard 2.0 ui-dropdown expects msg.options as array of {label,value}
msg.options = names.map(n => ({ label: n, value: n }));

// Optionally set a default selection in the widget using msg.payload
msg.payload = flow.get('idrac_selected_name') || (names[0] || '');
return msg;