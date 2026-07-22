const keyFor = (date, granularity) => {
  const d = new Date(date); if (Number.isNaN(d)) throw new TypeError("invalid event date");
  if (granularity === "daily") return d.toISOString().slice(0, 10);
  if (granularity === "monthly") return d.toISOString().slice(0, 7);
  const day = d.getUTCDay() || 7; d.setUTCDate(d.getUTCDate() + 4 - day); return `${d.getUTCFullYear()}-W${String(Math.ceil((((d - new Date(Date.UTC(d.getUTCFullYear(), 0, 1))) / 86400000) + 1) / 7)).padStart(2, "0")}`;
};
export function aggregateEvents(events, granularity = "daily") {
  if (!["daily", "weekly", "monthly"].includes(granularity)) throw new TypeError("invalid granularity");
  const buckets = new Map();
  for (const event of events) { const key = keyFor(event.occurredAt, granularity); const b = buckets.get(key) || { period: key, events: 0, sessions: new Set(), byType: {} }; b.events++; b.sessions.add(event.trace.sessionId); b.byType[event.type] = (b.byType[event.type] || 0) + 1; buckets.set(key, b); }
  return [...buckets.values()].map(({ sessions, ...bucket }) => ({ ...bucket, sessions: sessions.size }));
}
export const aggregateDaily = events => aggregateEvents(events, "daily");
export const aggregateWeekly = events => aggregateEvents(events, "weekly");
export const aggregateMonthly = events => aggregateEvents(events, "monthly");
