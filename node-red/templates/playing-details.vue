<template>
  <div class="playing-details">
    <h2 class="section-title">Exit10 — Playing Details</h2>

    <!-- ── Exit10 Merged Matrix ─────────────────────────────────────────── -->
    <section class="matrix-section">
      <h3 class="subsection-title">Area × Feature Matrix</h3>
      <div class="table-wrapper">
        <table class="matrix-table">
          <thead>
            <tr>
              <th class="corner-cell">Area / Feature</th>
              <th v-for="feature in features" :key="feature" class="feature-header">
                {{ feature }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="area in areas" :key="area">
              <td class="area-label">{{ area }}</td>
              <td
                v-for="feature in features"
                :key="feature"
                class="matrix-cell"
                :class="naClass(area, feature) || modeClass(area, feature)"
              >
                <span class="cell-icon">{{ iconForCell(area, feature) }}</span>
                <span class="cell-text">{{ displayText(area, feature) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── External Device Status Grid ──────────────────────────────────── -->
    <section class="devices-section">
      <h3 class="subsection-title">External Device Status</h3>
      <div class="devices-grid">
        <div
          v-for="device in externalDevices"
          :key="device.name"
          class="device-card"
          :class="device.online ? 'is-online' : 'is-offline'"
        >
          <span class="device-status-icon">{{ device.online ? '✅' : '❌' }}</span>
          <span class="device-name">{{ device.name }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'PlayingDetails',

  // Node-RED Dashboard 2 injects `msg` as a prop.
  props: {
    msg: {
      type: Object,
      default: () => ({}),
    },
  },

  data() {
    return {
      /* ── Axis definitions ──────────────────────────────────────── */
      areas: ['Atrium 1', 'Atrium 2', 'Atrium 3', 'Landscape', 'Halls', 'F&B'],
      features: ['Video', 'Audio', 'Lighting', 'External Systems'],

      /* ── Static list of external device names (from DEVICES.md) ── */
      deviceNames: [
        'Pharos',
        'F&B',
        'Fountain',
        'Dome Screen',
        'Medialon',
        '7th Sense',
        'BrightSign',
      ],
    };
  },

  computed: {
    /* Normalize the incoming payload ─────────────────────────────── */
    payload() {
      return this.msg?.payload ?? {};
    },

    /* Matrix state: payload.matrix[area][feature] → mode string ──── */
    matrix() {
      return this.payload.matrix ?? {};
    },

    /* Device online map: payload.devices[deviceName] → bool ─────── */
    deviceMap() {
      return this.payload.devices ?? {};
    },

    /* Derived device list — updates reactively with deviceMap ──────── */
    externalDevices() {
      return this.deviceNames.map((name) => ({
        name,
        online: this.deviceMap[name] ?? false,
      }));
    },
  },

  methods: {
    /* ── Rule: Landscape will never have Video ─────────────────────── */
    isNa(area, feature) {
      return area === 'Landscape' && feature === 'Video';
    },

    /* Raw mode string from the matrix payload ─────────────────────── */
    rawMode(area, feature) {
      return this.matrix[area]?.[feature] ?? '';
    },

    /* Resolved display text (N/A overrides any payload value) ──────── */
    displayText(area, feature) {
      if (this.isNa(area, feature)) return 'N/A';
      return this.rawMode(area, feature) || '—';
    },

    /* Icon for each mode ─────────────────────────────────────────── */
    iconForCell(area, feature) {
      if (this.isNa(area, feature)) return '⛔';
      const mode = this.rawMode(area, feature).toLowerCase();
      if (mode.includes('special event')) return '🎪';
      if (mode.includes('live mixer'))    return '🎚️';
      return '';
    },

    /* CSS class when the cell is N/A (highest priority) ────────────── */
    naClass(area, feature) {
      return this.isNa(area, feature) ? 'is-na' : null;
    },

    /* CSS class driven by the mode string ──────────────────────────── */
    modeClass(area, feature) {
      const mode = this.rawMode(area, feature).toLowerCase();
      if (mode.includes('special event')) return 'is-special-event';
      if (mode.includes('live mixer'))    return 'is-live-mixer';
      return null;
    },
  },
};
</script>

<style scoped>
/* ── Layout ──────────────────────────────────────────────────────────── */
.playing-details {
  font-family: sans-serif;
  padding: 16px;
  color: #f0f0f0;
  background: #1a1a2e;
  border-radius: 8px;
}

.section-title {
  margin: 0 0 16px;
  font-size: 1.4rem;
  color: #e0e0e0;
}

.subsection-title {
  margin: 0 0 10px;
  font-size: 1rem;
  color: #aaaaaa;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ── Matrix table ────────────────────────────────────────────────────── */
.matrix-section {
  margin-bottom: 28px;
}

.table-wrapper {
  overflow-x: auto;
}

.matrix-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.matrix-table th,
.matrix-table td {
  padding: 8px 12px;
  border: 1px solid #333355;
  text-align: center;
  white-space: nowrap;
}

.corner-cell,
.feature-header {
  background: #16213e;
  color: #a0aec0;
  font-weight: 600;
}

.area-label {
  background: #16213e;
  color: #cbd5e0;
  font-weight: 600;
  text-align: left;
}

/* Default cell */
.matrix-cell {
  background: #0f3460;
  color: #e2e8f0;
  transition: background 0.2s;
}

.cell-icon {
  margin-right: 4px;
}

/* ── Mode tints ──────────────────────────────────────────────────────── */
/* Special Event — amber */
.is-special-event {
  background: #7c4a00;
  color: #ffd580;
}

/* Live Mixer — pink */
.is-live-mixer {
  background: #6b0040;
  color: #ffb3d9;
}

/* N/A — gray */
.is-na {
  background: #2d2d2d;
  color: #888888;
}

/* ── External device grid ────────────────────────────────────────────── */
.devices-section {
  margin-top: 4px;
}

.devices-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.device-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px 14px;
  border-radius: 6px;
  min-width: 90px;
  font-size: 0.8rem;
  font-weight: 600;
  gap: 4px;
}

.device-status-icon {
  font-size: 1.2rem;
}

.device-name {
  color: #cbd5e0;
}

/* Online — subtle green tint */
.is-online {
  background: #0d4a2a;
  border: 1px solid #2f855a;
}

/* Offline — subtle red tint */
.is-offline {
  background: #4a0d0d;
  border: 1px solid #9b2c2c;
}
</style>
