
// ── WATCHOUT v6 Command Builder ──────────────────────────────────────────────
// msg.action  : command name  e.g. "run", "halt", "gotoControlCue"
// msg.payload : params object e.g. { cue: "MyScene", reverse: false }
//               OR a raw string to append after the command
//               OR null/undefined for zero-param commands
//
// Subflow env: ip, deviceid, name
//
// Output:
//   msg.payload  = "command param1 param2\r\n"  (TCP-ready string)
//   msg.wo6      = { ip, deviceid, name, command }
// ─────────────────────────────────────────────────────────────────────────────

const action  = msg.action;
const params  = msg.payload;
const ip      = env.get("ip");
const devId   = env.get("deviceid");
const devName = env.get("name");

if (!action) {
    node.warn("[WO6 " + devName + "] msg.action is required");
    return null;
}

// Quote a string value per WATCHOUT protocol (UTF-8, backslash-escaped)
function q(s) {
    return '"' + String(s).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '"';
}

// Build parameter string from payload 
function buildParams(cmd, p) {
    if (p === null || p === undefined) return "";
    if (typeof p !== "object") return String(p);

    const actions = {
        "load"           : ["path", "showName", "conditionFlags", "goOnline", "managedLoad", "master"],
        "gotoTime"       : ["time", "timeline"],
        "gotoControlCue" : ["cue", "reverse", "timeline"],
        "standBy"        : ["enable", "fadeRate"],
        "setInput"       : ["name", "value", "rate"],
        "online"         : ["enable"],
        "run"            : ["timeline"],
        "halt"           : ["timeline"],
        "kill"           : ["timeline"],
        "enableLayerCond": ["flags"],
        "hitTest"        : ["x", "y"],
        "timecodeMode"   : ["mode", "offset"],
        "serialPort"     : ["open", "port", "protocol", "baud", "dataBits", "stopBits", "parity"],
        "getStatus": []
    };

    const parts = [];

    // setInputs: rate then repeated name/value pairs from p.inputs array
    if (cmd === "setInputs") {
        parts.push(p.rate !== undefined ? p.rate : 0);
        if (Array.isArray(p.inputs)) {
            p.inputs.forEach(pair => { parts.push(q(pair.name)); parts.push(pair.value); });
        }
        return parts.join(" ");
    }

    const action = actions[cmd];
    const keys  = action || Object.keys(p);
    keys.forEach(key => {
        if (p[key] === undefined) return;
        const v = p[key];
        if      (typeof v === "string")  parts.push(q(v));
        else if (typeof v === "boolean") parts.push(v ? "true" : "false");
        else                             parts.push(v);
    });

    return parts.join(" ");
}

const paramStr = buildParams(action, params);
const command  = paramStr ? (action + " " + paramStr) : action;

msg.payload = command + "\r\n";
msg.wo6 = { ip: ip, deviceid: devId, name: devName, command: command };

return msg;
