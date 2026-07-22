/**
 * Deterministic publishing projections for a canonical Knowledge Object.
 * This module never calls an AI service and never fills missing evidence.
 */
export const PUBLISHING_ENGINE_VERSION = "1.0.0";
export const ARTIFACT_VERSION = "1.0.0";

export const SUPPORTED_OUTPUT_FORMATS = Object.freeze([
  "ghost_article", "weekly_newsletter", "podcast_script", "faq", "seo_metadata",
  "open_graph_metadata", "json_ld", "internal_link_recommendations",
  "related_topic_recommendations", "founder_dashboard_summary"
]);

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function copy(value) {
  return structuredClone(value);
}

function stringValue(value) {
  return typeof value === "string" ? value : "";
}

function sourceId(object) {
  return object.id ?? object.knowledge_object_id;
}

function summaries(object) {
  return {
    short: stringValue(object.summary30 ?? object.summaries?.short),
    medium: stringValue(object.summary120 ?? object.summaries?.medium),
    long: stringValue(object.summary300 ?? object.summaries?.long)
  };
}

function claimIds(object) {
  return object.claims.map(({ id }) => id);
}

function metadata(object, artifact) {
  return {
    artifact,
    artifact_version: ARTIFACT_VERSION,
    engine_version: PUBLISHING_ENGINE_VERSION,
    source_object_id: sourceId(object),
    source_object_version: object.version,
    claim_ids: claimIds(object)
  };
}

function projectedClaims(object) {
  // Copy every evidence field exactly, including empty arrays, objects, and strings.
  return object.claims.map((claim) => ({
    claim_id: claim.id,
    statement: claim.statement,
    evidence: copy(claim.evidence),
    evidence_placeholder: copy(claim.evidence_placeholder ?? null)
  }));
}

/** Return validation errors; an empty list means the object can be projected. */
export function validateKnowledgeObject(object) {
  const errors = [];
  if (!object || typeof object !== "object" || Array.isArray(object)) return ["Knowledge Object must be an object."];
  if (!UUID.test(sourceId(object) ?? "")) errors.push("Knowledge Object id must be a UUID.");
  if (!UUID.test(object.version ?? "")) errors.push("Knowledge Object version must be a UUID.");
  if (!stringValue(object.slug)) errors.push("Knowledge Object slug is required.");
  if (!stringValue(object.title)) errors.push("Knowledge Object title is required.");
  if (!Array.isArray(object.claims)) errors.push("Knowledge Object claims must be an array.");
  else object.claims.forEach((claim, index) => {
    if (!claim || !UUID.test(claim.id ?? "")) errors.push(`Claim ${index} id must be a UUID.`);
    if (!stringValue(claim?.statement)) errors.push(`Claim ${index} statement is required.`);
    if (!("evidence" in (claim ?? {}))) errors.push(`Claim ${index} must include evidence, even when empty.`);
  });
  return errors;
}

function requireValid(object) {
  const errors = validateKnowledgeObject(object);
  if (errors.length) throw new TypeError(`Invalid Knowledge Object: ${errors.join(" ")}`);
}

/** Convert one canonical Knowledge Object into all supported, non-publishing artifacts. */
export function generatePublishingBundle(object) {
  requireValid(object);
  const source = { object_id: sourceId(object), object_version: object.version, claim_ids: claimIds(object) };
  const summary = summaries(object);
  const claims = projectedClaims(object);
  const seoTitle = stringValue(object.seo?.title) || object.title;
  const seoDescription = stringValue(object.seo?.description) || summary.medium || summary.short;
  const canonicalUrl = stringValue(object.seo?.canonical_url);
  const relationships = copy(object.relationships ?? []);
  const relatedTopics = copy(object.related_topics ?? []);
  const artifact = (name, content) => ({ metadata: metadata(object, name), source, ...content });

  return {
    ghost_article: artifact("ghost_article", {
      post: { title: object.title, slug: object.slug, status: "draft", custom_excerpt: summary.short, html: null },
      content: { summary: summary.long || summary.medium || summary.short, claims }
    }),
    weekly_newsletter: artifact("weekly_newsletter", {
      subject: seoTitle,
      preview_text: summary.short,
      sections: [{ heading: object.title, summary: summary.medium || summary.short, claims }]
    }),
    podcast_script: artifact("podcast_script", {
      segments: [
        { role: "host", text: object.title, claim_ids: [] },
        { role: "narration", text: summary.medium || summary.short, claim_ids: [] },
        ...claims.map((claim) => ({ role: "narration", text: claim.statement, claim_ids: [claim.claim_id], evidence: claim.evidence, evidence_placeholder: claim.evidence_placeholder }))
      ]
    }),
    faq: artifact("faq", {
      items: claims.map((claim) => ({ question: `What does this Knowledge Object state about ${object.title}?`, answer: claim.statement, claim_ids: [claim.claim_id], evidence: claim.evidence, evidence_placeholder: claim.evidence_placeholder }))
    }),
    seo_metadata: artifact("seo_metadata", { title: seoTitle, description: seoDescription, canonical_url: canonicalUrl }),
    open_graph_metadata: artifact("open_graph_metadata", { "og:title": seoTitle, "og:description": seoDescription, "og:type": "article", "og:url": canonicalUrl }),
    json_ld: artifact("json_ld", {
      document: { "@context": "https://schema.org", "@type": "Article", identifier: sourceId(object), headline: object.title, description: seoDescription, url: canonicalUrl, mainEntity: claims.map((claim) => ({ "@type": "Claim", identifier: claim.claim_id, text: claim.statement, evidence: claim.evidence, evidence_placeholder: claim.evidence_placeholder })) }
    }),
    internal_link_recommendations: artifact("internal_link_recommendations", { links: relationships }),
    related_topic_recommendations: artifact("related_topic_recommendations", { topics: relatedTopics }),
    founder_dashboard_summary: artifact("founder_dashboard_summary", {
      title: object.title, slug: object.slug, status: object.status ?? "", claim_count: claims.length,
      evidence_placeholder_count: claims.filter((claim) => Array.isArray(claim.evidence) && claim.evidence.length === 0).length,
      internal_link_count: relationships.length, related_topic_count: relatedTopics.length
    })
  };
}
