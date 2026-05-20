const sourceSpace = msg.payload.space;
const channel = msg.payload.channel;
const muteState = msg.payload.muted;

let linkedChannels = flow.get('linkedChannels') || {};
const spaceStates = linkedChannels[channel] || {};
const allASpaces = ['a1','a2','a3'];

const targets = allASpaces.filter(s => spaceStates[s] && s !== sourceSpace);
if (targets.length === 0) return null;

targets.forEach(targetSpace => {
  node.send({ topic: 'audio.muteDelta', payload: { targetSpace, channel, muted: muteState } });
});
node.status({ fill:'green', shape:'dot', text:`${channel}: ${muteState ? 'muted' : 'unmuted'}` });