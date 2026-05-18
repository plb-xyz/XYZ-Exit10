// Adapter: GET /v0/state (poll) → UI payload for timelines list
// Output payload shape expected by the UI template:
//   { timelines: [{id,name,stateLabel,stateColor,timeText}], ts }

const state = (msg.payload && msg.payload.data) ? msg.payload.data : msg.payload;
const timelines = Array.isArray(state && state.timelines) ? state.timelines : [];

// Mapping schema: { contentId: { displayName, watchoutId } }
const mapping = flow.get('watchout_mapping') || {};

// Reverse lookup: watchoutId -> displayName
const idToName = {};
for (const contentId of Object.keys(mapping)) {
    const entry = mapping[contentId];
    if (entry && typeof entry === 'object' && entry.watchoutId != null) {
        idToName[String(entry.watchoutId)] = entry.displayName || contentId;
    }
}

// Derive run/pause/stop from poll fields
function deriveState(tl) {
    // Prefer NDJSON-style if it exists
    if (tl.playbackStatus) {
        const s = String(tl.playbackStatus).toLowerCase();
        if (s === 'run') return 'run';
        if (s === 'pause') return 'pause';
        return 'stop';
    }

    if (tl.running === true) return 'run';

    const tt = (tl.timelineTime !== undefined && tl.timelineTime !== null) ? Number(tl.timelineTime) : null;
    // Your requirement: running=false but timeline still "there" => treat as paused
    if (tl.running === false && tt !== null && !Number.isNaN(tt) && tt > 0) return 'pause';

    return 'stop';
}

function formatMmSs(ms) {
    if (ms === undefined || ms === null) return '--:--';
    const n = Number(ms);
    if (Number.isNaN(n) || n < 0) return '--:--';
    const totalSeconds = Math.floor(n / 1000);
    const mm = Math.floor(totalSeconds / 60);
    const ss = totalSeconds % 60;
    return String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0');
}

function stateMeta(state) {
    if (state === 'run')  return { stateLabel: 'Running', stateColor: '#4caf50' }; // green
    if (state === 'pause') return { stateLabel: 'Paused',  stateColor: '#ffeb3b' }; // yellow
    return { stateLabel: 'Stopped', stateColor: '#9e9e9e' };
}

const items = timelines.map(tl => {
    const id = String(tl.id);
    const state = deriveState(tl);
    const meta = stateMeta(state);

    return {
        id,
        name: tl.name || idToName[id] || ('Timeline ' + id),
        state,                 // run|pause|stop (internal)
        stateLabel: meta.stateLabel,
        stateColor: meta.stateColor,
        timeText: formatMmSs(tl.timelineTime)
    };
});

// Show only Running + Paused (hide stopped)
const visible = items.filter(t => t.state === 'run' || t.state === 'pause');

msg.topic = 'watchout/timelines';
msg.payload = {
    timelines: visible,
    ts: new Date().toISOString()
};

return msg;