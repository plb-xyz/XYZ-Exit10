
// Parses WATCHOUT getStatus Reply and stores structured object in flow context.
// Reply format:
//   Reply "<showName>" <busy> <health> <displayOpen> <showActive> <programmerOnline>
//         <currentTimeMs> <playing> <timelineRate> <standby> [<durationMs>]

const raw = msg.payload;
if (!raw || !raw.startsWith("Reply")) return msg;

// Tokenize: handle quoted strings and bare tokens
const tokens = [];
let i = 0;
const s = raw.trim();
while (i < s.length) {
    if (s[i] === '"') {
        let j = i + 1;
        let str = "";
        while (j < s.length) {
            if (s[j] === '\\' && j + 1 < s.length) { str += s[j+1]; j += 2; }
            else if (s[j] === '"') { j++; break; }
            else { str += s[j++]; }
        }
        tokens.push(str);
        i = j;
    } else if (s[i] === ' ') {
        i++;
    } else {
        let j = i;
        while (j < s.length && s[j] !== ' ') j++;
        tokens.push(s.substring(i, j));
        i = j;
    }
}

// tokens[0] = "Reply"
const healthMap = { "0": "OK", "1": "Suboptimal", "2": "Problems", "3": "Dead" };

const devId   = env.get("deviceid");
const devName = env.get("name");
const ip      = env.get("ip");

const status = {
    ip:               ip,
    deviceid:         devId,
    name:             devName,
    showName:         tokens[1]  || "",
    busy:             tokens[2]  === "true",
    health:           parseInt(tokens[3] || "0"),
    healthLabel:      healthMap[tokens[3]] || "Unknown",
    displayOpen:      tokens[4]  === "true",
    showActive:       tokens[5]  === "true",
    programmerOnline: tokens[6]  === "true",
    currentTimeMs:    parseInt(tokens[7]  || "0"),
    playing:          tokens[8]  === "true",
    timelineRate:     parseFloat(tokens[9]  || "1"),
    standby:          tokens[10] === "true",
    durationMs:       tokens[11] !== undefined ? parseInt(tokens[11]) : null,
    updatedAt:        Date.now()
};

// Store in flow context keyed by deviceid (falls back to ip)
const key = "wo6." + (devId || ip.replace(/\./g, "_"));
flow.set(key, status);

msg.wo6status = status;
return msg;
