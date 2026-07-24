(() => {
  const canonicalEvents = new Set([
    'page_view', 'section_view', 'scroll_depth', 'reading_depth_selected',
    'article_complete', 'decision_path_started', 'decision_path_step',
    'decision_path_completed', 'search_submitted', 'search_no_results',
    'newsletter_attributed', 'newsletter_signup', 'member_verified',
    'topic_preference_selected', 'career_stage_selected', 'depth_selected',
    'lesson_started', 'lesson_completed', 'case_opened', 'quiz_started',
    'quiz_completed', 'decision_started', 'related_decision_selected',
    'membership_cta_selected', 'for_you_recommendation_selected', 'intelligence_action',
    'homepage_decision_selected', 'homepage_situation_submitted', 'unmet_decision_requested',
    'compensation_episode_started', 'decision_library_cta_clicked', 'colleague_share_started',
    'colleague_share_completed', 'decision_outcome_captured', 'intelligence_card_opened',
    'intelligence_card_closed', 'intelligence_product_selected', 'enterprise_interest_started'
  ]);
  const queue = [];
  const session = crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;

  function track(event, properties = {}) {
    if (!canonicalEvents.has(event)) return;
    const payload = {
      event,
      page: document.body.dataset.page || 'unknown',
      path: location.pathname,
      timestamp: new Date().toISOString(),
      session,
      properties
    };
    queue.push(payload);
    window.dispatchEvent(new CustomEvent('bomsociety:analytics', { detail: payload }));
  }

  window.BOMAnalytics = { track, queue };
  track('page_view', { referrer: document.referrer || null });

  const seen = new Set();
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    if (!entry.isIntersecting) return;
    const section = entry.target.dataset.trackSection;
    if (section && !seen.has(section)) {
      seen.add(section);
      track('section_view', { section });
    }
  }), { threshold: 0.35 });
  document.querySelectorAll('[data-track-section]').forEach(element => observer.observe(element));

  [25, 50, 75, 100].forEach(percent => {
    let fired = false;
    addEventListener('scroll', () => {
      if (fired) return;
      const maximum = document.documentElement.scrollHeight - innerHeight;
      const current = maximum > 0 ? scrollY / maximum * 100 : 100;
      if (current >= percent) {
        fired = true;
        track('scroll_depth', { percent });
      }
    }, { passive: true });
  });
})();
