if (msg.action == 'getStatus') {
    msg.status = msg.payload
    msg.deviceId = env.get('device_id')
}
return msg;