// Any status message that should unblock waits should be sent here.
// Expected payload shape example:
//   { key: 'qsys-ready', ok: true }
// This node forwards to the director with msg.topic='director/status'.

msg.topic = 'director/status';
return msg;