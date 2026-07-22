# Measurement Engine architecture

## Boundaries

`identity` is a separate verified-member domain. It may retain a member ID and verification metadata, but `analyticsActor` emits only an anonymous UUID and a coarse actor kind. The canonical event validator rejects `memberId` plus common identifying fields in event properties. Enterprise read models accept aggregate topics and counts only, enforce a minimum anonymous cohort of 10, and never receive event-level or member-level records.

## Data flow

```text
Browser instrumentation
  -> ConsentAwarePipeline -> canonical validation -> consent gate -> bot classifier
  -> EventTransport interface -> first-party collection endpoint -> event store
  -> daily / weekly / monthly aggregation -> Founder read model
                                      \-> k-anonymous Enterprise intelligence read model
Verified-member identity service --(opaque verification boundary; no ID joins)--> member domain
```

## Event contract

Every event is versioned twice: `schemaVersion` identifies the envelope and `version` identifies the event revision. `eventId`, `trace.traceId`, `trace.sessionId`, and `actor.anonymousId` are UUIDs. The formal envelope is in `event.schema.json`; runtime validation is in `src/event-schema.js`.

Supported types: `page_view`, `section_view`, `scroll_depth`, `reading_depth_selected`, `article_complete`, `decision_path_started`, `decision_path_step`, `decision_path_completed`, `search_submitted`, `search_no_results`, `newsletter_attributed`, `newsletter_signup`, and `member_verified`.

## Interfaces

- `EventTransport` is vendor-neutral and has HTTP and in-memory implementations.
- `ConsentAwarePipeline` drops unknown or denied-consent events before transport and excludes classified bots.
- Instrumentation helpers cover reading depth, decision paths, search/no-result, and newsletter attribution without collecting raw query text or email addresses.
- `aggregateDaily`, `aggregateWeekly`, and `aggregateMonthly` return session-deduplicated totals and type counts.
