<template>
  <div style="padding:8px; min-height:220px;">
    <p v-if="!msg" style="color:#aaa">Waiting for discovery result...</p>

    <div v-else-if="msg.payload.status === 'error'" style="color:#f44336">
      <strong>Discovery error</strong><br>{{ msg.payload.error }}
    </div>

    <div v-else-if="msg.payload.status === 'discovered' || msg.payload.status === 'diff_ready'">
      <strong>
        {{ (msg.payload.diff && (msg.payload.diff.added?.length || msg.payload.diff.removed?.length || msg.payload.diff.changed?.length))
            ? 'Changes detected - review before saving'
            : 'Discovery result' }}
      </strong>

      <p style="margin:6px 0; color:#aaa;">
        {{ msg.payload.count ?? 0 }} timelines discovered
      </p>

      <pre style="background:#1b1b2e;color:#e0e0e0;padding:8px;border-radius:4px;font-size:0.85em;max-height:200px;overflow-y:auto">
{{ (msg.payload.diffLines && msg.payload.diffLines.length) ? msg.payload.diffLines.join('\n') : 'No diff lines' }}
      </pre>
    </div>

    <div v-else-if="msg.payload.status === 'no_changes'" style="color:#4caf50">
      <strong>No changes detected</strong>
      <pre style="background:#1b1b2e;color:#e0e0e0;padding:8px;border-radius:4px;font-size:0.85em;max-height:180px;overflow-y:auto">
{{ msg.payload.diffLines ? msg.payload.diffLines.join('\n') : '' }}
      </pre>
    </div>

    <div v-else style="color:#aaa">
      Unknown status: {{ msg.payload.status }}
    </div>
  </div>
</template>

<script>
export default {}
</script>