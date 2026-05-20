const sourceSpace = msg.payload.sourceSpace;
const channel = msg.payload.channel;
const delta = msg.payload.delta;

let linkedChannels = flow.get('linkedChannels') || {};
const spaceStates = linkedChannels[channel] || {};
const allASpaces = ['a1','a2','a3'];

const targets = allASpaces.filter(s => spaceStates[s] && s !== sourceSpace);
if (targets.length === 0) return null;

targets.forEach(targetSpace => {
  node.send({ topic: 'audio.faderDelta', payload: { targetSpace, channel, delta } });
});
node.status({ fill:'green', shape:'dot', text:`${channel}: delta ${delta}` });