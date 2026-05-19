// Dashboard 2 ui-table: send msg.payload as an ARRAY of row objects.
// If you send {columns, rows}, the table will show "columns" and "rows" as fields (wrong).

const p = msg.payload;

// accept both upstream shapes
let month = null;
if (p && typeof p === "object") {
  if (Array.isArray(p.month)) month = p.month;                 // {month:[...]}
  else if (p.kind === "month" && Array.isArray(p.data)) month = p.data; // {kind:'month', data:[...]}
}

if (!Array.isArray(month)) {
  node.warn("No month array found; nothing sent to ui-table.");
  return null;
}

// Build rows (these keys become the columns)
msg.payload = month.map((d) => ({
  Date: d.dateISO || "",
  Fajr: d.fajr || "",
  Dhuhr: d.dhuhr || "",
  Asr: d.asr || "",
  Maghrib: d.maghrib || "",
  Isha: d.isha || ""
}));

// Force replace (works even if the node is set to Append in UI)
msg.ui_control = { action: "replace" };

return msg;