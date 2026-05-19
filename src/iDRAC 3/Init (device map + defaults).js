const devices = {
  "Watchout Production 1": "10.154.10.141",
  "Watchout Production 2": "10.154.10.142",
  "Watchout Display 1": "10.154.10.151",
  "Watchout Display 2": "10.154.10.152",
  "Watchout Display 3": "10.154.10.153",
  "Watchout Display 4": "10.154.10.154",
  "Watchout Display 5": "10.154.10.155",
  "Watchout Display 6": "10.154.10.156",
  "Watchout Display 7": "10.154.10.157",
  "Watchout Display 8": "10.154.10.158",
  "Watchout Display 9": "10.154.10.159",
  "Qsys Core 1": "10.154.10.203",
  "Qsys Core 2": "10.154.10.204"
};
flow.set('idrac_devices', devices);

const names = Object.keys(devices).sort((a,b)=>a.localeCompare(b));
if (!flow.get('idrac_selected_name') && names.length) {
  flow.set('idrac_selected_name', names[0]);
}

// shared UI model
if (!flow.get('idrac_ui')) {
  flow.set('idrac_ui', {
    device: flow.get('idrac_selected_name') || '—',
    powerState: 'Unknown',
    lastStatusUpdate: '—',
    lastCommand: '—',
    lastCommandResult: '—'
  });
}

msg.options = names.map(n => ({label:n, value:n}));
msg.payload = flow.get('idrac_selected_name') || '';
return msg;