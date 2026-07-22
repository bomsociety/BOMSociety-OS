/**
 * Converts one validated knowledge object into channel-specific drafts. The caller
 * supplies claim statements when they want them included in the generated copy.
 */
export function importKnowledgeObject(knowledgeObject, { claims = [] } = {}) {
  const claimLines = claims.map(({ statement }) => `- ${statement}`).join("\n");
  const articleBody = [knowledgeObject.summary, claimLines].filter(Boolean).join("\n\n");
  const metaDescription = knowledgeObject.summary.slice(0, 160);

  return {
    ghostArticle: {
      title: knowledgeObject.title,
      slug: knowledgeObject.slug,
      html: `<p>${escapeHtml(knowledgeObject.summary)}</p>${claimLines ? `<ul>${claims.map(({ statement }) => `<li>${escapeHtml(statement)}</li>`).join("")}</ul>` : ""}`,
      custom_excerpt: knowledgeObject.summary,
      meta_title: knowledgeObject.title,
      meta_description: metaDescription,
      tags: [knowledgeObject.kind]
    },
    newsletterDraft: {
      subject: knowledgeObject.title,
      previewText: metaDescription,
      bodyMarkdown: `# ${knowledgeObject.title}\n\n${articleBody}`
    },
    podcastScript: {
      title: knowledgeObject.title,
      segments: [{ heading: "Introduction", narration: knowledgeObject.summary }, ...claims.map(({ statement }) => ({ heading: "Key point", narration: statement }))]
    },
    faq: [{ question: `What should I know about ${knowledgeObject.title}?`, answer: knowledgeObject.summary }],
    seoMetadata: { title: knowledgeObject.title, description: metaDescription, canonicalPath: `/${knowledgeObject.slug}/` }
  };
}

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}
