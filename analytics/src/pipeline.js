import { EVENT_SCHEMA_VERSION, validateEvent } from "./event-schema.js";
import { analyticsActor } from "./identity.js";
import { classifyBot } from "./bot-detection.js";

export class ConsentAwarePipeline {
  constructor({ transport, identity, consent = () => "unknown", clock = () => new Date(), botClassifier = classifyBot, botContext = () => ({}) }) {
    this.transport = transport; this.identity = identity; this.consent = consent; this.clock = clock; this.botClassifier = botClassifier; this.botContext = botContext;
  }
  create(type, properties = {}, context = {}, isVerified = false) {
    const sessionId = this.identity.sessionId;
    return { schemaVersion: EVENT_SCHEMA_VERSION, eventId: crypto.randomUUID(), type, version: 1, occurredAt: this.clock().toISOString(), trace: { traceId: crypto.randomUUID(), sessionId }, actor: analyticsActor(this.identity, isVerified), consent: this.consent(), context: { path: context.path || "/", referrer: context.referrer || null, ...context }, properties };
  }
  async track(type, properties, context, isVerified = false) {
    const event = this.create(type, properties, context, isVerified);
    const errors = validateEvent(event);
    if (errors.length) return { accepted: false, reason: "invalid", errors };
    if (event.consent !== "granted") return { accepted: false, reason: "consent" };
    const bot = this.botClassifier(this.botContext());
    if (bot.isBot) return { accepted: false, reason: "bot", bot };
    await this.transport.send([event]);
    return { accepted: true, event };
  }
}
