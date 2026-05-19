// Build msg.actions (an array of action objects) from msg.intent.playableId.
// This file is the source of truth for what each top-level playable contains
// (video/audio/lighting/etc steps and ordering).
//
// Action style expected by adapters:
//   { type: 'watchout', command: 'startTimeline', timelineKey: 'show_1' }
//   { type: 'watchout', command: 'jumpToCue', timelineKey: 'show_1', cueKey: 'cue_special' }
//   { type: 'ma', command: 'GoCue', space: 'a1', labelId: 'ambience_2' }
//
// Notes:
// - The Director executes actions in order.
// - Use waitMs to insert delays.
// - Use waitFor to pause until a status message arrives on the status bus.

const intent = msg.intent;
const id = intent.playableId;

const recipes = {
  show_1: [
    // Start Watchout timeline
    { type: 'watchout', command: 'start', timelineKey: 'show_1' },

    // Wait a little, then jump to a cue (example)
    { type: 'watchout', command: 'jumpToCue', timelineKey: 'show_1', cueKey: 'intro', waitMs: 300 },

    // Lighting examples (stubs)
    { type: 'ma', command: 'GoCue', cue: 'SHOW_1_START' },
    { type: 'ma', command: 'RunMacro', macro: 'SHOW_1_INIT' },

    // Q-Sys examples (stubs)
    { type: 'qsys', command: 'RecallScene', scene: 'Show1' },
    { type: 'qsys', command: 'SetBgmMute', value: 1 },

    // Pharos examples (multiple systems)
    { type: 'pharos', system: 'pharos_main', command: 'Trigger', triggerId: 'show1_start' },
    { type: 'pharos', system: 'pharos_fountain', command: 'Trigger', triggerId: 'show1_water' }
  ],

  ambience_1: [
    { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a1' },
    { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a2' },
    { type: 'watchout', command: 'start', timelineKey: 'ambience_1_a3' },
    { type: 'ma', command: 'GoCue', space: 'a1', labelId: 'ambience_1' },
    { type: 'ma', command: 'GoCue', space: 'a2', labelId: 'ambience_1' },
    { type: 'ma', command: 'GoCue', space: 'a3', labelId: 'ambience_1' },
    { type: 'ma', command: 'GoCue', space: 'ls', labelId: 'ambience_1' },
    { type: 'watchout', command: 'start', timelineKey: 'bg_music_1' },
    { type: 'qsys', command: 'RecallScene', scene: 'Ambience1' },
    { type: 'qsys', command: 'SetBgmMute', value: 0 }
  ],

  ambience_2: [
    // Video (Watchout): start ambience timelines in each atrium
    { type: 'watchout', command: 'start', timelineKey: 'ambience_2_a1' },
    { type: 'watchout', command: 'start', timelineKey: 'ambience_2_a2' },
    { type: 'watchout', command: 'start', timelineKey: 'ambience_2_a3' },

    // Lighting (MA via cue mapper): resolve per-space ambience_2 labels
    { type: 'ma', command: 'GoCue', space: 'a1', labelId: 'ambience_2' },
    { type: 'ma', command: 'GoCue', space: 'a2', labelId: 'ambience_2' },
    { type: 'ma', command: 'GoCue', space: 'a3', labelId: 'ambience_2' },
    { type: 'ma', command: 'GoCue', space: 'ls', labelId: 'ambience_2' },

    // Audio
    { type: 'watchout', command: 'start', timelineKey: 'bg_music_2' },
    { type: 'qsys', command: 'RecallScene', scene: 'Ambience2' },
    { type: 'qsys', command: 'SetBgmMute', value: 0 }
  ]
};

const actions = recipes[id];
if (!actions) {
  msg.payload = { error: 'No recipe for playableId: ' + id, intent };
  return [null, msg];
}

msg.actions = actions;
msg.topic = 'orchestration/actions';
return [msg, null];