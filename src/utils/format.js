let symbol = "Rs.";
export const setCurrencySymbol = (s) => { if (s) symbol = s; };

/** Nepali digit grouping: 100000 -> "Rs. 1,00,000" */
export function money(value, { decimals = 0, sign = false } = {}) {
  const n = Number(value ?? 0);
  if (Number.isNaN(n)) return `${symbol} 0`;
  const s = Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return `${n < 0 ? "-" : sign && n > 0 ? "+" : ""}${symbol} ${s}`;
}
export const num = (v) => Number(v ?? 0).toLocaleString("en-IN");
export function compact(v) {
  const n = Number(v ?? 0);
  if (n >= 10_000_000) return (n / 10_000_000).toFixed(1).replace(/\.0$/, "") + "Cr";
  if (n >= 100_000) return (n / 100_000).toFixed(1).replace(/\.0$/, "") + "L";
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
export const pct = (v, d = 1) => `${(Number(v ?? 0) * 100).toFixed(d)}%`;
export const date = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—");
export const shortDate = (v) => (v ? new Date(v).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "");
export function daysLeft(end) {
  if (!end) return null;
  return Math.ceil((new Date(end) - new Date()) / 86_400_000);
}
export const cap = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, " ") : "");
export const PLATFORM_LABEL = { youtube: "YouTube Shorts", tiktok: "TikTok", instagram: "Instagram Reels", facebook: "Facebook" };

/** Flatten DRF error payloads into one readable message. */
export function errMsg(e, fallback = "Something went wrong. Please try again.") {
  const d = e?.response?.data;
  if (!d) return e?.message === "Network Error" ? "Can't reach the server. Check your connection." : fallback;
  if (typeof d === "string") return d.slice(0, 200);
  if (d.detail) return String(d.detail);
  const parts = [];
  const walk = (o, k) => {
    if (Array.isArray(o)) o.forEach((x) => walk(x, k));
    else if (o && typeof o === "object") Object.entries(o).forEach(([kk, v]) => walk(v, kk));
    else parts.push(k && k !== "non_field_errors" ? `${cap(k)}: ${o}` : String(o));
  };
  walk(d);
  return parts.join(" · ") || fallback;
}
export const fieldErrors = (e) => {
  const d = e?.response?.data;
  return d && typeof d === "object" && !d.detail ? Object.fromEntries(Object.entries(d).map(([k, v]) => [k, Array.isArray(v) ? v[0] : typeof v === "object" ? JSON.stringify(v) : v])) : {};
};
