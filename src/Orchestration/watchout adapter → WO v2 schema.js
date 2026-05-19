// Convert orchestration action style into the Watchout v2 control message schema.
// Input action examples:
//   { type:'watchout', command:'startTimeline', timelineKey:'show_1' }
//   { type:'watchout', command:'GotoCue', timelineKey:'show_1', cueId:'intro' }
//
// Output:
//   msg.payload = { command: 'start'|'jumpToCue', timelineKey, cueId?, state? }

const p = msg.payload || {};
const action = p.action || {};
const cmd = String(action.command || '');

let out = null;

if (cmd === 'startTimeline') {
  out = { command: 'start', timelineKey: action.timelineKey };
} else if (cmd === 'stopTimeline') {
  out = { command: 'stop', timelineKey: action.timelineKey };
} else if (cmd === 'pauseTimeline') {
  out = { command: 'pause', timelineKey: action.timelineKey };
} else if (cmd === 'jumpToCue') {
  out = { command: 'jumpToCue', timelineKey: action.timelineKey, cueKey: action.cueKey, state: action.state || 'play' };
} else {
  // Unknown watchout command
  msg.payload = { error: 'Unknown watchout.command: ' + cmd, action, run: msg.run };
  return [null, msg];
}

msg.payload = out;
msg.topic = 'watchout/control';

// Output 1: link out to Watchout
// Output 2: error/debug
return [msg, null];