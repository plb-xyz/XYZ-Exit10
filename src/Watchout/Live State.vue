<template>
  <div style="padding:4px">
    <p v-if="!msg" style="color:#aaa">Waiting for state...</p>
    <div v-else>
      <div style="margin-bottom:6px">
        <span v-if="msg.payload.type === 'poll'" style="color:#ff9800;font-size:0.9em">Polling (SSE offline)</span>
        <span v-else style="color:#4caf50;font-size:0.9em">SSE Live</span>
      </div>
      <pre style="background:#1b1b2e;color:#e0e0e0;padding:8px;border-radius:4px;font-size:0.82em;max-height:200px;overflow-y:auto">{{ JSON.stringify(msg.payload.data, null, 2) }}</pre>
    </div>
  </div>
</template>