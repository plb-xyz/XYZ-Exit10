// Build a jumpToCue control payload from the currently selected timeline + cue.
// msg.payload: "goto" (paused) or "gotoPlay" (with state=play)

const action      = msg.payload;
const timelineKey = flow.get('watchout_selected_timelineKey');
const cueKey      = flow.get('watchout_selected_cueKey');

if (!timelineKey) {
    node.status({ fill: 'red', shape: 'ring', text: 'No timeline selected' });
    return null;
}
if (!cueKey) {
    node.status({ fill: 'red', shape: 'ring', text: 'No cue selected' });
    return null;
}

const cmd = { command: 'jumpToCue', timelineKey, cueKey };
if (action === 'gotoPlay') {
    cmd.state = 'play';
}

node.status({ fill: 'blue', shape: 'dot', text: action + ' ' + timelineKey + '/' + cueKey });

msg.payload = cmd;
return msg;