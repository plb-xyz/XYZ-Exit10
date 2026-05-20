// Parse ma-cue-mapping.json
var mapping = {};
try {
    mapping = JSON.parse(msg.payload);
} catch(e) {
    node.warn('[MA Cue Mapper] Mapping parse error, starting empty: ' + e.message);
}
mapping.a1  = (mapping.a1  && typeof mapping.a1  === 'object' && !Array.isArray(mapping.a1))  ? mapping.a1  : {};
mapping.a2  = (mapping.a2  && typeof mapping.a2  === 'object' && !Array.isArray(mapping.a2))  ? mapping.a2  : {};
mapping.a3  = (mapping.a3  && typeof mapping.a3  === 'object' && !Array.isArray(mapping.a3))  ? mapping.a3  : {};
mapping.ls  = (mapping.ls  && typeof mapping.ls  === 'object' && !Array.isArray(mapping.ls))  ? mapping.ls  : {};
mapping.cmd = (mapping.cmd && typeof mapping.cmd === 'object' && !Array.isArray(mapping.cmd)) ? mapping.cmd : {};
mapping.mx  = (mapping.mx  && typeof mapping.mx  === 'object' && !Array.isArray(mapping.mx))  ? mapping.mx  : {};
global.set('ma_cue_mapping', mapping);
var count = Object.keys(mapping.a1).length + Object.keys(mapping.a2).length +
            Object.keys(mapping.a3).length + Object.keys(mapping.ls).length +
            Object.keys(mapping.cmd).length + Object.keys(mapping.mx).length;
node.status({ fill: 'green', shape: 'dot', text: 'Mapping loaded: ' + count + ' entries' });
msg.payload = mapping;
msg.topic   = 'ma/cue-map/updated';
return msg;
