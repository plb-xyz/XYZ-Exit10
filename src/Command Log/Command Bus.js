// Command Bus — tap/filter node
// Place after a link-out that taps the main cmd bus.
// Passes through only valid cmd envelopes; drops everything else.
// Output wires to the Command Log ui_template node.

if (msg.topic !== 'cmd' || !msg?.payload?.action) return null;
return msg;