const actor = flow.get('xstate_actor');

if (!actor) {
    node.warn('State machine actor not ready. Run initializer/deploy first.');
    return null;
}

const event = toMachineEvent(msg.payload);
if (!event) {
    return null;
}

const before = actor.getSnapshot().value;
actor.send(event);
const after = actor.getSnapshot().value;

if (event.type === 'SHOW_GO' && event.key) {
    flow.set('xstate_active_show_key', event.key);
}

if (JSON.stringify(before) === JSON.stringify(after)) {
    node.warn('Event "' + event.type + '" had no effect in state: ' + JSON.stringify(before));
}

return null;

function toMachineEvent(payload) {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    if (typeof payload.type === 'string' && payload.type.trim()) {
        return payload;
    }

    if (typeof payload.action !== 'string' || !payload.action.trim()) {
        return null;
    }

    const params = payload.params || {};
    const action = payload.action.trim();
    const map = {
        'sys.ready': 'SYS_READY',
        'normal.enter': 'NORMAL_ENTER',
        'goto.idle': 'GOTO_IDLE',
        'show.go': 'SHOW_GO',
        'show.end': 'SHOW_END',
        'show.stop': 'SHOW_END',
        'a1.audio.special': 'A1_AUDIO_SPECIAL',
        'a1.audio.none': 'A1_AUDIO_NONE',
        'a1.audio.bgm': 'A1_AUDIO_BGM',
        'a1.ontop.start': 'A1_ONTOP_START',
        'a1.ontop.end': 'A1_ONTOP_END',
        'a1.fullscreen.start': 'A1_FULLSCREEN_START',
        'a1.fullscreen.end': 'A1_FULLSCREEN_END',
        'a1.event.simple.start': 'A1_EVENT_SIMPLE_START',
        'a1.event.simple.end': 'A1_EVENT_SIMPLE_END',
        'a1.event.complex.start': 'A1_EVENT_COMPLEX_START',
        'a1.event.complex.end': 'A1_EVENT_COMPLEX_END',
        'a2.ontop.start': 'A2_ONTOP_START',
        'a2.ontop.end': 'A2_ONTOP_END',
        'a2.fullscreen.start': 'A2_FULLSCREEN_START',
        'a2.fullscreen.end': 'A2_FULLSCREEN_END',
        'a2.event.simple.start': 'A2_EVENT_SIMPLE_START',
        'a2.event.simple.end': 'A2_EVENT_SIMPLE_END',
        'a2.event.complex.start': 'A2_EVENT_COMPLEX_START',
        'a2.event.complex.end': 'A2_EVENT_COMPLEX_END',
        'a3.ontop.start': 'A3_ONTOP_START',
        'a3.ontop.end': 'A3_ONTOP_END',
        'a3.fullscreen.start': 'A3_FULLSCREEN_START',
        'a3.fullscreen.end': 'A3_FULLSCREEN_END',
        'a3.event.simple.start': 'A3_EVENT_SIMPLE_START',
        'a3.event.simple.end': 'A3_EVENT_SIMPLE_END',
        'a3.event.complex.start': 'A3_EVENT_COMPLEX_START',
        'a3.event.complex.end': 'A3_EVENT_COMPLEX_END',
        'ls.audio.special': 'LS_AUDIO_SPECIAL',
        'ls.audio.none': 'LS_AUDIO_NONE',
        'ls.audio.bgm': 'LS_AUDIO_BGM'
    };

    const type = map[action];
    if (!type) {
        node.warn('Unsupported action for state machine: ' + action);
        return null;
    }

    const event = { type };
    if (type === 'SHOW_GO' && typeof params.key === 'string') {
        event.key = params.key;
    }
    return event;
}