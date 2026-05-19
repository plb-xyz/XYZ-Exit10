if (msg.action == 'getStatus') {
    flow.set('watchoutv6_status', msg.wo6status)
}
return msg;