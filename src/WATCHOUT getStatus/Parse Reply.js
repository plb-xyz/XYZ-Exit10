const text = String(msg.payload || '');
const lines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean);

let replyLine = lines.find(line => line.startsWith('Reply '));
if (!replyLine) {
    msg.payload = {
        ok: false,
        raw: text,
        lines: lines,
        note: 'No Reply line found. You may only have received Ready or the timeout may be too short.'
    };
    return msg;
}

const m = replyLine.match(/^Reply\s+"([^"]*)"\s+(true|false)\s+(\d+)\s+(true|false)\s+(true|false)\s+(true|false)(?:\s+(\d+))?(?:\s+(true|false))?(?:\s+([-+]?\d*\.?\d+))?(?:\s+(true|false))?$/);

if (!m) {
    msg.payload = {
        ok: false,
        raw: text,
        replyLine: replyLine,
        note: 'Reply line found but parser did not match expected format.'
    };
    return msg;
}

msg.payload = {
    ok: true,
    showName: m[1],
    busy: m[2] === 'true',
    healthStatus: Number(m[3]),
    displayOpen: m[4] === 'true',
    showActive: m[5] === 'true',
    programmerOnline: m[6] === 'true',
    currentTimeMs: m[7] !== undefined ? Number(m[7]) : null,
    showPlaying: m[8] !== undefined ? m[8] === 'true' : null,
    timelineRate: m[9] !== undefined ? Number(m[9]) : null,
    standbyMode: m[10] !== undefined ? m[10] === 'true' : null,
    raw: text
};

return msg;