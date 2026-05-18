// Normalize the Watchout API response into a uniform JSON object

const statusCode = (msg.statusCode !== undefined && msg.statusCode !== null) ? msg.statusCode : 200;

const command            = msg._command;
const timelineKey        = msg._timelineKey;
const watchoutTimelineId = msg._watchoutTimelineId;
const displayName        = msg._displayName;
const cueKey             = msg._cueKey;
const watchoutCueId      = msg._watchoutCueId;

// Cue group state fields (optional)
const groupId     = msg._groupId;
const variantId   = msg._variantId;
const groupName   = msg._groupName;
const variantName = msg._variantName;
const states      = msg._states;

const out = {
    success:    statusCode < 300,
    command:    command,
    statusCode: statusCode,
    body:       msg.payload
};

if (timelineKey !== undefined) out.timelineKey = timelineKey;
if (watchoutTimelineId !== undefined) out.watchoutTimelineId = watchoutTimelineId;
if (displayName !== undefined) out.displayName = displayName;
if (cueKey !== undefined) out.cueKey = cueKey;
if (watchoutCueId !== undefined) out.watchoutCueId = watchoutCueId;

if (groupId !== undefined) out.groupId = groupId;
if (variantId !== undefined) out.variantId = variantId;
if (groupName !== undefined) out.groupName = groupName;
if (variantName !== undefined) out.variantName = variantName;
if (states !== undefined) out.states = states;

msg.payload = JSON.stringify(out);
msg.statusCode = 200;
msg.headers = { 'Content-Type': 'application/json' };
return msg;