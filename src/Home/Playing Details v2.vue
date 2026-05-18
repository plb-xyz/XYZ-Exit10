<template>
  <div class="pd-board">
    <!-- EXIT10 -->
    <div class="section">
      <div class="section-title">Playing Details — Exit10</div>

      <div class="matrix-card purple">
        <div class="matrix-head">
          <div class="corner"></div>
          <div class="col" v-for="c in exit10.cols" :key="c">{{ c }}</div>
        </div>

        <div class="matrix-body">
          <div class="grid-wrap">
            <div class="row-titles" :style="{ gridTemplateRows: `repeat(${exit10.rows.length}, var(--row-unit))` }">
              <div class="row-title" v-for="r in exit10.rows" :key="r">{{ r }}</div>
            </div>

            <div
              class="cells-grid"
              :style="{
                gridTemplateColumns: `repeat(${exit10.cols.length}, minmax(140px, 1fr))`,
                gridTemplateRows: `repeat(${exit10.rows.length}, var(--row-unit))`
              }"
            >
              <div
                v-for="cell in exit10Cells"
                :key="cell.key"
                class="cell"
                :class="[cellClass(cell.text), naClass(cell)]"
                :style="{
                  gridColumn: `${cell.col + 1} / span ${cell.colSpan}`,
                  gridRow: `${cell.row + 1} / span ${cell.rowSpan}`
                }"
              >
                <div class="cell-inner">
                  <span class="icon" aria-hidden="true">{{ iconForCell(cell) }}</span>
                  <span class="cell-text">{{ displayText(cell) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="hint">
            Cells merge when adjacent spaces and/or adjacent categories share the same value.
          </div>
        </div>
      </div>
    </div>

    <!-- EXTERNAL: LED status grid + Now Playing -->
    <div class="section">
      <div class="section-title">Playing Details — External</div>

      <div class="matrix-card purple">
        <div class="ext-head">
          <div class="ext-col">Device</div>
          <div class="ext-col">Status</div>
          <div class="ext-col">Now Playing</div>
        </div>

        <div class="ext-body">
          <div class="ext-row" v-for="(d, idx) in externalDevices" :key="d.id" :class="idx % 2 ? 'alt-row' : ''">
            <div class="ext-device">{{ d.name }}</div>

            <div class="ext-status">
              <span class="led" :class="[ledClass(d.status), blinkClass(d.status)]"></span>
              <span class="ext-status-text">{{ statusText(d.status) }}</span>
            </div>

            <div class="ext-now">
              <div class="cell-inner">
                <span class="icon" aria-hidden="true">{{ iconFor(d.nowPlaying) }}</span>
                <span class="cell-text">{{ d.nowPlaying || "—" }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="hint" v-if="externalHint">{{ externalHint }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      // EXIT10
      exit10: {
        rows: ["Video", "Lighting", "Audio"],
        cols: ["Atrium 1", "Atrium 2", "Atrium 3", "Landscape"],
        values: {
          Video: {
            "Atrium 1": "Ambience 1",
            "Atrium 2": "Ambience 2",
            "Atrium 3": "Show 1",
            Landscape: "Ambience 1",
          },
          Lighting: {
            "Atrium 1": "Ambience 1",
            "Atrium 2": "Ambience 2",
            "Atrium 3": "Show 1",
            Landscape: "Ambience 1",
          },
          Audio: {
            "Atrium 1": "BG Music",
            "Atrium 2": "BG Music",
            "Atrium 3": "Show 1",
            Landscape: "BG Music",
          },
        },
      },

      // EXTERNAL devices (LED status + now playing)
      // status: 'connected' | 'connecting' | 'disconnected' | 'error'
      externalDevices: [
        { id: "pharos_main", name: "Pharos Main", status: "disconnected", nowPlaying: "—" },
        { id: "pharos_2", name: "Pharos 2", status: "disconnected", nowPlaying: "—" },
        { id: "pharos_3", name: "Pharos 3", status: "disconnected", nowPlaying: "—" },
        { id: "cinema_dome_brightsign", name: "Cinema Dome Brightsign", status: "disconnected", nowPlaying: "—" },
        { id: "cinema_led_columns", name: "Cinema LED columns", status: "disconnected", nowPlaying: "—" },
        { id: "water_feature_1", name: "Water Feature 1", status: "disconnected", nowPlaying: "—" },
        { id: "water_feature_2", name: "Water Feature 2", status: "disconnected", nowPlaying: "—" },
        { id: "water_feature_3", name: "Water Feature 3", status: "disconnected", nowPlaying: "—" },
      ],

      externalHint:
        "Send msg.payload.externalDevices updates (status + nowPlaying) to populate this list.",
    };
  },

  computed: {
    exit10Cells() {
      return this.buildMergedCells(this.exit10);
    },
  },

  methods: {
    // ---------------- EXIT10 merge logic ----------------
    getCell(section, row, col) {
      return section?.values?.[row]?.[col] ?? "—";
    },

    gridTexts(section) {
      const rows = section.rows;
      const cols = section.cols;
      return rows.map((r) => cols.map((c) => this.getCell(section, r, c)));
    },

    buildMergedCells(section) {
      const rowCount = section.rows.length;
      const colCount = section.cols.length;
      const texts = this.gridTexts(section);

      const used = Array.from({ length: rowCount }, () => Array(colCount).fill(false));
      const cells = [];

      const canExpandCol = (r0, rSpan, cNext, text) => {
        if (cNext >= colCount) return false;
        for (let r = r0; r < r0 + rSpan; r++) {
          if (used[r][cNext]) return false;
          if (texts[r][cNext] !== text) return false;
        }
        return true;
      };

      const canExpandRow = (rNext, c0, cSpan, text) => {
        if (rNext >= rowCount) return false;
        for (let c = c0; c < c0 + cSpan; c++) {
          if (used[rNext][c]) return false;
          if (texts[rNext][c] !== text) return false;
        }
        return true;
      };

      for (let r = 0; r < rowCount; r++) {
        for (let c = 0; c < colCount; c++) {
          if (used[r][c]) continue;

          const text = texts[r][c];
          let rSpan = 1;
          let cSpan = 1;

          while (canExpandCol(r, rSpan, c + cSpan, text)) cSpan++;
          while (canExpandRow(r + rSpan, c, cSpan, text)) rSpan++;
          while (canExpandCol(r, rSpan, c + cSpan, text)) cSpan++;

          for (let rr = r; rr < r + rSpan; rr++) {
            for (let cc = c; cc < c + cSpan; cc++) used[rr][cc] = true;
          }

          cells.push({
            key: `${r}_${c}_${rSpan}x${cSpan}_${text}`,
            row: r,
            col: c,
            rowSpan: rSpan,
            colSpan: cSpan,
            text,
          });
        }
      }

      return cells;
    },

    // ---------------- Display rules / icons / tint ----------------
    norm(s) {
      return String(s || "").trim().toLowerCase();
    },

    // Landscape will never have video → treat as N/A (and merge as N/A if multiple)
    isNA(cell) {
      const isLandscapeCol = this.exit10?.cols?.[cell.col] === "Landscape";
      const isVideoRow = this.exit10?.rows?.[cell.row] === "Video";
      return isLandscapeCol && isVideoRow;
    },

    displayText(cell) {
      return this.isNA(cell) ? "N/A" : cell.text;
    },

    iconForCell(cell) {
      if (this.isNA(cell)) return "⛔";
      return this.iconFor(cell.text);
    },

    iconFor(text) {
      const s = this.norm(text);

      // NEW: Special Event + Live Mixer + explicit N/A markers
      if (s.includes("special") && s.includes("event")) return "🎪";
      if (s.includes("live") && (s.includes("mixer") || s.includes("mix"))) return "🎚️";
      if (s === "n/a" || s === "na") return "⛔";

      if (s.startsWith("show")) return "🎬";
      if (s.startsWith("ambi")) return "🌙";
      if (s.includes("bg") || s.includes("music")) return "🎵";
      if (s === "—" || s === "-" || s === "") return "•";
      return "▢";
    },

    cellClass(text) {
      const s = this.norm(text);

      // NEW: colors
      if (s.includes("special") && s.includes("event")) return "is-special-event";
      if (s.includes("live") && (s.includes("mixer") || s.includes("mix"))) return "is-live-mixer";
      if (s === "n/a" || s === "na") return "is-na";

      if (s.startsWith("show")) return "is-show";
      if (s.startsWith("ambi")) return "is-ambi";
      if (s.includes("bg") || s.includes("music")) return "is-music";
      return "";
    },

    naClass(cell) {
      return this.isNA(cell) ? "is-na" : "";
    },

    // ---------------- External LED helpers ----------------
    ledClass(status) {
      if (status === "connected") return "led-green";
      if (status === "connecting") return "led-amber";
      return "led-red"; // disconnected + error
    },
    blinkClass(status) {
      if (status === "error") return "blink-fast";
      if (status === "connecting") return "blink-slow";
      return "";
    },
    statusText(status) {
      if (status === "connected") return "Online";
      if (status === "connecting") return "Connecting…";
      if (status === "error") return "Error";
      return "Offline";
    },

    setExternalDevice(id, patch) {
      const d = this.externalDevices.find((x) => x.id === id);
      if (!d) return false;
      if (typeof patch.name === "string") d.name = patch.name;
      if (typeof patch.status === "string") d.status = patch.status;
      if (typeof patch.nowPlaying === "string") d.nowPlaying = patch.nowPlaying;
      return true;
    },

    // ---------------- Message updates ----------------
    applyMsg(msg) {
      const p = msg?.payload;
      if (!p || typeof p !== "object") return;

      // EXIT10 updates
      if (p.exit10 && typeof p.exit10 === "object") {
        this.exit10 = { ...this.exit10, ...p.exit10 };
        if (p.exit10.values) this.exit10.values = { ...this.exit10.values, ...p.exit10.values };
      }

      // External devices updates:
      // A) bulk map by id: { externalDevices: { pharos_main: {status, nowPlaying}, ... } }
      // B) single: { externalDevice: { id, status, nowPlaying } }
      if (p.externalDevices && typeof p.externalDevices === "object" && !Array.isArray(p.externalDevices)) {
        for (const [id, val] of Object.entries(p.externalDevices)) {
          if (val && typeof val === "object") this.setExternalDevice(id, val);
        }
      }

      if (p.externalDevice && typeof p.externalDevice === "object" && p.externalDevice.id) {
        this.setExternalDevice(p.externalDevice.id, p.externalDevice);
      }

      if (typeof p.externalHint === "string") this.externalHint = p.externalHint;
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
:root {
  --row-unit: 64px;
}

.pd-board {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.section {
  padding: 12px;
  border-radius: 14px;
  background: rgba(0,0,0,0.035);
}

.section-title {
  font-size: 22px;
  font-weight: 950;
  letter-spacing: 0.2px;
  margin: 4px 0 10px 2px;
}

/* purple backing for both cards */
.matrix-card.purple {
  background: rgba(152, 92, 255, 0.07);
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04);
  overflow-x: auto;
}

/* Exit10 header */
.matrix-head {
  display: grid;
  grid-template-columns: 140px repeat(4, minmax(140px, 1fr));
  gap: 8px;
  align-items: center;
}

.corner { height: 1px; }

.col {
  font-size: 14px;
  font-weight: 800;
  opacity: 0.85;
  padding: 8px 10px;
  text-align: center;
}

.grid-wrap {
  margin-top: 8px;
  display: grid;
  grid-template-columns: 140px 1fr;
  gap: 8px;
}

/* row titles */
.row-titles {
  display: grid;
  gap: 8px;
}

.row-title {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  font-size: 14px;
  font-weight: 900;
  opacity: 0.85;

  padding: 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.45);
}

/* merged grid */
.cells-grid {
  display: grid;
  gap: 8px;
  align-items: stretch;
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;

  padding: 10px;
  border-radius: 12px;
  background: rgba(255,255,255,0.55);
  min-height: 0;
}

.cell-inner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.icon {
  opacity: 0.9;
  font-size: 14px;
  width: 18px;
  text-align: center;
}

.cell-text {
  font-size: 14px;
  font-weight: 400;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.is-show  { background: rgba(59, 130, 246, 0.10); }
.is-ambi  { background: rgba(152, 92, 255, 0.10); }
.is-music { background: rgba(34, 197, 94, 0.10); }

/* NEW: Special Event / Live Mixer / N/A colors */
.is-special-event { background: rgba(245, 158, 11, 0.14); } /* amber */
.is-live-mixer    { background: rgba(236, 72, 153, 0.12); } /* pink */
.is-na            { background: rgba(148, 163, 184, 0.22); } /* slate/gray */

/* External header + rows */
.ext-head {
  display: grid;
  grid-template-columns: 240px 200px 1fr;
  gap: 8px;
  align-items: center;
  margin-bottom: 8px;
}

.ext-col {
  font-size: 14px;
  font-weight: 800;
  opacity: 0.85;
  padding: 8px 10px;
  text-align: center;
}

.ext-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ext-row {
  display: grid;
  grid-template-columns: 240px 200px 1fr;
  gap: 8px;
  align-items: stretch;
}

.alt-row .ext-device,
.alt-row .ext-status,
.alt-row .ext-now {
  background: rgba(255,255,255,0.52);
}

.ext-device,
.ext-status,
.ext-now {
  border-radius: 12px;
  background: rgba(255,255,255,0.45);
  padding: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.ext-device {
  font-size: 14px;
  font-weight: 800;
}

.ext-status {
  gap: 10px;
}

.ext-status-text {
  font-size: 14px;
  font-weight: 650;
}

/* LED */
.led {
  width: 14px;
  height: 14px;
  border-radius: 999px;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.22),
              0 0 0 2px rgba(0,0,0,0.10);
}

.led-green { background: #22c55e; box-shadow: 0 0 12px rgba(34,197,94,0.50), inset 0 0 0 2px rgba(255,255,255,0.22), 0 0 0 2px rgba(0,0,0,0.10); }
.led-amber { background: #f59e0b; box-shadow: 0 0 12px rgba(245,158,11,0.50), inset 0 0 0 2px rgba(255,255,255,0.22), 0 0 0 2px rgba(0,0,0,0.10); }
.led-red   { background: #ef4444; box-shadow: 0 0 12px rgba(239,68,68,0.50), inset 0 0 0 2px rgba(255,255,255,0.22), 0 0 0 2px rgba(0,0,0,0.10); }

.blink-slow { animation: blink 0.9s infinite ease-in-out; }
.blink-fast { animation: blink 0.35s infinite ease-in-out; }
@keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0.15; } }

.hint {
  margin-top: 8px;
  font-size: 12px;
  opacity: 0.65;
}
</style>