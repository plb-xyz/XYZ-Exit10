// Build ui-dropdown options for the cues of the currently selected timeline.
// Triggered when the timeline selection changes or the mapping refreshes.

const mapping = flow.get('watchout_mapping') || {};
const timelineKey = flow.get('watchout_selected_timelineKey') || '';

const entry = mapping[timelineKey] || {};
const cues  = entry.cues || {};

const keys = Object.keys(cues).sort((a, b) => {
    const da = cues[a] && cues[a].displayName ? String(cues[a].displayName) : a;
    const db = cues[b] && cues[b].displayName ? String(cues[b].displayName) : b;
    return da.localeCompare(db);
});

let options;
let selected;

if (keys.length === 0) {
    options  = [{ value: '', label: timelineKey ? 'No cues (run Confirm & Save)' : 'Select a timeline first' }];
    selected = '';
} else {
    options  = keys.map(key => ({
        value: key,
        label: (cues[key].displayName || key) + ' [id ' + cues[key].watchoutCueId + ']'
    }));
    // Keep previous selection when possible
    const prev = flow.get('watchout_selected_cueKey');
    selected = (prev && cues[prev]) ? prev : options[0].value;
}

flow.set('watchout_selected_cueKey', selected);

msg.options  = options;
msg.payload  = selected;

node.status({ fill: keys.length ? 'green' : 'grey', shape: 'dot',
              text: timelineKey ? (keys.length + ' cues for ' + timelineKey) : 'no timeline' });
return msg;