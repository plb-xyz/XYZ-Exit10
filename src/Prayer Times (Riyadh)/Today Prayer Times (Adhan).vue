<template>
  <div class="pt-wrap">
    <div class="pt-head">
      <div class="pt-title">Riyadh Prayer Times (Adhan)</div>
      <div class="pt-sub">Umm al-Qura (method=4) · Updated: {{ fetchedAtLocal }}</div>
    </div>

    <div v-if="!today" class="pt-empty">No data yet (waiting for fetch)...</div>

    <div v-else class="pt-grid">
      <div class="pt-card"><div class="k">Fajr</div><div class="v">{{ today.fajr }}</div></div>
      <div class="pt-card"><div class="k">Dhuhr</div><div class="v">{{ today.dhuhr }}</div></div>
      <div class="pt-card"><div class="k">Asr</div><div class="v">{{ today.asr }}</div></div>
      <div class="pt-card"><div class="k">Maghrib</div><div class="v">{{ today.maghrib }}</div></div>
      <div class="pt-card"><div class="k">Isha</div><div class="v">{{ today.isha }}</div></div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      today: null,
      fetchedAt: null,
    }
  },
  computed: {
    fetchedAtLocal() {
      if (!this.fetchedAt) return '—'
      try { return new Date(this.fetchedAt).toLocaleString() } catch (e) { return this.fetchedAt }
    }
  },
  mounted() {
    this.$watch(() => this.msg, (m) => {
      const p = m?.payload
      if (!p || p.kind !== 'today') return
      this.today = p.data || null
      this.fetchedAt = p.fetchedAt || null
    }, { deep: true, immediate: true })
  }
}
</script>

<style>
.pt-wrap { padding: 8px; }
.pt-head { margin-bottom: 10px; }
.pt-title { font-size: 18px; font-weight: 900; }
.pt-sub { font-size: 12px; opacity: 0.7; }
.pt-empty { font-size: 13px; opacity: 0.8; }
.pt-grid { display: grid; grid-template-columns: repeat(5, minmax(120px, 1fr)); gap: 10px; }
@media (max-width: 900px) { .pt-grid { grid-template-columns: repeat(2, minmax(140px, 1fr)); } }
.pt-card { padding: 10px; border-radius: 14px; background: rgba(0,0,0,0.03); border: 1px solid rgba(0,0,0,0.06); }
.pt-card .k { font-size: 12px; opacity: 0.75; font-weight: 700; }
.pt-card .v { font-size: 20px; font-weight: 950; margin-top: 4px; }
</style>
