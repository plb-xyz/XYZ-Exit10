const command = msg.payload; // start|pause|stop
const timelineKey = flow.get('watchout_selected_timelineKey');

if (!timelineKey) {
    node.status({ fill: 'red', shape: 'ring', text: 'No timeline selected' });
    return null;
}

msg.payload = { command, timelineKey };
return msg;