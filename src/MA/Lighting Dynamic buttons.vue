<template>
  <div style="padding:12px;color:#e0e0e0">
    <div v-if="!model" style="color:#888;font-style:italic">
      Loading lighting presets...
    </div>

    <div v-else style="display:flex;flex-direction:column;gap:14px">

      <!-- All Atriums -->
      <div style="background:#1b1b2e;border:1px solid #333344;border-radius:6px;padding:12px">
        <div style="color:#80cbc4;font-weight:700;margin-bottom:10px">All Atriums</div>

        <div v-if="model.allAtriums.length === 0" style="color:#777;font-style:italic">
          No shared labels across Atrium 1/2/3 yet.
        </div>

        <div v-else style="display:flex;flex-wrap:wrap;gap:10px">
          <button
            v-for="btn in model.allAtriums"
            :key="'all-' + btn.labelId"
            @click="fireMany(btn)"
            :title="'Fire in: ' + btn.spaces.join(', ')"
            style="background:#2d3a4a;color:#80cbc4;border:1px solid #80cbc4;
                   padding:10px 14px;border-radius:6px;cursor:pointer;min-width:140px">
            {{ btn.displayName }}
          </button>
        </div>
      </div>

      <!-- Per-space sections: Atrium 1/2/3 + Landscape -->
      <div v-for="sec in spaceSections" :key="sec.space"
           style="background:#1b1b2e;border:1px solid #333344;border-radius:6px;padding:12px">
        <div style="color:#80cbc4;font-weight:700;margin-bottom:10px">{{ sec.title }}</div>

        <div v-if="sec.buttons.length === 0" style="color:#777;font-style:italic">
          No cues mapped for {{ sec.title }}.
        </div>

        <div v-else style="display:flex;flex-wrap:wrap;gap:10px">
          <button
            v-for="btn in sec.buttons"
            :key="sec.space + '-' + btn.labelId"
            @click="fireOne(sec.space, btn.labelId)"
            style="background:#1e3a1e;color:#81c784;border:1px solid #81c784;
                   padding:10px 14px;border-radius:6px;cursor:pointer;min-width:140px">
            {{ btn.displayName }}
          </button>
        </div>
      </div>

      <!-- Commands section -->
      <div style="background:#1b1b2e;border:1px solid #333344;border-radius:6px;padding:12px">
        <div style="color:#ffb74d;font-weight:700;margin-bottom:10px">Commands</div>

        <div v-if="!model.sections.cmd || model.sections.cmd.length === 0" style="color:#777;font-style:italic">
          No commands mapped yet.
        </div>

        <div v-else style="display:flex;flex-wrap:wrap;gap:10px">
          <button
            v-for="btn in model.sections.cmd"
            :key="'cmd-' + btn.labelId"
            @click="fireOne('cmd', btn.labelId)"
            style="background:#3a2a0e;color:#ffb74d;border:1px solid #ffb74d;
                   padding:10px 14px;border-radius:6px;cursor:pointer;min-width:140px">
            {{ btn.displayName }}
          </button>
        </div>
      </div>

      <!-- Macros section -->
      <div style="background:#1b1b2e;border:1px solid #333344;border-radius:6px;padding:12px">
        <div style="color:#64b5f6;font-weight:700;margin-bottom:10px">Macros</div>

        <div v-if="!model.sections.mx || model.sections.mx.length === 0" style="color:#777;font-style:italic">
          No macros mapped yet.
        </div>

        <div v-else style="display:flex;flex-wrap:wrap;gap:10px">
          <button
            v-for="btn in model.sections.mx"
            :key="'mx-' + btn.labelId"
            @click="fireOne('mx', btn.labelId)"
            style="background:#0e2a3a;color:#64b5f6;border:1px solid #64b5f6;
                   padding:10px 14px;border-radius:6px;cursor:pointer;min-width:140px">
            {{ btn.displayName }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<script>
export default {
  data() {
    return { model: null };
  },

  mounted() {
    this.send({ payload: { action: 'getLightingModel' } });
  },

  computed: {
    spaceSections() {
      if (!this.model || !this.model.sections) return [];
      return [
        { space: 'a1', title: 'Atrium 1',  buttons: this.model.sections.a1 || [] },
        { space: 'a2', title: 'Atrium 2',  buttons: this.model.sections.a2 || [] },
        { space: 'a3', title: 'Atrium 3',  buttons: this.model.sections.a3 || [] },
        { space: 'ls', title: 'Landscape', buttons: this.model.sections.ls || [] }
      ];
    }
  },

  watch: {
    msg: {
      handler(m) {
        if (!m) return;
        if (m.topic === 'lighting/model' && m.payload) {
          this.model = m.payload;
        }
      },
      deep: true
    }
  },

  methods: {
    fireOne(space, labelId) {
      this.send({ payload: { action: 'fire', space, labelId } });
    },
    fireMany(btn) {
      this.send({ payload: { action: 'fireMany', labelId: btn.labelId, spaces: btn.spaces } });
    }
  }
};
</script>