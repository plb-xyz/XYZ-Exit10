/*
Collect domain dropdown values in flow context and emit a single semantic intent.

Emits:
  topic: ui/audio/setPlaybackDomain
  payload: { domain, active, bgmId }

Also supports:
  topic: ui/audio/setPlaybackAllDomainsShow
  payload: { active: 'SHOW' }
*/

const t = msg.topic;

if (t === 'ui/audio/forceShow') {
  return {
    topic: 'ui/audio/setPlaybackAllDomainsShow',
    payload: { active: 'SHOW', requestedAt: new Date().toISOString(), requestedBy: 'ui' }
  };
}

function getDomainFromTopic(topic) {
  const m = topic.match(/^ui\/audio\/domain\/(inside|landscape)\/(active|bgmId)$/);
  return m ? { domain: m[1], field: m[2] } : null;
}

const info = getDomainFromTopic(t);
if (!info) return null;

const key = `audio_domain_${info.domain}`;
const state = flow.get(key) || { active: 'BGM', bgmId: 'bg_music_1' };
state[info.field] = msg.payload;
flow.set(key, state);

return {
  topic: 'ui/audio/setPlaybackDomain',
  payload: {
    domain: info.domain,
    active: state.active,
    bgmId: state.bgmId,
    requestedAt: new Date().toISOString(),
    requestedBy: 'ui'
  }
};
