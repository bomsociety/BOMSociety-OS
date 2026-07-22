/** Narrow helpers keep feature events consistently shaped and non-identifying. */
export const readingDepth = (pipeline, depth, articleId, context) => pipeline.track("reading_depth_selected", { depth, articleId }, context);
export const decisionPath = (pipeline, stage, pathId, step, context) => pipeline.track(`decision_path_${stage}`, { pathId, step }, context);
export const search = (pipeline, resultCount, context) => pipeline.track(resultCount ? "search_submitted" : "search_no_results", { resultCount }, context);
export const newsletterAttribution = (pipeline, campaign, source, context) => pipeline.track("newsletter_attributed", { campaign, source }, context);
