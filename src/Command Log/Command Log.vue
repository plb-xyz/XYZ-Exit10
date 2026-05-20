<template>
  <div class="cmd-log">
    <div class="cmd-log-header">
      <span class="cmd-log-title">Command Log</span>
      <button class="cmd-log-clear" @click="entries = []">Clear</button>
    </div>
    <div class="cmd-log-list">
      <div
        v-for="(e, i) in entries"
        :key="i"
        class="cmd-log-entry"
        :class="e.source"
      >
        <span class="e-time">{{ e.time }}</span>
        <span class="e-source">{{ e.source }}</span>
        <span class="e-action">{{ e.action }}</span>
        <span class="e-arrow">→</span>
        <span class="e-target">{{ e.target }}</span>
        <span class="e-params">{{ e.params }}</span>
      </div>
      <div v-if="!entries.length" class="cmd-log-empty">No commands yet</div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      entries: []  // max 100, newest first
    };
  },
  methods: {
    applyMsg(msg) {
      const p = msg?.payload;
      if (!p?.action) return;

      const now = new Date();
      const time = now.toTimeString().slice(0, 8);
      const target = typeof p.target === 'string'
        ? p.target
        : JSON.stringify(p.target ?? '');
      const params = p.params ? JSON.stringify(p.params) : '';

      this.entries.unshift({ time, source: p.source ?? 'unknown', action: p.action, target, params });
      if (this.entries.length > 100) this.entries.length = 100;
    }
  },
  mounted() {
    this.$watch(() => this.msg, m => this.applyMsg(m), { deep: true });
  }
};
</script>

<style scoped>
.cmd-log {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #0f172a;
  color: #e2e8f0;
  font-family: 'JetBrains Mono', 'Fira Code', monospace;
  font-size: 12px;
  border-radius: 6px;
  overflow: hidden;
}
.cmd-log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: #1e293b;
  border-bottom: 1px solid #334155;
}
.cmd-log-title {
  font-weight: 700;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #94a3b8;
}
.cmd-log-clear {
  font-size: 10px;
  padding: 2px 8px;
  border: 1px solid #475569;
  border-radius: 4px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
}
.cmd-log-clear:hover { color: #e2e8f0; border-color: #94a3b8; }
.cmd-log-list {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}
.cmd-log-empty {
  text-align: center;
  padding: 20px;
  color: #334155;
}
.cmd-log-entry {
  display: flex;
  gap: 6px;
  padding: 2px 10px;
  border-left: 2px solid transparent;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.cmd-log-entry:hover { background: #1e293b; }

/* source colour coding */
.cmd-log-entry.ui      { border-left-color: #22c55e; }  /* green */
.cmd-log-entry.scheduler { border-left-color: #f59e0b; } /* amber */
.cmd-log-entry.operator { border-left-color: #ef4444; } /* red */
.cmd-log-entry.auto    { border-left-color: #a855f7; }  /* purple */

.e-time    { color: #64748b; min-width: 58px; }
.e-source  { color: #94a3b8; min-width: 70px; }
.e-action  { color: #38bdf8; min-width: 130px; }
.e-arrow   { color: #475569; }
.e-target  { color: #fb923c; min-width: 80px; }
.e-params  { color: #a3e635; overflow: hidden; text-overflow: ellipsis; }
</style>