<template>
  <div style="padding:4px">
    <p v-if="!msg" style="color:#aaa">No mapping operation yet.</p>
    <div v-else-if="msg.payload.status === 'saved'" style="color:#4caf50">
      <strong>Mapping saved</strong>
      <p style="font-size:0.85em;color:#aaa">{{ msg.payload.savedAt }}</p>
      <p><strong>{{ Object.keys(msg.payload.mapping || {}).length }} timelines active:</strong></p>
      <div v-for="(tid, cid) in (msg.payload.mapping || {})" :key="cid"
           style="font-family:monospace;font-size:0.85em">
        <span style="color:#80cbc4">{{ cid }}</span>
        <span style="color:#aaa"> -&gt; id </span>
        <span style="color:#1e3a8a">{{ tid }}</span>
      </div>
    </div>
    <div v-else-if="msg.payload.status === 'cancelled'" style="color:#ff9800">
      Discovery cancelled - mapping unchanged.
    </div>
    <div v-else-if="msg.payload.status === 'nothing_pending'" style="color:#aaa">
      Nothing pending - run discovery first.
    </div>
    <div v-else-if="msg.payload.status === 'error'" style="color:#f44336">
      Save failed: {{ msg.payload.error }}
    </div>
  </div>
</template>