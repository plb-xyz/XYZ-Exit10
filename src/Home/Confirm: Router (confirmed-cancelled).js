const p = msg?.payload;
if (!p || p.ui !== 'confirmResult' || !p.id) return null;

const key = 'd2_confirm_pending_' + p.id;
const original = flow.get(key);
flow.set(key, null);

if (!original) return null;

original.payload = {
  ...(original.payload && typeof original.payload === 'object' ? original.payload : {}),
  confirmed: !!p.confirmed,
  confirmId: p.id
};

if (p.confirmed) return [original, null];
return [null, original];