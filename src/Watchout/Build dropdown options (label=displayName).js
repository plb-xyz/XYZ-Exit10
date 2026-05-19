// Build ui-dropdown options from flow.watchout_mapping
// Show ONLY displayName in the dropdown, but keep value = the mapping key (timelineKey).

const mapping = flow.get('watchout_mapping') || {};

const keys = Object.keys(mapping);
keys.sort((a, b) => {
    const da = (mapping[a] && mapping[a].displayName) ? String(mapping[a].displayName) : String(a);
    const db = (mapping[b] && mapping[b].displayName) ? String(mapping[b].displayName) : String(b);
    return da.localeCompare(db);
});

const options = keys.map(key => {
    const entry = mapping[key] || {};
    const displayName = entry.displayName ? String(entry.displayName) : String(key);
    return { value: key, label: displayName };
});

// Preserve selection if possible
const current = flow.get('watchout_selected_timelineKey');
let selected = current;
if (!selected || !Object.prototype.hasOwnProperty.call(mapping, selected)) {
    selected = options.length ? options[0].value : '';
}
flow.set('watchout_selected_timelineKey', selected);

msg.options = options;
msg.payload = selected;

node.status({ fill: 'green', shape: 'dot', text: 'Options: ' + options.length });
return msg;