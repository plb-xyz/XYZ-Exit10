<template>
  <div style="padding:6px">
    <div v-if="!msg" style="color:#aaa">Waiting for state…</div>
    <div v-else>
      <div v-if="!msg.payload.timelines || msg.payload.timelines.length === 0" style="color:#aaa">
        No running or paused timelines.
      </div>

      <div v-else>
        <div
          v-for="tl in msg.payload.timelines"
          :key="tl.id"
          style="padding:6px 8px; margin:6px 0; border:1px solid #333; border-radius:6px; background:#1b1b2e; color:#e0e0e0;"
        >
          <div style="display:flex; justify-content:space-between; gap:10px; align-items:baseline;">
            <div style="font-weight:600;">{{ tl.name }}</div>
            <div style="font-family:monospace; color:#80cbc4;">id={{ tl.id }}</div>
          </div>

          <div style="display:flex; justify-content:space-between; margin-top:2px; font-size:0.9em;">
            <div :style="{ color: tl.stateColor, fontWeight: 600 }">{{ tl.stateLabel }}</div>
            <div style="font-family:monospace; color:#bbb;">t={{ tl.timeText }}</div>
          </div>
        </div>
      </div>

      <div style="margin-top:8px; font-size:0.85em; color:#aaa">Updated: {{ msg.payload.ts }}</div>
    </div>
  </div>
</template>