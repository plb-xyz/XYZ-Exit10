<template>
  <div class="led-wrap" :class="layoutClass">
    <span
      class="led"
      :class="[ledClass, blinkClass]"
      :title="text"
      aria-hidden="true"
    ></span>

    <div class="led-text">
      <div class="led-label">{{ label }}</div>
      <div class="led-state">{{ text }}</div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // state: 'connected' | 'connecting' | 'disconnected' | 'error'
      state: "disconnected",
      label: "Status",
      // layout: 'row' or 'column'
      layout: "row",
      blinkOnConnecting: true,
    };
  },
  computed: {
    ledClass() {
      if (this.state === "connected") return "led-green";
      if (this.state === "connecting") return "led-amber";
      // disconnected + error both red
      return "led-red";
    },
    text() {
      if (this.state === "connected") return "Connected";
      if (this.state === "connecting") return "Connecting…";
      if (this.state === "error") return "Error";
      return "Disconnected";
    },
    blinkClass() {
      if (this.state === "error") return "blink-fast";
      if (this.state === "connecting" && this.blinkOnConnecting) return "blink-slow";
      return "";
    },
    layoutClass() {
      return this.layout === "column" ? "layout-column" : "layout-row";
    },
  },
  methods: {
    applyMsg(msg) {
      const p = msg?.payload;

      if (typeof p === "string") {
        this.state = p;
        return;
      }

      if (p && typeof p === "object") {
        if (p.state) this.state = p.state;
        if (p.label) this.label = p.label;
        if (p.layout) this.layout = p.layout;
        if (typeof p.blinkOnConnecting === "boolean")
          this.blinkOnConnecting = p.blinkOnConnecting;
      }
    },
  },
  mounted() {
    this.$watch(
      () => this.msg,
      (msg) => this.applyMsg(msg),
      { deep: true, immediate: true }
    );
  },
};
</script>

<style>
.led-wrap {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 12px;
  background: rgba(0,0,0,0.06);
}

.layout-row { flex-direction: row; }
.layout-column { flex-direction: column; align-items: flex-start; }

.led {
  width: 18px;
  height: 18px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.25),
              0 0 0 2px rgba(0,0,0,0.12);
}

.led-green { background: #22c55e; box-shadow: 0 0 14px rgba(34,197,94,0.55), inset 0 0 0 2px rgba(255,255,255,0.25), 0 0 0 2px rgba(0,0,0,0.12); }
.led-amber { background: #f59e0b; box-shadow: 0 0 14px rgba(245,158,11,0.55), inset 0 0 0 2px rgba(255,255,255,0.25), 0 0 0 2px rgba(0,0,0,0.12); }
.led-red   { background: #ef4444; box-shadow: 0 0 14px rgba(239,68,68,0.55), inset 0 0 0 2px rgba(255,255,255,0.25), 0 0 0 2px rgba(0,0,0,0.12); }

.led-text { display: flex; flex-direction: column; line-height: 1.15; }
.led-label { font-size: 12px; opacity: 0.75; }
.led-state { font-size: 18px; font-weight: 700; }

.blink-slow { animation: blink 0.85s infinite ease-in-out; }
.blink-fast { animation: blink 0.35s infinite ease-in-out; }

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.15; }
}
</style>