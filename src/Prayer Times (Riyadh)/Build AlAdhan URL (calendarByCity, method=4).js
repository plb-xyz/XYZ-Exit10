// Fetch Riyadh monthly prayer times via AlAdhan calendarByCity.
// Method=4 => Umm Al-Qura University, Makkah.
// Using aladhan.engconsults.com per request.

const now = new Date();
const year = now.getFullYear();
const month = now.getMonth() + 1; // 1-12

const city = encodeURIComponent("Riyadh");
const country = encodeURIComponent("Saudi Arabia");

msg.method = "GET";
msg.url = `https://api.aladhan.com/v1/calendarByCity/${year}/${month}?city=${city}&country=${country}&method=4`;

msg._pt = {
  year,
  month,
  city: "Riyadh",
  country: "Saudi Arabia",
  method: 4,
  source: "aladhan.engconsults.com",
  trigger: msg.topic || "manual"
};

return msg;