// QRC KeepAlive
// Wire an Inject node (repeat every 25s) → this node → tcp out (Q-SYS Core)
// Prevents the Core from closing the TCP connection after 30s of silence.

const req = {
  jsonrpc: "2.0",
  method: "KeepAlive",
  params: {},
  id: Date.now() % 1000000
};

msg.payload = JSON.stringify(req) + "\u0000";
return msg;