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

// If nothing selected yet, default to first key
const keys = Object.keys(devices);
if (!flow.get('idrac_selected_name') && keys.length) {
  flow.set('idrac_selected_name', keys[0]);
}

msg.payload = {
  deviceCount: keys.length,
  selected: flow.get('idrac_selected_name')
};
return msg;