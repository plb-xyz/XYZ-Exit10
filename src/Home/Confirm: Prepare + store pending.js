// Any node (e.g. ui-button) can trigger this.
// Optional: msg.confirm = { title, text, confirmText, cancelText, id }

const confirm = (msg.confirm && typeof msg.confirm === 'object') ? msg.confirm : {};

const id = confirm.id || msg._confirmId || (Date.now().toString(36) + Math.random().toString(36).slice(2));
msg._confirmId = id;

// Store ORIGINAL msg so we can output it back on confirm/cancel.
flow.set('d2_confirm_pending_' + id, msg);

// Send a UI control message to the ui-template
return {
  payload: {
    ui: 'openConfirm',
    id,
    title: confirm.title || msg.topic || 'Confirm',
    text: confirm.text || 'Are you sure?',
    confirmText: confirm.confirmText || 'Confirm',
    cancelText: confirm.cancelText || 'Cancel'
  }
};