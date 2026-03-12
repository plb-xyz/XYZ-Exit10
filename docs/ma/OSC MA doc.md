OSC Open Sound Control to the MA

Open Sound Control, or OSC, is a client and server system that defines a message address pattern used to
address elements in the receiving server. Open Sound Control allows devices of different types to control other
devices via a peer-to-peer messaging protocol. OSC messages are human-readable, so they are more than just
numbers and strings (unlike, for example, MIDI Show Control, or MSC).

The grandMA3 software supports OSC 1.1. For more general information about OSC, e.g. OSC Packets, see
https://ccrma.stanford.edu/groups/osc/spec-1_0.html.

OSC Structure
OSC messages follow a specific pattern:
"(/prefix)/[OSC Address],[OSC Type],[Value]"

Prefix: This is optional, depending on your system setup. It can be used in a more complex OSC network to
distinguish messages intended for one set of devices (e.g., lighting consoles) from others (e.g., sound
consoles). If a prefix is specified, only OSC messages beginning with the specified prefix are processed, and
the prefix is prepended to outgoing OSC messages.

Hint:
The prefix must not contain any slashes ("/").

OSC Address: This is the target you are controlling on the receiving device(s), for example /Fader201 would be
the address to move the fader for executor 201 in grandMA3. Sometimes the address will be more complex,
for example /Page1/Fader201 would be the address to move the fader for executor 201 on page 1 in
grandMA3.

Restriction:
Only OSC messages are supported when receiving or sending an OSC
packet. OSC Bundle messages are currently not supported.

OSC Type: This is the type of value you're sending, for example:
i = integer
f = float
s = string
T = true
F = false

Value: This is the value you send to the target.

An example OSC command to set the fader for executor 201 to 100 might be:
"/Page1/Fader201,i,100"
or with a prefix to specify only, e.g. grandMA3 devices: "/gma3/Page1/Fader201,i,100"
"/cmd,s,Go+ Exec 402": Triggers executor 402

"/cmd,s,Go+ Executor <executor-number> Cue <cue-number> :"go to cue 12 on executor 2.101"
"/cmd,s,Go+ Sequence <sequence-id> Cue <cue-number>: "Go+ Sequence 5 Cue 12"
