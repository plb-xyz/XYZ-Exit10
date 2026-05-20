<template>
  <div class="mixer-container">
    <button class="link-all-btn" @click="toggleLinkAll" :class="{ linked: linkAll }">
      🔗 LINK ATRIUMS
    </button>

    <div class="mixer-content">
      <div class="mixer-group">
        <div class="group-title">Playback</div>
        <div class="mixer-strips">
          <div class="channel-strip">
            <div class="fader-wrapper">
              <input type="range" min="-60" max="10" v-model.number="channels.show.value" class="vertical-fader" @input="updateLevel('show')" />
            </div>
            <div class="channel-label">Show</div>
            <div class="channel-level">{{ channels.show.value }} dB</div>
            <button class="mute-btn" @click="toggleMute('show')" :class="{ muted: mutedChannels.show }">
              {{ mutedChannels.show ? 'MUTED' : 'ON' }}
            </button>
          </div>

          <div class="channel-strip">
            <div class="fader-wrapper">
              <input type="range" min="-60" max="10" v-model.number="channels.bgm.value" class="vertical-fader" @input="updateLevel('bgm')" />
            </div>
            <div class="channel-label">BGM</div>
            <div class="channel-level">{{ channels.bgm.value }} dB</div>
            <button class="mute-btn" @click="toggleMute('bgm')" :class="{ muted: mutedChannels.bgm }">
              {{ mutedChannels.bgm ? 'MUTED' : 'ON' }}
            </button>
          </div>

          <div class="channel-strip">
            <div class="fader-wrapper">
              <input type="range" min="-60" max="10" v-model.number="channels.special.value" class="vertical-fader" @input="updateLevel('special')" />
            </div>
            <div class="channel-label">Special</div>
            <div class="channel-level">{{ channels.special.value }} dB</div>
            <button class="mute-btn" @click="toggleMute('special')" :class="{ muted: mutedChannels.special }">
              {{ mutedChannels.special ? 'MUTED' : 'ON' }}
            </button>
          </div>
        </div>
      </div>

      <div class="mixer-group">
        <div class="group-title">Live</div>
        <div class="mixer-strips">
          <div class="channel-strip">
            <div class="fader-wrapper">
              <input type="range" min="-60" max="10" v-model.number="channels.mic1.value" class="vertical-fader" @input="updateLevel('mic1')" />
            </div>
            <div class="channel-label">Mic 1</div>
            <div class="channel-level">{{ channels.mic1.value }} dB</div>
            <button class="mute-btn" @click="toggleMute('mic1')" :class="{ muted: mutedChannels.mic1 }">
              {{ mutedChannels.mic1 ? 'MUTED' : 'ON' }}
            </button>
          </div>

          <div class="channel-strip">
            <div class="fader-wrapper">
              <input type="range" min="-60" max="10" v-model.number="channels.mic2.value" class="vertical-fader" @input="updateLevel('mic2')" />
            </div>
            <div class="channel-label">Mic 2</div>
            <div class="channel-level">{{ channels.mic2.value }} dB</div>
            <button class="mute-btn" @click="toggleMute('mic2')" :class="{ muted: mutedChannels.mic2 }">
              {{ mutedChannels.mic2 ? 'MUTED' : 'ON' }}
            </button>
          </div>

          <div class="channel-strip">
            <div class="fader-wrapper">
              <input type="range" min="-60" max="10" v-model.number="channels.mixer.value" class="vertical-fader" @input="updateLevel('mixer')" />
            </div>
            <div class="channel-label">Mixer</div>
            <div class="channel-level">{{ channels.mixer.value }} dB</div>
            <button class="mute-btn" @click="toggleMute('mixer')" :class="{ muted: mutedChannels.mixer }">
              {{ mutedChannels.mixer ? 'MUTED' : 'ON' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      space: 'a3',
      linkAll: false,
      channels: {
        show: { value: 0 },
        bgm: { value: -20 },
        special: { value: -20 },
        mic1: { value: -10 },
        mic2: { value: -10 },
        mixer: { value: -10 }
      },
      mutedChannels: {
        show: false,
        bgm: false,
        special: false,
        mic1: true,
        mic2: true,
        mixer: true
      },
      linkedChannels: {
        show: false,
        bgm: false,
        special: false,
        mic1: false,
        mic2: false,
        mixer: false
      },
      _lastValues: {}
    };
  },
  methods: {
    applyMsg(msg) {
      const p = msg?.payload;
      if (!p) return;

      const channel = p.channel;
      const targetSpace = p.space || p.targetSpace;
      if (targetSpace && targetSpace !== this.space) return;

      if (p.setLinkedAll !== undefined) {
        this.linkAll = p.setLinkedAll;
        Object.keys(this.linkedChannels).forEach(ch => (this.linkedChannels[ch] = p.setLinkedAll));
      }
      if (p.setLinked !== undefined) this.linkedChannels[channel] = p.setLinked;
      if (p.delta !== undefined) this.applyLinkedFaderDelta(channel, p.delta);
      if (p.muted !== undefined) this.applyLinkedMute(channel, p.muted);
    },

    toggleLinkAll() {
      this.linkAll = !this.linkAll;
      Object.keys(this.linkedChannels).forEach(ch => (this.linkedChannels[ch] = this.linkAll));
      this.send({ topic: 'audio.linkAll', payload: { space: this.space, linked: this.linkAll } });
    },

    updateLevel(channel) {
      const newValue = this.channels[channel].value;
      const oldValue = this._lastValues[channel] ?? newValue;
      const delta = newValue - oldValue;

      this._lastValues[channel] = newValue;

      this.send({ topic: 'cmd', payload: { v: 1, source: 'ui', target: `${this.space}.audio`, action: 'audio.setLevel', params: { inputKey: channel, db: newValue } } });

      if (this.linkedChannels[channel]) {
        this.send({
          topic: 'audio.faderSync',
          payload: { sourceSpace: this.space, channel, delta }
        });
      }
    },

    applyLinkedFaderDelta(channel, delta) {
      const newValue = Math.max(-60, Math.min(10, this.channels[channel].value + delta));
      this.channels[channel].value = newValue;
      this._lastValues[channel] = newValue;
      this.send({ topic: 'cmd', payload: { v: 1, source: 'ui', target: `${this.space}.audio`, action: 'audio.setLevel', params: { inputKey: channel, db: newValue } } });
    },

    toggleMute(channel) {
      this.mutedChannels[channel] = !this.mutedChannels[channel];
      this.sendMuteCmd(channel);

      if (this.linkedChannels[channel]) {
        this.send({
          topic: 'audio.muteSync',
          payload: { space: this.space, channel, muted: this.mutedChannels[channel] }
        });
      }
    },

    applyLinkedMute(channel, muteState) {
      this.mutedChannels[channel] = muteState;
      this.sendMuteCmd(channel);
    },

    sendMuteCmd(channel) {
      const action = this.mutedChannels[channel] ? 'audio.mute' : 'audio.unmute';
      this.send({ topic: 'cmd', payload: { v: 1, source: 'ui', target: `${this.space}.audio`, action, params: { inputKey: channel } } });
    }
  },
  mounted() {
    this.$watch(() => this.msg, m => this.applyMsg(m), { deep: true, immediate: true });
  }
};
</script>

<style scoped>
.link-all-btn{width:100%;margin-bottom:12px;padding:10px 12px;font-weight:700;border-radius:6px;border:2px solid #64748b;background:#334155;color:#cbd5e1;cursor:pointer;}
.link-all-btn.linked{background:linear-gradient(135deg,#0891b2 0%,#06b6d4 100%);border-color:#0ea5e9;color:#fff;}
.mixer-container{display:flex;flex-direction:column;height:100%;background:linear-gradient(135deg,#1a1d2e 0%,#16192b 100%);padding:16px;border-radius:8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;color:#e0e0e0;}
.mixer-content{display:flex;flex-direction:row;gap:40px;flex:1;min-height:0;justify-content:flex-start;}
.mixer-group{display:flex;flex-direction:column;gap:12px;flex:1 1 0;min-width:0;}
.group-title{font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#7dd3fc;padding-bottom:4px;border-bottom:2px solid #0891b2;width:100%;}
.mixer-strips{display:flex;gap:16px;flex:1;min-height:0;justify-content:space-between;align-items:stretch;}
.channel-strip{display:flex;flex-direction:column;align-items:center;gap:6px;flex:1 1 0;min-width:0;}
.fader-wrapper{flex:1;min-height:300px;height:100%;width:100%;display:flex;align-items:center;justify-content:center;}
.vertical-fader{-webkit-appearance:slider-vertical;appearance:slider-vertical;width:100%;max-width:28px;height:100%;min-height:300px;background:linear-gradient(to right,#3a4050 0%,#4a5060 50%,#3a4050 100%);outline:none;cursor:pointer;border-radius:10px;}
.channel-label{font-size:14px;font-weight:600;text-transform:uppercase;letter-spacing:.5px;text-align:center;min-height:20px;}
.channel-level{font-size:12px;color:#7dd3fc;font-weight:500;text-align:center;min-height:18px;font-family:'Monaco','Courier New',monospace;}
.mute-btn{width:100%;padding:8px 6px;background:linear-gradient(135deg,#365a40 0%,#15803d 100%);color:#86efac;border:2px solid #22c55e;border-radius:4px;font-weight:600;font-size:12px;cursor:pointer;text-transform:uppercase;letter-spacing:.5px;transition:all .2s ease;min-height:44px;display:flex;align-items:center;justify-content:center;min-width:80px;}
.mute-btn.muted{background:linear-gradient(135deg,#7f1d1d 0%,#991b1b 100%);border-color:#dc2626;color:#fecaca;}

/* Optional but recommended */
@media (max-width: 900px){
  .mixer-strips{ gap:10px; }
  .vertical-fader{ max-width:22px; }
  .mute-btn{ min-width:70px; }
}
</style>