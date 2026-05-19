// Stores global truth in flow context:
// - flow.prayerTimes.month : array of days
// - flow.prayerTimes.today : today's object
// Also emits two UI messages:
// - { kind:'today', data: todayObj }
// - { kind:'month', data: monthArr }

function stripTZ(s) {
  // API returns e.g. "05:12 (+03)"; keep "05:12".
  if (typeof s !== 'string') return "";
  return s.split(' ')[0].trim();
}

const body = msg.payload;
if (!body || !Array.isArray(body.data)) {
  node.error("Unexpected AlAdhan response shape", msg);
  return null;
}

const monthDays = body.data.map((d) => {
  const greg = d?.date?.gregorian;

  // AlAdhan gregorian.date typically is "DD-MM-YYYY".
  // Convert to ISO "YYYY-MM-DD".
  let dateISO = "";
  if (typeof greg?.date === 'string') {
    const parts = greg.date.split('-');
    if (parts.length === 3) dateISO = `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  const t = d.timings || {};
  return {
    dateISO,
    weekday: greg?.weekday?.en || "",
    fajr: stripTZ(t.Fajr),
    dhuhr: stripTZ(t.Dhuhr),
    asr: stripTZ(t.Asr),
    maghrib: stripTZ(t.Maghrib),
    isha: stripTZ(t.Isha)
  };
});

const todayISO = new Date().toISOString().slice(0, 10);
const today = monthDays.find((x) => x.dateISO === todayISO) || null;

// ---- store global truth ----
flow.set('prayerTimes.month', monthDays);
flow.set('prayerTimes.today', today);

// Optional meta
flow.set('prayerTimes.meta', {
  ...(msg._pt || {}),
  fetchedAt: new Date().toISOString(),
  todayISO
});

const fetchedAt = flow.get('prayerTimes.meta')?.fetchedAt;

return [
  { payload: { kind: 'today', data: today, meta: msg._pt || {}, fetchedAt } },
  { payload: { kind: 'month', data: monthDays, meta: msg._pt || {}, fetchedAt } }
];