<div class="mixer-container">
  <div class="mixer-content">
    <!-- PLAYBACK GROUP -->
    <div class="mixer-group">
      <div class="group-title">Playback</div>
      <div class="mixer-strips">
        <!-- Show Channel -->
        <div class="channel-strip">
          <div class="fader-wrapper">
            <input type="range" min="-60" max="10" value="0" class="vertical-fader" @input="updateLevel('show', $event)">
          </div>
          <div class="channel-label">Show</div>
          <div class="channel-level">{{ channels.show.value }} dB</div>
          <button class="mute-btn" @click="toggleMute('show')" :class="{ muted: mutedChannels.show }">{{ mutedChannels.show ? 'MUTED' : 'ON' }}</button>
        </div>

        <!-- BGM Channel -->
        <div class="channel-strip">
          <div class="fader-wrapper">
            <input type="range" min="-60" max="10" value="-20" class="vertical-fader" @input="updateLevel('bgm', $event)">
          </div>
          <div class="channel-label">BGM</div>
          <div class="channel-level">{{ channels.bgm.value }} dB</div>
          <button class="mute-btn" @click="toggleMute('bgm')" :class="{ muted: mutedChannels.bgm }">{{ mutedChannels.bgm ? 'MUTED' : 'ON' }}</button>
        </div>

        <!-- Special Channel -->
        <div class="channel-strip">
          <div class="fader-wrapper">
            <input type="range" min="-60" max="10" value="-20" class="vertical-fader" @input="updateLevel('special', $event)">
          </div>
          <div class="channel-label">Special</div>
          <div class="channel-level">{{ channels.special.value }} dB</div>
          <button class="mute-btn" @click="toggleMute('special')" :class="{ muted: mutedChannels.special }">{{ mutedChannels.special ? 'MUTED' : 'ON' }}</button>
        </div>
      </div>
    </div>

    <!-- LIVE GROUP -->
    <div class="mixer-group">
      <div class="group-title">Live</div>
      <div class="mixer-strips">
        <!-- Mic1 Channel -->
        <div class="channel-strip">
          <div class="fader-wrapper">
            <input type="range" min="-60" max="10" value="-10" class="vertical-fader" @input="updateLevel('mic1', $event)">
          </div>
          <div class="channel-label">Mic 1</div>
          <div class="channel-level">{{ channels.mic1.value }} dB</div>
          <button class="mute-btn" @click="toggleMute('mic1')" :class="{ muted: mutedChannels.mic1 }">{{ mutedChannels.mic1 ? 'MUTED' : 'ON' }}</button>
        </div>

        <!-- Mic2 Channel -->
        <div class="channel-strip">
          <div class="fader-wrapper">
            <input type="range" min="-60" max="10" value="-10" class="vertical-fader" @input="updateLevel('mic2', $event)">
          </div>
          <div class="channel-label">Mic 2</div>
          <div class="channel-level">{{ channels.mic2.value }} dB</div>
          <button class="mute-btn" @click="toggleMute('mic2')" :class="{ muted: mutedChannels.mic2 }">{{ mutedChannels.mic2 ? 'MUTED' : 'ON' }}</button>
        </div>

        <!-- Mixer Channel -->
        <div class="channel-strip">
          <div class="fader-wrapper">
            <input type="range" min="-60" max="10" value="-10" class="vertical-fader" @input="updateLevel('mixer', $event)">
          </div>
          <div class="channel-label">Mixer</div>
          <div class="channel-level">{{ channels.mixer.value }} dB</div>
          <button class="mute-btn" @click="toggleMute('mixer')" :class="{ muted: mutedChannels.mixer }">{{ mutedChannels.mixer ? 'MUTED' : 'ON' }}</button>
        </div>
      </div>
    </div>
  </div>
</div>

<style scoped>
  .mixer-container {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: linear-gradient(135deg, #1a1d2e 0%, #16192b 100%);
    padding: 16px;
    border-radius: 8px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    color: #e0e0e0;
  }

  .mixer-content {
    display: flex;
    flex-direction: row;
    gap: 40px;
    flex: 1;
    min-height: 0;
  }

  .mixer-group {
    display: flex;
    flex-direction: column;
    gap: 12px;
    flex: 1;
    min-height: 0;
  }

  .group-title {
    font-size: 13px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #7dd3fc;
    padding-bottom: 4px;
    border-bottom: 2px solid #0891b2;
  }

  .mixer-strips {
    display: flex;
    gap: 30px;
    flex: 1;
    min-height: 0;
    justify-content: flex-start;
    align-items: flex-start;
  }

  .channel-strip {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
  }

  .fader-wrapper {
    flex: 1;
    min-height: 300px;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .vertical-fader {
    -webkit-appearance: slider-vertical;
    appearance: slider-vertical;
    width: 20px;
    height: 100%;
    min-height: 300px;
    background: linear-gradient(to right, #3a4050 0%, #4a5060 50%, #3a4050 100%);
    outline: none;
    cursor: pointer;
    border-radius: 10px;
  }

  .vertical-fader::-webkit-slider-thumb {
    -webkit-appearance: slider-thumb;
    appearance: slider-thumb;
    width: 28px;
    height: 28px;
    background: radial-gradient(circle at 30% 30%, #7dd3fc, #06b6d4);
    border: 2px solid #0891b2;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }

  .vertical-fader::-webkit-slider-thumb:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
  }

  .vertical-fader::-moz-range-thumb {
    width: 28px;
    height: 28px;
    background: radial-gradient(circle at 30% 30%, #7dd3fc, #06b6d4);
    border: 2px solid #0891b2;
    border-radius: 50%;
    cursor: pointer;
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  }

  .vertical-fader::-moz-range-thumb:hover {
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.6);
  }

  .vertical-fader::-moz-range-track {
    background: transparent;
    border: none;
  }

  .channel-label {
    font-size: 14px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    text-align: center;
    min-height: 20px;
  }

  .channel-level {
    font-size: 12px;
    color: #7dd3fc;
    font-weight: 500;
    text-align: center;
    min-height: 18px;
    font-family: 'Monaco', 'Courier New', monospace;
  }

  .mute-btn {
    width: 100%;
    padding: 8px 6px;
    background: linear-gradient(135deg, #365a40 0%, #15803d 100%);
    color: #86efac;
    border: 2px solid #22c55e;
    border-radius: 4px;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    transition: all 0.2s ease;
    min-height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    min-width: 80px;
  }

  .mute-btn:hover:not(.muted) {
    background: linear-gradient(135deg, #15803d 0%, #16a34a 100%);
    border-color: #4ade80;
    box-shadow: 0 0 12px rgba(220, 38, 38, 0.3);
  }

  .mute-btn:active:not(.muted) {
    transform: scale(0.95);
  }

  .mute-btn.muted {
    background: linear-gradient(135deg, #7f1d1d 0%, #991b1b 100%);
    border-color: #dc2626;
    color: #fecaca;
  }

  .mute-btn.muted:hover {
    background: linear-gradient(135deg, #991b1b 0%, #b91c1c 100%);
    box-shadow: 0 0 12px rgba(34, 197, 94, 0.3);
  }

  @media (max-width: 768px) {
    .mixer-content {
      flex-direction: column;
      gap: 20px;
    }

    .mixer-strips {
      gap: 20px;
    }

    .fader-wrapper {
      min-height: 240px;
    }

    .vertical-fader {
      width: 18px;
      min-height: 240px;
    }

    .vertical-fader::-webkit-slider-thumb {
      width: 24px;
      height: 24px;
    }

    .vertical-fader::-moz-range-thumb {
      width: 24px;
      height: 24px;
    }

    .mute-btn {
      min-height: 40px;
      font-size: 11px;
      min-width: 70px;
    }
  }
</style>

<script>
  export default {
    data() {
      return {
        space: 'ls',
        channels: {
          show: { value: 0 },
          bgm: { value: -20 },
          special: { value: -20 },
          mic1: { value: -10 },
          mic2: { value: -10 },
          mixer: { value: -10 }
        },
        mutedChannels: {
          show: true,
          bgm: true,
          special: true,
          mic1: false,
          mic2: false,
          mixer: false
        }
      };
    },
    methods: {
      applyMsg(msg) {
        const p = msg?.payload;
        if (!p) return;

        // audio.init — seed display from Q-SYS state on connect, no echo back
        if (msg.topic === 'audio.init') {
          if (!p.space || p.space === this.space) this.applyInitialState(p);
          return;
        }
      },

      applyInitialState(state) {
        if (state.channels) {
          for (const [ch, val] of Object.entries(state.channels)) {
            if (this.channels[ch] !== undefined)
              this.channels[ch].value = Math.max(-60, Math.min(10, val));
          }
        }
        if (state.mutes) {
          for (const [ch, muted] of Object.entries(state.mutes)) {
            if (this.mutedChannels[ch] !== undefined)
              this.mutedChannels[ch] = muted;
          }
        }
      },

      updateLevel(channel, event) {
        const value = parseInt(event.target.value);
        this.channels[channel].value = value;
        this.send({ topic: 'cmd', payload: { v: 1, source: 'ui', target: 'ls.audio', action: 'audio.setLevel', params: { inputKey: channel, db: value } } });
      },
      toggleMute(channel) {
        this.mutedChannels[channel] = !this.mutedChannels[channel];
        const action = this.mutedChannels[channel] ? 'audio.mute' : 'audio.unmute';
        this.send({ topic: 'cmd', payload: { v: 1, source: 'ui', target: 'ls.audio', action, params: { inputKey: channel } } });
      }
    },
    mounted() {
      this.$watch(() => this.msg, m => this.applyMsg(m), { deep: true, immediate: true });
    }
  };
</script>