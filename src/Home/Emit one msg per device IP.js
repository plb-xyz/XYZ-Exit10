const devices = flow.get('ping_devices') || [];
if (!Array.isArray(devices) || devices.length === 0) return null;

// node-red-node-ping Triggered mode supports array in msg.payload
// each object must have at least .host; extra fields are returned in msg.ping
msg.payload = devices.map(d => ({
    host: d.ip,
    name: d.name,
    ip: d.ip
    // optional timeout: 3000
}));

return msg;