let inputStr = msg.payload.trim();
let spaceIndex = inputStr.indexOf(" ");

if (spaceIndex !== -1) {
    // A space was found! Split into Address and Argument
    msg.topic = inputStr.substring(0, spaceIndex); // Gets "/cmd"
    
    let argStr = inputStr.substring(spaceIndex + 1).trim(); // Gets '"Off Timecode 2"'
    
    // Remove literal quotes if you typed them, the OSC node doesn't need them
    if (argStr.startsWith('"') && argStr.endsWith('"')) {
        argStr = argStr.slice(1, -1);
    }
    
    msg.payload = argStr; // Set the argument
} else {
    // No spaces found (like "/cue/1/start"). The whole thing is the address.
    msg.topic = inputStr;
    msg.payload = "";
}

// Grab the port we saved from the button group (default to 53000)
msg.port = flow.get("oscPort") || 53000; 

return msg;