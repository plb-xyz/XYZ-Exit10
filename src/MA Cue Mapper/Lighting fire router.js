'use strict';

var p = msg.payload || {};
var action = p.action;

function makeFire(space, labelId) {
  return { payload: { action: 'fire', space: space, labelId: labelId } };
}

if (action === 'fire') {
  if (!p.space || !p.labelId) return null;
  return makeFire(p.space, p.labelId);
}

if (action === 'fireMany') {
  var spaces = Array.isArray(p.spaces) ? p.spaces : [];
  if (!p.labelId || spaces.length === 0) return null;

  // Explicitly emit one message per space
  spaces.forEach(function (sp) {
    node.send(makeFire(sp, p.labelId));
  });

  // Return nothing because we've already sent them
  return null;
}

return null;