// Link-All Broadcast + populate flow.linkedChannels
if (msg.topic !== 'audio.linkAll') return null;

const linked = msg.payload.linked;
const allASpaces = ['a1','a2','a3'];
const allChannels = ['show','bgm','special','mic1','mic2','mixer'];

// 1) Update flow.linkedChannels for all channels/spaces
let linkedChannels = flow.get('linkedChannels') || {};
allChannels.forEach(channel => {
  if (!linkedChannels[channel]) linkedChannels[channel] = {};
  allASpaces.forEach(space => {
    linkedChannels[channel][space] = linked;
  });
});
flow.set('linkedChannels', linkedChannels);

// 2) Broadcast to all templates so UI reflects Link-All state
allASpaces.forEach(space => {
  node.send({
    payload: { space, setLinkedAll: linked }
  });
});

node.status({ fill:'blue', shape:'dot', text:`linkAll: ${linked}` });