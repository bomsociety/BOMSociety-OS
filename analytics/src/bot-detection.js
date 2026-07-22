const BOT_UA = /bot|crawler|spider|slurp|headless|lighthouse|preview/i;
export function classifyBot({ userAgent = "", ratePerMinute = 0, automation = false } = {}) {
  const reasons = [];
  if (BOT_UA.test(userAgent)) reasons.push("bot_user_agent");
  if (automation) reasons.push("automation_signal");
  if (ratePerMinute > 120) reasons.push("rate_limit_exceeded");
  return Object.freeze({ isBot: reasons.length > 0, reasons });
}
