// Convert orchestration action style into the Watchout v2 control message schema.
// Input action examples:
//   { type:'watchout', command:'startTimeline', timelineKey:'show_1' }
//   { type:'watchout', command:'start', timelineKey:'show_1' }
//   { type:'watchout', command:'jumpToCue', timelineKey:'show_1', cueKey:'intro' }
//   { type:'watchout', command:'GotoCue', timelineKey:'show_1', cueKey:'intro' }
//
// Output:
//   msg.payload = { command: 'start'|'jumpToCue', timelineKey, cueId?, state? }

const p = msg.payload || {};
const action = p.action || {};
const cmd = String(action.command || '').toLowerCase();

let out = null;

if (cmd === 'starttimeline' || cmd === 'start') {
  out = { command: 'start', timelineKey: action.timelineKey };
} else if (cmd === 'stoptimeline' || cmd === 'stop') {
  out = { command: 'stop', timelineKey: action.timelineKey };
} else if (cmd === 'pausetimeline' || cmd === 'pause') {
  out = { command: 'pause', timelineKey: action.timelineKey };
} else if (cmd === 'jumptocue' || cmd === 'gotocue') {
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