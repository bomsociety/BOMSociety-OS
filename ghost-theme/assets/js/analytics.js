(() => {
  const canonicalEvents = new Set([
    'page_view', 'section_view', 'scroll_depth', 'reading_depth_selected',
    'article_complete', 'decision_path_started', 'decision_path_step',
    'decision_path_completed', 'search_submitted', 'search_no_results',
    'newsletter_attributed', 'newsletter_signup', 'member_verified'
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
