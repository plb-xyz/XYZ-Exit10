<template>
  <div class="status-board">
    <!-- SECTION 1: Status - Exit10 - Main -->
    <div class="section section-bordered">
      <button class="section-title fold-header" type="button" @click="toggleSection('systems')">
        <span class="left-title">
          <span class="chev" :class="{ open: sectionsOpen.systems }">▸</span>
          <span>Status - Exit10 - Main</span>
        </span>

        <span class="summary">
          <span
            class="led"
            :class="[ledClass(systemsSummaryState), blinkModeClass(systemsSummaryState), blinkOnOffClass(systemsSummaryState)]"
          ></span>
          <span class="state-text">{{ systemsSummaryLabel }}</span>
        </span>
      </button>

      <div v-show="sectionsOpen.systems" class="fold-body">
        <div class="system-grid">
          <div
            class="system-card"
            v-for="(sys, idx) in exit10Systems"
            :key="sys.id"
            :class="idx % 2 === 0 ? 'alt-a' : 'alt-b'"
          >
            <div class="system-title">{{ sys.title }}</div>

            <div class="endpoints">
              <div class="endpoint" v-for="ep in sys.items" :key="ep.id">
                <div class="ep-name">{{ ep.name }}</div>

                <div class="ep-indicator">
                  <span class="led" :class="[ledClass(ep.state), blinkModeClass(ep.state), blinkOnOffClass(ep.state)]"></span>
                  <span class="state-text">{{ stateText(ep.state) }}</span>
                </div>
              </div>
            </div>

            <div class="meta" v-if="sys.meta">{{ sys.meta }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- SECTION 2: Status - Exit10 - Details -->
    <div class="section section-bordered">
      <button class="section-title fold-header" type="button" @click="toggleSection('details')">
        <span class="left-title">
          <span class="chev" :class="{ open: sectionsOpen.details }">▸</span>
          <span>Status - Exit10 - Details</span>
        </span>

        <span class="summary">
          <span
            class="led"
            :class="[ledClass(detailsSummaryState), blinkModeClass(detailsSummaryState), blinkOnOffClass(detailsSummaryState)]"
          ></span>
          <span class="state-text">{{ detailsSummaryLabel }}</span>
        </span>
      </button>

      <div v-show="sectionsOpen.details" class="fold-body">
        <!-- Watchout Displays -->
        <div class="subsection">
          <button class="sub-title fold-header" type="button" @click="toggleSub('watchoutDisplays')">
            <span class="left-title">
              <span class="chev" :class="{ open: subsOpen.watchoutDisplays }">▸</span>
              <span>Watchout Displays (1–8)</span>
            </span>

            <span class="summary">
              <span class="led" :class="[ledClass(wdSummaryState), blinkModeClass(wdSummaryState), blinkOnOffClass(wdSummaryState)]"></span>
              <span class="state-text">{{ wdSummaryLabel }}</span>
            </span>
          </button>

          <div v-show="subsOpen.watchoutDisplays" class="fold-body">
            <div class="detail-grid column-major">
              <div class="detail-card" v-for="(d, idx) in watchoutDisplays" :key="d.id" :class="idx % 2 === 0 ? 'alt-a' : 'alt-b'">
                <div class="card-top">
                  <div class="name">{{ d.name }}</div>
                  <div class="indicator">
                    <span class="led" :class="[ledClass(d.state), blinkModeClass(d.state), blinkOnOffClass(d.state)]"></span>
                    <span class="state-text">{{ stateText(d.state) }}</span>
                  </div>
                </div>
                <div class="meta" v-if="d.meta">{{ d.meta }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Amps -->
        <div class="subsection">
          <button class="sub-title fold-header" type="button" @click="toggleSub('amps')">
            <span class="left-title">
              <span class="chev" :class="{ open: subsOpen.amps }">▸</span>
              <span>Amps (1–8)</span>
            </span>

            <span class="summary">
              <span class="led" :class="[ledClass(ampsSummaryState), blinkModeClass(ampsSummaryState), blinkOnOffClass(ampsSummaryState)]"></span>
              <span class="state-text">{{ ampsSummaryLabel }}</span>
            </span>
          </button>

          <div v-show="subsOpen.amps" class="fold-body">
            <div class="detail-grid column-major">
              <div class="detail-card" v-for="(a, idx) in amps" :key="a.id" :class="idx % 2 === 0 ? 'alt-a' : 'alt-b'">
                <div class="card-top">
                  <div class="name">{{ a.name }}</div>
                  <div class="indicator">
                    <span class="led" :class="[ledClass(a.state), blinkModeClass(a.state), blinkOnOffClass(a.state)]"></span>
                    <span class="state-text">{{ stateText(a.state) }}</span>
                  </div>
                </div>
                <div class="meta" v-if="a.meta">{{ a.meta }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Lighting -->
        <div class="subsection">
          <button class="sub-title fold-header" type="button" @click="toggleSub('lighting')">
            <span class="left-title">
              <span class="chev" :class="{ open: subsOpen.lighting }">▸</span>
              <span>Lighting</span>
            </span>

            <span class="summary">
              <span class="led" :class="[ledClass(lightingSummaryState), blinkModeClass(lightingSummaryState), blinkOnOffClass(lightingSummaryState)]"></span>
              <span class="state-text">{{ lightingSummaryLabel }}</span>
            </span>
          </button>

          <div v-show="subsOpen.lighting" class="fold-body">
            <div class="detail-grid column-major">
              <div class="detail-card" v-for="(l, idx) in lighting" :key="l.id" :class="idx % 2 === 0 ? 'alt-a' : 'alt-b'">
                <div class="card-top">
                  <div class="name">{{ l.name }}</div>
                  <div class="indicator">
                    <span class="led" :class="[ledClass(l.state), blinkModeClass(l.state), blinkOnOffClass(l.state)]"></span>
                    <span class="state-text">{{ stateText(l.state) }}</span>
                  </div>
                </div>
                <div class="meta" v-if="l.meta">{{ l.meta }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- Relay Panels -->
        <div class="subsection">
          <button class="sub-title fold-header" type="button" @click="toggleSub('relayPanels')">
            <span class="left-title">
              <span class="chev" :class="{ open: subsOpen.relayPanels }">▸</span>
              <span>Relay Panels</span>
            </span>

            <span class="summary">
              <span class="led" :class="[ledClass(relaySummaryState), blinkModeClass(relaySummaryState), blinkOnOffClass(relaySummaryState)]"></span>
              <span class="state-text">{{ relaySummaryLabel }}</span>
            </span>
          </button>

          <div v-show="subsOpen.relayPanels" class="fold-body">
            <div class="detail-grid column-major">
              <div class="detail-card" v-for="(rp, idx) in relayPanels" :key="rp.id" :class="idx % 2 === 0 ? 'alt-a' : 'alt-b'">
                <div class="card-top">
                  <div class="name">{{ rp.name }}</div>
                  <div class="indicator">
                    <span class="led" :class="[ledClass(rp.state), blinkModeClass(rp.state), blinkOnOffClass(rp.state)]"></span>
                    <span class="state-text">{{ stateText(rp.state) }}</span>
                  </div>
                </div>
                <div class="meta" v-if="rp.meta">{{ rp.meta }}</div>
              </div>
            </div>
          </div>
        </div>
      </div><!-- /details fold-body -->
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // blink driver
      blinkTick: 0,
      blinkTimer: null,

      sectionsOpen: { systems: true, details: false },
      subsOpen: { watchoutDisplays: false, amps: false, lighting: false, relayPanels: false },

      // Main systems (Relay Panels moved out)
      exit10Systems: [
        {
          id: "sys_watchout",
          title: "Watchout",
          items: [
            { id: "watchout_main", name: "Main", state: "disconnected" },
            { id: "watchout_backup", name: "Backup", state: "disconnected" }
          ],
          meta: ""
        },
        {
          id: "sys_grandma",
          title: "GrandMA",
          items: [
            { id: "grandma_rpu_main", name: "RPU Main", state: "disconnected" },
            { id: "grandma_rpu_backup", name: "RPU Backup", state: "disconnected" },
            { id: "grandma_npu_main", name: "NPU Main", state: "disconnected" },
            { id: "grandma_npu_backup", name: "NPU Backup", state: "disconnected" }
          ],
          meta: ""
        },
        {
          id: "sys_qsys",
          title: "Qsys",
          items: [
            { id: "qsys_main", name: "Main", state: "disconnected" },
            { id: "qsys_backup", name: "Backup", state: "disconnected" }
          ],
          meta: ""
        },
        {
          id: "sys_video_h15",
          title: "Video H15",
          items: [
            { id: "video_h15_main", name: "Main", state: "disconnected" },
            { id: "video_h15_backup", name: "Backup", state: "disconnected" }
          ],
          meta: ""
        }
      ],

      watchoutDisplays: Array.from({ length: 8 }, (_, i) => ({
        id: `wo_display_${String(i + 1).padStart(2, "0")}`,
        name: `Display ${i + 1}`,
        state: "disconnected",
        meta: ""
      })),

      amps: Array.from({ length: 8 }, (_, i) => ({
        id: `amp_${String(i + 1).padStart(2, "0")}`,
        name: `Amp ${i + 1}`,
        state: "disconnected",
        meta: ""
      })),

      lighting: [
        { id: "lighting_node_1", name: "Node 1", state: "disconnected", meta: "" },
        { id: "lighting_node_2", name: "Node 2", state: "disconnected", meta: "" },
        { id: "lighting_node_3", name: "Node 3", state: "disconnected", meta: "" },
        { id: "lighting_wisk_node_101", name: "Wisk Node 101", state: "disconnected", meta: "" },
        { id: "lighting_wisk_node_102", name: "Wisk Node 102", state: "disconnected", meta: "" }
      ],

      relayPanels: [
        { id: "relay_panel_1", name: "Panel 1", state: "disconnected", meta: "" },
        { id: "relay_panel_2", name: "Panel 2", state: "disconnected", meta: "" }
      ]
    };
  },

  computed: {
    systemsStatesFlat() {
      return this.exit10Systems.flatMap((sys) => sys.items.map((x) => x.state));
    },
    systemsSummaryState() {
      return this.worstState(this.systemsStatesFlat);
    },
    systemsSummaryLabel() {
      return this.richSummaryLabel(this.systemsStatesFlat);
    },

    detailsStatesFlat() {
      return [
        ...this.watchoutDisplays.map((x) => x.state),
        ...this.amps.map((x) => x.state),
        ...this.lighting.map((x) => x.state),
        ...this.relayPanels.map((x) => x.state)
      ];
    },
    detailsSummaryState() {
      return this.worstState(this.detailsStatesFlat);
    },
    detailsSummaryLabel() {
      return this.richSummaryLabel(this.detailsStatesFlat);
    },

    wdSummaryState() { return this.worstState(this.watchoutDisplays.map((x) => x.state)); },
    ampsSummaryState() { return this.worstState(this.amps.map((x) => x.state)); },
    lightingSummaryState() { return this.worstState(this.lighting.map((x) => x.state)); },
    relaySummaryState() { return this.worstState(this.relayPanels.map((x) => x.state)); },

    wdSummaryLabel() { return this.richSummaryLabel(this.watchoutDisplays.map((x) => x.state)); },
    ampsSummaryLabel() { return this.richSummaryLabel(this.amps.map((x) => x.state)); },
    lightingSummaryLabel() { return this.richSummaryLabel(this.lighting.map((x) => x.state)); },
    relaySummaryLabel() { return this.richSummaryLabel(this.relayPanels.map((x) => x.state)); }
  },

  methods: {
    // ---- blink driver (keeps working after page switches) ----
    startBlinkTimer() {
      if (this.blinkTimer) return;
      this.blinkTimer = setInterval(() => {
        this.blinkTick = (this.blinkTick + 1) % 1000000;
      }, 350);
    },
    stopBlinkTimer() {
      if (this.blinkTimer) clearInterval(this.blinkTimer);
      this.blinkTimer = null;
    },
    blinkModeClass(state) {
      if (state === "error") return "blink-fast";
      if (state === "connecting") return "blink-slow";
      return "";
    },
    blinkOnOffClass(state) {
      if (state !== "error" && state !== "connecting") return "";
      if (state === "error") return this.blinkTick % 2 === 0 ? "" : "blink-off";
      return Math.floor(this.blinkTick / 2) % 2 === 0 ? "" : "blink-off";
    },

    toggleSection(key) { this.sectionsOpen[key] = !this.sectionsOpen[key]; },
    toggleSub(key) { this.subsOpen[key] = !this.subsOpen[key]; },

    countStates(states) {
      const counts = { connected: 0, connecting: 0, disconnected: 0, error: 0, unknown: 0 };
      for (const s of states) {
        if (s === "connected") counts.connected++;
        else if (s === "connecting") counts.connecting++;
        else if (s === "disconnected") counts.disconnected++;
        else if (s === "error") counts.error++;
        else counts.unknown++;
      }
      return counts;
    },

    worstState(states) {
      const rank = (s) => (s === "error" ? 4 : s === "disconnected" ? 3 : s === "connecting" ? 2 : s === "connected" ? 1 : 3);
      let worst = "connected", worstRank = 0;
      for (const s of states) {
        const r = rank(s);
        if (r > worstRank) { worstRank = r; worst = s; }
      }
      return worst;
    },

    richSummaryLabel(states) {
      const n = states.length;
      const c = this.countStates(states);
      if (n === 0) return "—";
      if (c.connected === n) return `All Connected (${n}/${n})`;
      if (c.disconnected === n) return `All Offline (${n}/${n})`;
      if (c.error === n) return `All Error (${n}/${n})`;
      if (c.connecting === n) return `All Connecting (${n}/${n})`;

      const kindsPresent =
        (c.connected ? 1 : 0) +
        (c.connecting ? 1 : 0) +
        (c.disconnected ? 1 : 0) +
        (c.error ? 1 : 0) +
        (c.unknown ? 1 : 0);

      if (kindsPresent === 2 && c.connected > 0) {
        if (c.error) return `Errors (${c.error}) · ${c.connected}/${n} online`;
        if (c.disconnected) return `Offline (${c.disconnected}) · ${c.connected}/${n} online`;
        if (c.connecting) return `Connecting (${c.connecting}) · ${c.connected}/${n} online`;
      }

      const parts = [];
      if (c.connected) parts.push(`${c.connected} online`);
      if (c.connecting) parts.push(`${c.connecting} connecting`);
      if (c.disconnected) parts.push(`${c.disconnected} offline`);
      if (c.error) parts.push(`${c.error} error`);
      if (c.unknown) parts.push(`${c.unknown} unknown`);
      return `Mixed (${parts.join(", ")})`;
    },

    ledClass(state) { return state === "connected" ? "led-green" : state === "connecting" ? "led-amber" : "led-red"; },
    stateText(state) { return state === "connected" ? "Connected" : state === "connecting" ? "Connecting…" : state === "error" ? "Error" : "Disconnected"; },

    findEndpointById(id) {
      for (const sys of this.exit10Systems) {
        const ep = sys.items.find((x) => x.id === id);
        if (ep) return ep;
      }
      return (
        this.watchoutDisplays.find((x) => x.id === id) ||
        this.amps.find((x) => x.id === id) ||
        this.lighting.find((x) => x.id === id) ||
        this.relayPanels.find((x) => x.id === id) ||
        null
      );
    },

    setItem(id, patch) {
      const item = this.findEndpointById(id);
      if (!item) return false;
      if (patch.state) item.state = patch.state;
      if (typeof patch.meta === "string") item.meta = patch.meta;
      if (typeof patch.name === "string") item.name = patch.name;
      return true;
    },

    applyMsg(msg) {
      const p = msg?.payload;
      if (!p) return;

      if (typeof p === "object" && p.id) {
        this.setItem(p.id, p);
        return;
      }
      if (typeof p === "object") {
        for (const [id, val] of Object.entries(p)) {
          if (val && typeof val === "object") this.setItem(id, val);
          else if (typeof val === "string") this.setItem(id, { state: val });
        }
      }
    }
  },

  mounted() {
    this.startBlinkTimer();
    this.$watch(() => this.msg, (msg) => this.applyMsg(msg), { deep: true, immediate: true });
  },

  beforeUnmount() {
    this.stopBlinkTimer();
  }
};
</script>

<style>
.status-board {
  display: flex;
  flex-direction: column;
  gap: 22px;
}

.section {
  padding: 14px;
  border-radius: 16px;
  background: rgba(0,0,0,0.03);
}

.section-bordered {
  border: 2px solid rgba(152, 92, 255, 0.22);
}

.section-title {
  font-size: 22px;
  font-weight: 950;
  letter-spacing: 0.2px;
  margin: 0;
}

/* Foldable headers */
.fold-header {
  width: 100%;
  border: 0 !important;
  background: transparent !important;
  padding: 0 !important;
  margin: 0 0 12px 0 !important;
  cursor: pointer;

  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  gap: 12px !important;
  text-align: left;
}

.left-title {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

.fold-body {
  margin-top: 6px;
}

.chev {
  display: inline-block;
  width: 18px;
  transform: rotate(0deg);
  transition: transform 120ms ease;
  opacity: 0.85;
}
.chev.open { transform: rotate(90deg); }

.summary {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.system-grid,
.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 10px;
}

/* Collapse to 1 column on small screens */
@media (max-width: 820px) {
  .system-grid,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}

/* Column-major ordering:
   - Default (small screens / 1 column): normal row flow
   - Large screens (2 columns): fill down then across (1–4 left, 5–8 right) */
.detail-grid.column-major {
  grid-auto-flow: row;
  grid-template-rows: none;
}

@media (min-width: 821px) {
  .detail-grid.column-major {
    grid-auto-flow: column;
    grid-template-rows: repeat(4, auto);
  }
}

.subsection {
  margin-top: 18px;
  padding-top: 10px;
  border-top: 1px dashed rgba(152, 92, 255, 0.22);
}

.sub-title {
  font-size: 18px;
  font-weight: 900;
  margin: 0;
}

.alt-a { background: rgba(152, 92, 255, 0.07); }
.alt-b { background: rgba(152, 92, 255, 0.07); }

.system-card,
.detail-card {
  padding: 10px 10px;
  border-radius: 16px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04);
}

.system-title {
  font-size: 18px;
  font-weight: 900;
  margin: 2px 0 8px 2px;
}

.endpoints {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.endpoint {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 9px 10px;
  border-radius: 14px;
  background: rgba(255,255,255,0.15);
}

.ep-name {
  font-size: 14px;
  font-weight: 500;
  opacity: 0.9;
}

.ep-indicator,
.indicator {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.state-text {
  font-size: 14px;
  font-weight: 700;
}

.card-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.name {
  font-size: 14px;
  font-weight: 700;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta {
  margin-top: 6px;
  font-size: 12px;
  opacity: 0.75;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* LED */
.led {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.22),
              0 0 0 2px rgba(0,0,0,0.10);
}
.led-green {
  background: #22c55e;
  box-shadow: 0 0 12px rgba(34,197,94,0.50),
              inset 0 0 0 2px rgba(255,255,255,0.22),
              0 0 0 2px rgba(0,0,0,0.10);
}
.led-amber {
  background: #f59e0b;
  box-shadow: 0 0 12px rgba(245,158,11,0.50),
              inset 0 0 0 2px rgba(255,255,255,0.22),
              0 0 0 2px rgba(0,0,0,0.10);
}
.led-red {
  background: #ef4444;
  box-shadow: 0 0 12px rgba(239,68,68,0.50),
              inset 0 0 0 2px rgba(255,255,255,0.22),
              0 0 0 2px rgba(0,0,0,0.10);
}

/* JS-driven blink: when class is applied we "dim" the LED */
.blink-off {
  opacity: 0.15;
}
</style>