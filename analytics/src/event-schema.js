export const EVENT_SCHEMA_VERSION = 1;
export const EVENT_TYPES = Object.freeze([
  "page_view", "section_view", "scroll_depth", "reading_depth_selected", "article_complete",
  "decision_path_started", "decision_path_step", "decision_path_completed", "search_submitted",
  "search_no_results", "newsletter_attributed", "newsletter_signup", "member_verified"
]);
export const CONSENT_STATES = Object.freeze(["granted", "denied", "unknown"]);
export const ACTOR_KINDS = Object.freeze(["anonymous", "verified_member"]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Validate the canonical, non-identifying analytics envelope. */
export function validateEvent(event) {
  const errors = [];
  if (!event || typeof event !== "object" || Array.isArray(event)) return ["event must be an object"];
  const allowed = new Set(["schemaVersion", "eventId", "type", "version", "occurredAt", "trace", "actor", "consent", "context", "properties"]);
  if (Object.keys(event).some(key => !allowed.has(key))) errors.push("event contains unsupported fields");
  if (event.schemaVersion !== EVENT_SCHEMA_VERSION) errors.push("unsupported schemaVersion");
  if (!UUID.test(event.eventId || "")) errors.push("eventId must be a UUID");
  if (!EVENT_TYPES.includes(event.type)) errors.push("unsupported event type");
  if (!Number.isInteger(event.version) || event.version < 1) errors.push("version must be a positive integer");
  if (Number.isNaN(Date.parse(event.occurredAt))) errors.push("occurredAt must be an ISO timestamp");
  if (!event.trace || !UUID.test(event.trace.traceId || "") || !UUID.test(event.trace.sessionId || "")) errors.push("trace.traceId and trace.sessionId must be UUIDs");
  if (!event.actor || !ACTOR_KINDS.includes(event.actor.kind) || !UUID.test(event.actor.anonymousId || "")) errors.push("actor must include an allowed kind and anonymousId UUID");
  if (event.actor.memberId !== undefined) errors.push("memberId is prohibited in analytics events");
  if (!CONSENT_STATES.includes(event.consent)) errors.push("invalid consent state");
  if (!event.context || typeof event.context.path !== "string" || !event.context.path.startsWith("/")) errors.push("context.path must be a relative path");
  if (!event.properties || typeof event.properties !== "object" || Array.isArray(event.properties)) errors.push("properties must be an object");
  if (containsForbiddenData(event.properties)) errors.push("properties contain prohibited identifying data");
  return errors;
}

function containsForbiddenData(value, key = "") {
  const forbidden = /(?:email|name|phone|npi|physician|member_?id|address|user_?id)/i;
  if (forbidden.test(key)) return true;
  if (typeof value === "string") return /@|\b\d{3}[-. )]?\d{3}[-.]?\d{4}\b/.test(value);
  return value && typeof value === "object" && Object.entries(value).some(([k, v]) => containsForbiddenData(v, k));
}
