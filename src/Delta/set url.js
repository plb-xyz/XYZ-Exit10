return commandByAction(msg.action, msg)

function commandByAction(action, msg) {
    switch (action) {
        case 'getStatus':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/getStatus`;
            return msg;

        case 'getShortStatus':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/getShortStatus`;
            return msg;

        case 'getAudioLevel':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/getAudioLevel`;
            return msg;

        case 'getVideoLevel':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/getVideoLevel`;
            return msg;

        case 'setAudioLevel':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/setAudioLevel?value=${msg.payload}`;
            return msg;

        case 'setVideoLevel':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/setVideoLevel?value=${msg.payload}`;
            return msg;

        case 'getFrameRate':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/getFrameRate`;
            return msg;

        case 'startSequence':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/startSequence?sequenceName=${msg.payload}`;
            return msg;

        case 'pauseSequence':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/pauseSequence?sequenceName=${msg.payload}`;
            return msg;

        case 'resumeSequence':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/resumeSequence?sequenceName=${msg.payload}`;
            return msg;

        case 'cancelSequence':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/cancelSequence?sequenceName=${msg.payload}`;
            return msg;

        case 'play':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/play?tl=${msg.payload}`;
            return msg;

        case 'stop':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/stop?tl=${msg.payload}`;
            return msg;

        case 'rewind':
            msg.url = `http://${env.get('ip')}/api/delta/rpc/rewind?tl=${msg.payload}`;
            return msg;

        case 'advance':
            msg.url =
                `http://${env.get('ip')}/api/delta/rpc/advance?tl=${msg.payload.tl}&noFrames=${msg.payload.noFrames}`;
            return msg;

        case 'stepback':
            msg.url =
                `http://${env.get('ip')}/api/delta/rpc/stepback?tl=${msg.payload.tl}&noFrames=${msg.payload.noFrames}`;
            return msg;

        case 'setGlobalVar':
            msg.url =
                `http://${env.get('ip')}/api/delta/rpc/setGlobalVar?key=${msg.payload.variable}&value=${msg.payload.value}`;
            node.warn(`Setting global var ${msg.url}`);
            return msg;

        default:
            node.warn(`Unknown command action: ${action}`);
            return null;
    }
}