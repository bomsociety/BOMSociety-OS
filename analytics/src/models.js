/** Read-model contracts only: founders get operational totals; enterprises get cohort aggregates. */
export function createFounderDashboardRecord({ date, events = 0, sessions = 0, newsletterSignups = 0, verifiedMembers = 0, topTopics = [] }) {
  return { date, events, sessions, newsletterSignups, verifiedMembers, topTopics };
}
export function createEnterpriseIntelligenceRecord({ period, topic, cohortSize, searches, completions, decisionPaths }) {
  if (cohortSize < 10) throw new RangeError("enterprise cohorts require at least 10 anonymous participants");
  return { period, topic, cohortSize, searches, completions, decisionPaths };
}
