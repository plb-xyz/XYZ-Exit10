// Build msg.actions (an array of action objects) from msg.intent.key.
// This file is the source of truth for what each top-level playable contains
// (video/audio/lighting/etc steps and ordering).
//
// Per-system action contract — one vocabulary per system, no translation layers:
//
//   Watchout — exact hardware commands + own params:
//     { type: 'watchout', command: 'play',         timelineKey: 'show_1' }
//     { type: 'watchout', command: 'stop',         timelineKey: 'show_1' }
//     { type: 'watchout', command: 'jumpToCue',    timelineKey: 'show_1', cueKey: 'intro' }
//     { type: 'watchout', command: 'changeCueSet', timelineKey: 'main',   cueSetKey: 'show_1' }
//
//   MA — semantic, resolved via MA cue mapper:
//     { type: 'ma', command: 'GoCue',    target: 'a1', labelId: 'preshow' }
//     { type: 'ma', command: 'RunMacro', target: 'mx', labelId: 'reset_all' }
//
//   Q-Sys — scene-level:
//     { type: 'qsys', command: 'RecallScene', scene: 'preshow' }
//     { type: 'qsys', command: 'SetBgmMute',  value: 0 }
//
// Optional: label (string) — shown in debug panel only, never executed.
// Notes:
// - The Director executes actions in order.
// - Use waitMs to insert a delay before the next step.
// - Use waitFor to pause until a named status message arrives on the status bus.

const intent = msg.intent;
const key = intent.key;

function buildShowRecipe(showKey) {
  const showNum = String(showKey).replace('show_', '');
  return {
    onStart: [
      { label: 'Start A1 video transition', type: 'watchout', command: 'play', timelineKey: 'transition_a1' },
      { label: 'Start A2 video transition', type: 'watchout', command: 'play', timelineKey: 'transition_a2' },
      { label: 'Start A3 video transition', type: 'watchout', command: 'play', timelineKey: 'transition_a3' },
      { label: 'MA — preshow cue',          type: 'ma',       command: 'GoCue',        target: 'mx', labelId: 'preshow' },
      { label: 'Q-Sys — preshow snapshot',  type: 'qsys',     command: 'RecallScene', scene: 'preshow' },
      { label: 'Pharos — preshow cue',      type: 'pharos',   command: 'Trigger',      triggerId: 'preshow' }
    ],
    onCue: {
      all_opaque: [
        { label: `Start Show ${showNum} unified timeline`, type: 'watchout', command: 'play', timelineKey: showKey },
        { label: `Show ${showNum} — MA show cue`,          type: 'ma',       command: 'GoCue',        target: 'mx', labelId: showKey },
        { label: `Show ${showNum} — Q-Sys snapshot`,       type: 'qsys',     command: 'RecallScene', scene: showKey }
      ]
    },
    onEnd: [
      { label: 'Stop show timeline',         type: 'watchout', command: 'stop',         timelineKey: showKey },
      { label: 'MA — post-show return',      type: 'ma',       command: 'GoCue',        target: 'cmd', labelId: 'post_show_return' },
      { label: 'Q-Sys — return to ambience', type: 'qsys',     command: 'RecallScene', scene: 'ambience_bgm' }
    ]
  };
}

const recipes = {
  show_1: buildShowRecipe('show_1'),
  show_2: buildShowRecipe('show_2'),
  show_3: buildShowRecipe('show_3'),
  show_4: buildShowRecipe('show_4'),

  ambience_1: [
    // video
    { type: 'watchout', command: 'play', timelineKey: 'ambience_1_a1' },
    { type: 'watchout', command: 'play', timelineKey: 'ambience_1_a2' },
    { type: 'watchout', command: 'play', timelineKey: 'ambience_1_a3' },
    // lighting
    { type: 'ma', command: 'GoCue', target: 'a1', labelId: 'ambience_1' },
    { type: 'ma', command: 'GoCue', target: 'a2', labelId: 'ambience_1' },
    { type: 'ma', command: 'GoCue', target: 'a3', labelId: 'ambience_1' },
    { type: 'ma', command: 'GoCue', target: 'ls', labelId: 'ambience_1' },
    // audio
    { type: 'watchout', command: 'play', timelineKey: 'bg_music_1' },
    { type: 'qsys', command: 'RecallScene', scene: 'Ambience1' },
    { type: 'qsys', command: 'SetBgmMute', value: 0 }
  ],

  ambience_2: [
    // video
    { type: 'watchout', command: 'play', timelineKey: 'ambience_2_a1' },
    { type: 'watchout', command: 'play', timelineKey: 'ambience_2_a2' },
    { type: 'watchout', command: 'play', timelineKey: 'ambience_2_a3' },
    // lighting
    { type: 'ma',       command: 'GoCue', target: 'a1', labelId: 'ambience_2' },
    { type: 'ma',       command: 'GoCue', target: 'a2', labelId: 'ambience_2' },
    { type: 'ma',       command: 'GoCue', target: 'a3', labelId: 'ambience_2' },
    { type: 'ma',       command: 'GoCue', target: 'ls', labelId: 'ambience_2' },
    // audio
    { type: 'watchout', command: 'play', timelineKey: 'bg_music_2' },
    { type: 'qsys', command: 'RecallScene', scene: 'Ambience2' },
    { type: 'qsys', command: 'SetBgmMute', value: 0 }
  ]
};

function resolvePhase(actionName) {
  const a = String(actionName || 'start').toLowerCase();
  if (a === 'end' || a === 'stop') return 'onEnd';
  if (a === 'cue' || a === 'jump') return 'onCue';
  return 'onStart';
}

function resolveActions(recipe, currentIntent) {
  if (Array.isArray(recipe)) {
    return { actions: recipe, mode: 'flat' };
  }

  if (!recipe || typeof recipe !== 'object') {
    return { error: 'Recipe is not an array/object' };
  }

  const phase = resolvePhase(currentIntent.action);
  if (phase === 'onCue') {
    const cueName = currentIntent.cueName || null;
    const cueMap = recipe.onCue;

    if (Array.isArray(cueMap)) {
      return { actions: cueMap, mode: 'phased', phase };
    }
    if (cueMap && typeof cueMap === 'object') {
      if (cueName && Array.isArray(cueMap[cueName])) {
        return { actions: cueMap[cueName], mode: 'phased', phase, cueName };
      }
      if (Array.isArray(cueMap.default)) {
        return { actions: cueMap.default, mode: 'phased', phase, cueName: cueName || 'default' };
      }
    }
    return { error: 'No onCue recipe for cueName', phase, cueName };
  }

  const actions = recipe[phase];
  if (!Array.isArray(actions)) {
    return { error: `No ${phase} recipe`, phase };
  }

  return { actions, mode: 'phased', phase };
}

const recipe = recipes[key];
if (!recipe) {
  msg.payload = { error: 'No recipe for key: ' + key, intent };
  return [null, msg];
}

const resolved = resolveActions(recipe, intent);
if (resolved.error) {
  msg.payload = {
    error: resolved.error,
    intent,
    key,
    phase: resolved.phase,
    cueName: resolved.cueName
  };
  return [null, msg];
}

msg.actions = resolved.actions;
msg.recipeMeta = {
  key,
  mode: resolved.mode,
  phase: resolved.phase || null,
  cueName: resolved.cueName || null
};
msg.topic = 'orchestration/actions';
return [msg, null];