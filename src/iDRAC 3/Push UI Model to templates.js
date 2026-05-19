const ui = flow.get('idrac_ui') || {
  device: flow.get('idrac_selected_name') || '—',
  powerState: 'Unknown',
  lastStatusUpdate: '—',
  lastCommand: '—',
  lastCommandResult: '—'
};

// Send to BOTH templates: big tile + operator panel
return [
  { payload: ui },
  { payload: ui }
];