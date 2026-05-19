// Edit this array for your devices
const devices = [
    { name: "watchout_main",   ip: "10.154.10.41" },
    { name: "watchout_backup", ip: "10.154.10.42" },
    { name: "grandma_rpu_main",ip: "10.154.10.103" },
    { name: "grandma_rpu_backup",ip: "10.154.10.104" },
    { name: "qsys_main",       ip: "10.154.20.3" },
    { name: "qsys_backup",       ip: "10.154.20.4" },
];

flow.set('ping_devices', devices);

msg.payload = {
    configuredDevices: devices,
    count: devices.length
};
msg.topic = "ping/config";
return msg;