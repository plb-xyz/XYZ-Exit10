// Expected input (msg.payload):
//   Timelines:
//     { command: "start"|"stop"|"pause", timelineKey: "show_1" }
//     { command: "playAll" }
//     { command: "getState" }
//
//   Jump to Time:
//     { command: "jumpToTime", timelineKey: "show_1", milliseconds: 12345, state?: "pause"|"play" }
//
//   Jump to Cue:
//     { command: "jumpToCue", timelineKey: "show_1", cueKey: "shows", state?: "pause"|"play" }
//     Resolves timelineKey → watchoutTimelineId and cueKey → watchoutCueId from mapping.
//
//   Get Timeline Cues:
//     { command: "getCues", timelineKey: "show_1" }
return msg;