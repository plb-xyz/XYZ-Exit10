// QRC Fetch Initial State
// Triggered by Parse QRC Buffer output 2 (EngineStatus Active)
// Sends Component.GetControls for each mixer space to read current values.
// Wire: [Parse QRC Buffer output 2] → this node → [QRC TCP Out]
//
// The responses come back through tcp in → Parse QRC Buffer output 1
// → Parse QRC State Response → audio.init messages to the UI.
//
// NOTE: Component.GetControls requires the mixer components to be Named Components
// in the Q-SYS design. The Name must match the mixer names used in the cmd envelope
// (a1, a2, a3, ls). If Component.GetControls returns an error, check the exact
// component names in your Q-SYS design.

const spaces = ['a1', 'a2', 'a3', 'ls'];
let id = Date.now() % 1000000;

return spaces.map(space => ({
  topic: 'qrc.fetchState',
  _fetchSpace: space,
  payload: JSON.stringify({
    jsonrpc: '2.0',
    method: 'Component.GetControls',
    params: { Name: space },
    id: id++
  }) + '\u0000'
}));
