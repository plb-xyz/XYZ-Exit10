'use strict';

// Produces a UI model:
// {
//   allAtriums: [ { labelId, displayName, spaces:["a1","a2"] } ... ],
//   sections: { a1:[...], a2:[...], a3:[...], ls:[...], cmd:[...], mx:[...] }
// }

var mapping = flow.get('ma_cue_mapping') || { a1: {}, a2: {}, a3: {}, ls: {}, cmd: {}, mx: {} };

function safeEntries(space) {
  var m = mapping[space];
  if (!m || typeof m !== 'object' || Array.isArray(m)) return [];
  return Object.keys(m).map(function(labelId) {
    var entry = m[labelId] || {};
    return { labelId: labelId, displayName: entry.displayName || labelId };
  }).sort(function(a, b) {
    return String(a.displayName).localeCompare(String(b.displayName));
  });
}

var sections = {
  a1:  safeEntries('a1'),
  a2:  safeEntries('a2'),
  a3:  safeEntries('a3'),
  ls:  safeEntries('ls'),
  cmd: safeEntries('cmd'),
  mx:  safeEntries('mx')
};

// Build All Atriums: labels that exist in 2+ of a1/a2/a3
var atriumSpaces = ['a1', 'a2', 'a3'];
var labelIndex = {};

atriumSpaces.forEach(function(sp) {
  (sections[sp] || []).forEach(function(row) {
    if (!labelIndex[row.labelId]) {
      labelIndex[row.labelId] = { labelId: row.labelId, displayName: row.displayName, spaces: {} };
    }
    labelIndex[row.labelId].spaces[sp] = true;
    if (!labelIndex[row.labelId].displayName && row.displayName) {
      labelIndex[row.labelId].displayName = row.displayName;
    }
  });
});

var allAtriums = Object.keys(labelIndex).map(function(labelId) {
  var rec = labelIndex[labelId];
  return { labelId: labelId, displayName: rec.displayName || labelId, spaces: Object.keys(rec.spaces) };
}).filter(function(rec) {
  return rec.spaces.length >= 2;
}).sort(function(a, b) {
  return String(a.displayName).localeCompare(String(b.displayName));
});

msg.topic = 'lighting/model';
msg.payload = { allAtriums: allAtriums, sections: sections };
return msg;
