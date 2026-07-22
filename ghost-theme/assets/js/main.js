const toggle=document.querySelector('[data-menu-toggle]');const menu=document.querySelector('[data-menu]');if(toggle&&menu){toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));menu.classList.toggle('is-open',!open);document.body.classList.toggle('menu-open',!open)});menu.addEventListener('click',e=>{if(e.target.matches('a')){toggle.setAttribute('aria-expanded','false');menu.classList.remove('is-open');document.body.classList.remove('menu-open')}})}
const tabs=document.querySelectorAll('[data-collection-tab]');const panels=document.querySelectorAll('[data-collection-panel]');tabs.forEach(tab=>tab.addEventListener('click',()=>{const key=tab.dataset.collectionTab;tabs.forEach(t=>t.classList.toggle('is-active',t===tab));panels.forEach(p=>p.hidden=p.dataset.collectionPanel!==key)}));
const search=document.querySelector('.decision-search');if(search){search.addEventListener('submit',event=>{const input=search.querySelector('input');if(!input.value.trim()){event.preventDefault();input.focus()}})}


const decisionInput = document.querySelector('[data-decision-input]');
const decisionSearch = document.querySelector('[data-decision-search]');
const decisionStatus = document.querySelector('[data-decision-status]');
const decisionCards = [...document.querySelectorAll('[data-decision-card]')];
const decisionChips = [...document.querySelectorAll('[data-decision-chip]')];

function normalizeDecisionQuery(value) {
  return value.toLowerCase().replace(/[^\w\s-]/g, ' ').replace(/\s+/g, ' ').trim();
}

function scoreDecisionCard(card, query) {
  if (!query) return 0;
  const haystack = normalizeDecisionQuery([
    card.dataset.keywords || '',
    card.textContent || ''
  ].join(' '));
  const terms = query.split(' ').filter(term => term.length > 1);
  return terms.reduce((score, term) => score + (haystack.includes(term) ? 1 : 0), 0);
}

function runDecisionFinder(rawQuery) {
  const query = normalizeDecisionQuery(rawQuery);
  if (!query) {
    if (decisionStatus) decisionStatus.textContent = 'Type a question or choose a suggested decision.';
    if (decisionInput) decisionInput.focus();
    return;
  }

  const ranked = decisionCards
    .map(card => ({ card, score: scoreDecisionCard(card, query) }))
    .sort((a, b) => b.score - a.score);

  decisionCards.forEach(card => {
    card.classList.remove('decision-match');
    card.removeAttribute('aria-current');
  });

  const best = ranked[0];
  if (!best || best.score === 0) {
    if (decisionStatus) decisionStatus.textContent = 'No exact match yet. Browse the decisions below or explore Topics.';
    window.BOMAnalytics?.track('search_no_results', { source: 'decision_finder', resultCount: 0 });
    document.querySelector('#decisions')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  best.card.classList.add('decision-match');
  best.card.setAttribute('aria-current', 'true');

  const title = best.card.querySelector('h3')?.textContent?.trim() || 'Recommended starting point';
  if (decisionStatus) decisionStatus.textContent = `Best starting point: ${title}`;
  best.card.scrollIntoView({ behavior: 'smooth', block: 'center' });

  window.BOMAnalytics?.track('search_submitted', {
    source: 'decision_finder',
    resultCount: 1,
    matchedDecisionId: best.card.dataset.decisionId
  });
}

decisionSearch?.addEventListener('click', () => runDecisionFinder(decisionInput?.value || ''));
decisionInput?.addEventListener('keydown', event => {
  if (event.key === 'Enter') {
    event.preventDefault();
    runDecisionFinder(decisionInput.value);
  }
});
decisionChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const value = chip.dataset.decisionChip || '';
    if (decisionInput) decisionInput.value = value;
    runDecisionFinder(value);
  });
});


decisionCards.forEach(card => {
  card.addEventListener('click', () => {
    window.BOMAnalytics?.track('decision_path_started', {
      source: 'homepage_decision_card',
      decisionId: card.dataset.decisionId,
      knowledgeObjectId: card.dataset.knowledgeObjectId
    });
  });
});

document.querySelectorAll('[data-homepage-event]').forEach(control => {
  control.addEventListener('click', () => {
    window.BOMAnalytics?.track(control.dataset.homepageEvent, {
      source: 'homepage_hero_cta',
      location: control.dataset.ctaLocation
    });
  });
});
