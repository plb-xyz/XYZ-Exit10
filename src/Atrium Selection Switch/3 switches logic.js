// 1. msg.topic tells us which switch triggered this (atrium1, atrium2, or atrium3)
// Update that specific atrium's state in the flow context
flow.set(msg.topic, msg.payload);

// 2. Read the current state of all 3 atriums
let a1 = flow.get('atrium1') || false;
let a2 = flow.get('atrium2') || false;
let a3 = flow.get('atrium3') || false;

// 3. Check if ALL of them are true
let allChecked = (a1 && a2 && a3);

// 4. Send this result to the "All Atriums" switch to update its UI
return { payload: allChecked };