/**
 * Deterministic, offline publishing transforms for Sprint 3 canonical knowledge objects.
 * This module never writes to Ghost or makes network requests.
 */
export const PUBLISHING_ENGINE_VERSION = "1.0.0";
export const ARTIFACT_TYPES = [
  "ghost-article", "weekly-newsletter", "podcast-script", "faq", "seo-metadata",
  "open-graph-metadata", "json-ld", "internal-link-recommendations",
  "related-topic-recommendations", "founder-dashboard-summary"
];

function clone(value) { return JSON.parse(JSON.stringify(value)); }
function text(value) { return typeof value === "string" ? value : ""; }
function claimIds(object) { return (object.claims ?? []).map(({ id }) => id); }
function canonicalVersion(object) { return object.version ?? null; }
function metadata(object, type) {
  return {
    artifact_type: type,
    artifact_version: PUBLISHING_ENGINE_VERSION,
    generated_from: {
      knowledge_object_uuid: object.id,
      knowledge_object_id: object.id,
      knowledge_object_version: canonicalVersion(object),
      claim_ids: claimIds(object),
      evidence_placeholders: clone(object.evidence_placeholders ?? [])
    },
    publication: { mode: "draft", published: false, network_requests: false }
  };
}
function artifact(object, type, payload) { return { ...metadata(object, type), payload }; }
function ordered(object, property) { return [...(object[property] ?? [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)); }
function articleHtml(object) {
  const sections = ordered(object, "lessons").map((lesson) =>
    `<section data-lesson-id="${lesson.id}"><h2>${lesson.title}</h2><p>${text(lesson.versions?.minutes_5)}</p></section>`
  ).join("");
  const claims = (object.claims ?? []).map((claim) => `<li data-claim-id="${claim.id}">${claim.statement}</li>`).join("");
  return `<p>${object.summary300 || object.summary120 || object.summary30 || ""}</p><h2>Claims</h2><ul>${claims}</ul>${sections}`;
}

export function generatePublishingArtifacts(object, { knowledgeObjects = [] } = {}) {
  if (!object?.id || !object?.title || !object?.slug) throw new Error("A canonical Knowledge Object with id, title, and slug is required.");
  const claims = object.claims ?? [];
  const lessons = ordered(object, "lessons");
  const description = text(object.seo?.description) || text(object.summary120) || text(object.summary30);
  const title = text(object.seo?.title) || object.title;
  const internalLinks = (object.relationships ?? []).map((relationship) => ({
    relationship_id: relationship.id, predicate: relationship.predicate, target_id: relationship.to_id,
    claim_ids: claims.filter((claim) => claim.decision_id === relationship.to_id).map((claim) => claim.id)
  }));
  const topicTags = new Set(object.taxonomy ?? []);
  const related = knowledgeObjects.filter((candidate) => candidate.id !== object.id).map((candidate) => ({
    knowledge_object_uuid: candidate.id, slug: candidate.slug, title: candidate.title,
    shared_taxonomy: (candidate.taxonomy ?? []).filter((tag) => topicTags.has(tag))
  })).filter((candidate) => candidate.shared_taxonomy.length > 0)
    .sort((a, b) => b.shared_taxonomy.length - a.shared_taxonomy.length || a.slug.localeCompare(b.slug));

  return {
    "ghost-article": artifact(object, "ghost-article", {
      title: object.title, slug: object.slug, status: "draft", html: articleHtml(object),
      tags: clone(object.taxonomy ?? []), custom_excerpt: text(object.summary120) || text(object.summary30),
      claim_traceability: claims.map((claim) => ({ claim_id: claim.id, evidence_ids: clone(claim.evidence_ids ?? []) }))
    }),
    "weekly-newsletter": artifact(object, "weekly-newsletter", {
      subject: title, preview_text: description, status: "draft",
      sections: lessons.map((lesson) => ({ lesson_id: lesson.id, title: lesson.title, body: text(lesson.versions?.minutes_2) })),
      claim_ids: claimIds(object)
    }),
    "podcast-script": artifact(object, "podcast-script", {
      title: object.title, status: "draft", segments: lessons.map((lesson) => ({
        lesson_id: lesson.id, title: lesson.title, narration: text(lesson.versions?.minutes_2), claim_ids: claims.filter((claim) => claim.decision_id === `decision:${object.slug}:${lesson.order}`).map((claim) => claim.id)
      }))
    }),
    faq: artifact(object, "faq", { status: "draft", items: claims.map((claim) => ({ claim_id: claim.id, question: `What should a review address for ${object.title}: ${object.decision_objects?.find((decision) => decision.id === claim.decision_id)?.title || claim.decision_id}?`, answer: claim.statement, evidence_ids: clone(claim.evidence_ids ?? []) })) }),
    "seo-metadata": artifact(object, "seo-metadata", { title, description, canonical_slug: object.slug, robots: "noindex,nofollow", claim_ids: claimIds(object) }),
    "open-graph-metadata": artifact(object, "open-graph-metadata", { "og:title": title, "og:description": description, "og:type": "article", "og:url": `/topic/${object.slug}/`, claim_ids: claimIds(object) }),
    "json-ld": artifact(object, "json-ld", { "@context": "https://schema.org", "@type": "Article", headline: object.title, description, identifier: object.id, isBasedOn: claimIds(object).map((id) => ({ "@type": "Claim", identifier: id })) }),
    "internal-link-recommendations": artifact(object, "internal-link-recommendations", { status: "draft", recommendations: internalLinks }),
    "related-topic-recommendations": artifact(object, "related-topic-recommendations", { status: "draft", recommendations: related }),
    "founder-dashboard-summary": artifact(object, "founder-dashboard-summary", { status: "draft", title: object.title, slug: object.slug, claim_count: claims.length, decision_count: (object.decision_objects ?? []).length, lesson_count: lessons.length, evidence_placeholder_count: (object.evidence_placeholders ?? []).length, corroboration_status: object.corroboration?.status ?? "", claim_ids: claimIds(object) })
  };
}
