// 1. Get the true/false state from the "All" switch
let state = msg.payload;

// 2. Save this state to the flow context so the individual logic knows about it
flow.set('atrium1', state);
flow.set('atrium2', state);
flow.set('atrium3', state);

// 3. Send the payload to all 3 outputs to update the individual UI switches
return [
    { payload: state }, // Goes to Atrium 1
    { payload: state }, // Goes to Atrium 2
    { payload: state }  // Goes to Atrium 3
];