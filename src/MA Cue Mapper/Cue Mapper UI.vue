<template>
  <div style="padding:12px;color:#e0e0e0;font-size:0.92em">
    <!-- Space selector row -->
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:16px;flex-wrap:wrap">
      <span style="color:#80cbc4;font-weight:600">Space:</span>
      <select v-model="selectedSpace" @change="cancelEdit"
              style="background:#1e1e2e;color:#e0e0e0;border:1px solid #444;padding:6px 12px;border-radius:4px;cursor:pointer">
        <option value="a1">Atrium 1</option>
        <option value="a2">Atrium 2</option>
        <option value="a3">Atrium 3</option>
        <option value="ls">Landscape</option>
        <option value="cmd">Commands</option>
        <option value="mx">Macros</option>
      </select>
      <button @click="startAdd"
              style="background:#1e3a5f;color:#80cbc4;border:1px solid #2d6a9f;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:600">
        + Add Entry
      </button>

      <!-- Sort controls -->
      <span style="margin-left:auto;color:#aaa;font-size:0.85em">Sort:</span>
      <button @click="toggleSort('label')"
              :style="sortBtnStyle('label')"
              style="padding:6px 10px;border-radius:4px;cursor:pointer;border:1px solid #555;background:#0d0d1a;color:#e0e0e0">
        Label {{ sortIndicator('label') }}
      </button>
      <button @click="toggleSort('type')"
              :style="sortBtnStyle('type')"
              style="padding:6px 10px;border-radius:4px;cursor:pointer;border:1px solid #555;background:#0d0d1a;color:#e0e0e0">
        Type {{ sortIndicator('type') }}
      </button>
      <button @click="toggleSort('target')"
              :style="sortBtnStyle('target')"
              style="padding:6px 10px;border-radius:4px;cursor:pointer;border:1px solid #555;background:#0d0d1a;color:#e0e0e0">
        Target {{ sortIndicator('target') }}
      </button>
      <button v-if="!isCmdOrMx" @click="toggleSort('cue')"
              :style="sortBtnStyle('cue')"
              style="padding:6px 10px;border-radius:4px;cursor:pointer;border:1px solid #555;background:#0d0d1a;color:#e0e0e0">
        Cue {{ sortIndicator('cue') }}
      </button>
    </div>

    <!-- Mapping table -->
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px">
      <thead>
        <tr style="border-bottom:2px solid #444">
          <th @click="toggleSort('label')" title="Sort by Label"
              style="text-align:left;padding:6px 8px;color:#80cbc4;cursor:pointer;user-select:none">
            Label <span style="color:#888">{{ sortIndicator('label') }}</span>
          </th>
          <th @click="toggleSort('type')" title="Sort by Type"
              style="text-align:left;padding:6px 8px;color:#80cbc4;cursor:pointer;user-select:none">
            Type <span style="color:#888">{{ sortIndicator('type') }}</span>
          </th>
          <th @click="toggleSort('target')" title="Sort by Target"
              style="text-align:left;padding:6px 8px;color:#80cbc4;cursor:pointer;user-select:none">
            Target <span style="color:#888">{{ sortIndicator('target') }}</span>
          </th>
          <th v-if="!isCmdOrMx" @click="toggleSort('cue')" title="Sort by Cue"
              style="text-align:left;padding:6px 8px;color:#80cbc4;cursor:pointer;user-select:none">
            Cue <span style="color:#888">{{ sortIndicator('cue') }}</span>
          </th>
          <th style="text-align:left;padding:6px 8px;color:#80cbc4">Notes</th>
          <th style="padding:6px 8px;color:#80cbc4">Actions</th>
        </tr>
      </thead>

      <tbody>
        <tr v-if="sortedEntries.length === 0">
          <td :colspan="isCmdOrMx ? 5 : 6" style="padding:12px 8px;color:#777;font-style:italic">
            No entries for this space. Click &quot;+ Add Entry&quot; to create one.
          </td>
        </tr>

        <tr v-for="row in sortedEntries" :key="row.lid"
            style="border-bottom:1px solid #2a2a3e"
            :style="{ background: editingLabelId === row.lid ? '#1e2d3e' : 'transparent' }">
          <td style="padding:6px 8px;color:#ffd54f;font-weight:600">{{ row.entry.displayName }}</td>
          <td style="padding:6px 8px">
            <span :style="{ color: typeColor(row.entry.type) }">{{ typeLabel(row.entry.type) }}</span>
          </td>
          <td style="padding:6px 8px;color:#80cbc4;font-family:monospace;max-width:260px;word-break:break-word">
            {{ entryTarget(row.entry) }}
          </td>
          <td v-if="!isCmdOrMx" style="padding:6px 8px;font-family:monospace">{{ row.entry.cue }}</td>
          <td style="padding:6px 8px;color:#888;font-size:0.85em">{{ row.entry.notes }}</td>
          <td style="padding:6px 8px;white-space:nowrap">
            <button @click="editEntry(row.lid, row.entry)"
                    style="background:#2d4a2d;color:#81c784;border:1px solid #81c784;padding:3px 9px;border-radius:3px;cursor:pointer;margin-right:4px;font-size:0.85em">Edit</button>
            <button @click="sendFire(row.lid)"
                    style="background:#2d3a4a;color:#80cbc4;border:1px solid #80cbc4;padding:3px 9px;border-radius:3px;cursor:pointer;margin-right:4px;font-size:0.85em">Send</button>
            <button @click="deleteEntry(row.lid)"
                    style="background:#4a1e1e;color:#ef9a9a;border:1px solid #ef9a9a;padding:3px 9px;border-radius:3px;cursor:pointer;font-size:0.85em">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Add / Edit form -->
    <div v-if="showForm"
      style="background:#1b1b2e;padding:16px;border-radius:6px;border:1px solid #444;margin-bottom:12px">
      <div style="font-weight:600;color:#80cbc4;margin-bottom:12px">
        {{ editingLabelId ? ('Edit: ' + form.displayName) : 'Add New Entry' }}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Label (Display Name) *</label>
          <input v-model="form.displayName" type="text" placeholder="e.g. Green Look"
                 style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box"/>
        </div>
        <div>
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Type *</label>
          <select v-model="form.type" @change="onTypeChange"
                  style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box;cursor:pointer">
            <option v-if="!isCmdOrMx" value="sequenceCue">Sequence Cue</option>
            <option v-if="!isCmdOrMx" value="executorCue">Executor Cue</option>
            <option v-if="selectedSpace === 'cmd'" value="command">Command</option>
            <option v-if="selectedSpace === 'mx'" value="macro">Macro</option>
          </select>
        </div>
        <div v-if="form.type === 'sequenceCue'">
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Sequence # *</label>
          <input v-model="form.sequence" type="text" placeholder="e.g. 3"
                 style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box"/>
        </div>
        <div v-if="form.type === 'executorCue'">
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Executor # *</label>
          <input v-model="form.executor" type="text" placeholder="e.g. 1.201"
                 style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box"/>
        </div>
        <div v-if="form.type === 'sequenceCue' || form.type === 'executorCue'">
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Cue # *</label>
          <input v-model="form.cue" type="text" placeholder="e.g. 7"
                 style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box"/>
        </div>
        <div v-if="form.type === 'macro'">
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Macro # or Name *</label>
          <input v-model="form.macro" type="text" placeholder="e.g. 5 or MyMacro"
                 style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box"/>
        </div>
        <div v-if="form.type === 'command'" style="grid-column:1/-1">
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Commands * (one per line)</label>
          <textarea v-model="form.commandsText" rows="4"
                    placeholder="e.g. Go+ Page 1 Executor 201 Cue 2"
                    style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box;font-family:monospace;resize:vertical"></textarea>
        </div>
        <div>
          <label style="display:block;color:#aaa;margin-bottom:4px;font-size:0.85em">Notes</label>
          <input v-model="form.notes" type="text" placeholder="Optional"
                 style="width:100%;background:#0d0d1a;color:#e0e0e0;border:1px solid #555;padding:6px 10px;border-radius:4px;box-sizing:border-box"/>
        </div>
      </div>
      <div style="display:flex;gap:10px;margin-top:14px">
        <button @click="saveEntry"
                style="background:#1e3a1e;color:#81c784;border:1px solid #81c784;padding:7px 20px;border-radius:4px;cursor:pointer;font-weight:600">Save</button>
        <button @click="cancelEdit"
                style="background:#2a2a3e;color:#aaa;border:1px solid #555;padding:7px 20px;border-radius:4px;cursor:pointer">Cancel</button>
      </div>
    </div>

    <!-- Status bar -->
    <div v-if="statusMsg"
         style="padding:8px 12px;border-radius:4px;font-size:0.9em"
         :style="{
           background: statusError ? '#4a1e1e' : '#1e3a1e',
           color: statusError ? '#ef9a9a' : '#81c784',
           border: '1px solid ' + (statusError ? '#ef9a9a' : '#81c784')
         }">
      {{ statusMsg }}
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      mapping: { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} },
      selectedSpace: 'a1',
      showForm: false,
      editingLabelId: null,
      form: { displayName: '', type: 'sequenceCue', sequence: '', executor: '', cue: '', macro: '', commandsText: '', notes: '' },
      statusMsg: '',
      statusError: false,

      // Sorting
      sortBy: 'label',
      sortDir: 'asc'
    };
  },

  mounted() {
    this.send({ payload: { action: 'getMapping' } });
  },

  computed: {
    currentEntries() { return this.mapping[this.selectedSpace] || {}; },
    isCmdOrMx() { return this.selectedSpace === 'cmd' || this.selectedSpace === 'mx'; },

    sortedEntries() {
      var entries = Object.keys(this.currentEntries).map((lid) => ({
        lid,
        entry: this.currentEntries[lid]
      }));

      var dir = this.sortDir === 'asc' ? 1 : -1;

      function normStr(v) { return (v == null) ? '' : String(v).toLowerCase(); }
      function toNum(v) { var n = Number(v); return Number.isFinite(n) ? n : null; }

      var sortBy = this.sortBy;
      var self = this;

      entries.sort(function(a, b) {
        var ea = a.entry || {};
        var eb = b.entry || {};

        if (sortBy === 'label') {
          var la = normStr(ea.displayName), lb = normStr(eb.displayName);
          if (la < lb) return -1 * dir;
          if (la > lb) return  1 * dir;
          return a.lid.localeCompare(b.lid) * dir;
        }

        if (sortBy === 'type') {
          var ta = normStr(ea.type), tb = normStr(eb.type);
          if (ta < tb) return -1 * dir;
          if (ta > tb) return  1 * dir;
          return 0;
        }

        if (sortBy === 'target') {
          var za = normStr(self.entryTarget(ea));
          var zb = normStr(self.entryTarget(eb));
          if (za < zb) return -1 * dir;
          if (za > zb) return  1 * dir;
          return 0;
        }

        if (sortBy === 'cue') {
          var na = toNum(ea.cue), nb = toNum(eb.cue);
          if (na != null && nb != null) {
            if (na < nb) return -1 * dir;
            if (na > nb) return  1 * dir;
            return 0;
          }
          var ca = normStr(ea.cue), cb = normStr(eb.cue);
          if (ca < cb) return -1 * dir;
          if (ca > cb) return  1 * dir;
          return 0;
        }

        return 0;
      });

      return entries;
    }
  },

  watch: {
    msg: {
      handler(m) {
        if (!m) return;
        if (m.topic === 'ma/cue-map/updated' && m.payload) {
          this.mapping = Object.assign({ a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} }, m.payload);
          this.setStatus('Mapping loaded ✓', false);
        } else if (m.topic === 'ma/cue-map/fire/ok' && m.payload) {
          this.setStatus('Sent: ' + (m.payload.info || JSON.stringify(m.payload.command)), false);
        } else if (m.topic === 'ma/cue-map/error' && m.payload) {
          this.setStatus(m.payload.error || 'Error', true);
        }
      },
      deep: true
    }
  },

  methods: {
    typeLabel(type) {
      var labels = { sequenceCue: 'Sequence', executorCue: 'Executor', command: 'Command', macro: 'Macro' };
      return labels[type] || type;
    },
    typeColor(type) {
      var colors = { sequenceCue: '#ce93d8', executorCue: '#81c784', command: '#ffb74d', macro: '#64b5f6' };
      return colors[type] || '#e0e0e0';
    },
    entryTarget(entry) {
      if (entry.type === 'sequenceCue') return 'Seq ' + (entry.sequence || '');
      if (entry.type === 'executorCue') return 'Exec ' + (entry.executor || '');
      if (entry.type === 'command') return (entry.commands || []).join(' | ');
      if (entry.type === 'macro') return 'Macro ' + entry.macro;
      return '';
    },

    toggleSort(col) {
      if (this.sortBy === col) {
        this.sortDir = (this.sortDir === 'asc') ? 'desc' : 'asc';
      } else {
        this.sortBy = col;
        this.sortDir = 'asc';
      }
    },
    sortIndicator(col) {
      if (this.sortBy !== col) return '';
      return this.sortDir === 'asc' ? '▲' : '▼';
    },
    sortBtnStyle(col) {
      if (this.sortBy !== col) return {};
      return { borderColor: '#80cbc4', color: '#80cbc4' };
    },

    setStatus(msg, isError) {
      this.statusMsg = msg;
      this.statusError = isError;
      setTimeout(() => { this.statusMsg = ''; }, 4000);
    },
    onTypeChange() {
      this.form.sequence = '';
      this.form.executor = '';
      this.form.cue = '';
      this.form.macro = '';
      this.form.commandsText = '';
    },
    startAdd() {
      this.editingLabelId = null;
      var defaultType = this.selectedSpace === 'cmd' ? 'command' : this.selectedSpace === 'mx' ? 'macro' : 'sequenceCue';
      this.form = { displayName: '', type: defaultType, sequence: '', executor: '', cue: '', macro: '', commandsText: '', notes: '' };
      this.showForm = true;
    },
    editEntry(lid, entry) {
      this.editingLabelId = lid;
      // Normalize type if entry has a stale/incompatible type for the current space
      var entryType = entry.type;
      if (this.selectedSpace === 'cmd' && entryType !== 'command') entryType = 'command';
      else if (this.selectedSpace === 'mx' && entryType !== 'macro') entryType = 'macro';
      else if (!this.isCmdOrMx && (entryType === 'command' || entryType === 'macro')) entryType = 'sequenceCue';
      this.form = {
        displayName: entry.displayName,
        type: entryType,
        sequence: entry.sequence || '',
        executor: entry.executor || '',
        cue: entry.cue || '',
        macro: entry.macro || '',
        commandsText: (entry.commands || []).join('\n'),
        notes: entry.notes || ''
      };
      this.showForm = true;
    },
    cancelEdit() {
      this.showForm = false;
      this.editingLabelId = null;
      this.form = { displayName: '', type: 'sequenceCue', sequence: '', executor: '', cue: '', macro: '', commandsText: '', notes: '' };
    },
    saveEntry() {
      if (!this.form.displayName.trim()) { this.setStatus('Label is required', true); return; }
      if (this.form.type === 'sequenceCue') {
        if (!this.form.cue)      { this.setStatus('Cue number is required', true); return; }
        if (!this.form.sequence) { this.setStatus('Sequence number is required', true); return; }
      } else if (this.form.type === 'executorCue') {
        if (!this.form.cue)      { this.setStatus('Cue number is required', true); return; }
        if (!this.form.executor) { this.setStatus('Executor number is required', true); return; }
      } else if (this.form.type === 'command') {
        var cmds = this.form.commandsText.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
        if (cmds.length === 0) { this.setStatus('At least one command is required', true); return; }
      } else if (this.form.type === 'macro') {
        if (!this.form.macro.trim()) { this.setStatus('Macro number or name is required', true); return; }
      }
      var entryData = Object.assign({}, this.form);
      if (this.form.type === 'command') {
        entryData.commands = this.form.commandsText.split('\n').map(function(s) { return s.trim(); }).filter(function(s) { return s.length > 0; });
      }
      this.send({ payload: { action: 'save', space: this.selectedSpace, entry: entryData, editingLabelId: this.editingLabelId } });
      this.cancelEdit();
    },
    deleteEntry(lid) {
      var name = (this.currentEntries[lid] && this.currentEntries[lid].displayName) || lid;
      if (!confirm('Delete "' + name + '"?')) return;
      this.send({ payload: { action: 'delete', space: this.selectedSpace, labelId: lid } });
    },
    sendFire(lid) {
      this.send({ payload: { action: 'fire', space: this.selectedSpace, labelId: lid } });
    }
  }
};
</script>