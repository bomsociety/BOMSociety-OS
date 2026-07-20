const toggle=document.querySelector('[data-menu-toggle]');const menu=document.querySelector('[data-menu]');if(toggle&&menu){toggle.addEventListener('click',()=>{const open=toggle.getAttribute('aria-expanded')==='true';toggle.setAttribute('aria-expanded',String(!open));menu.classList.toggle('is-open',!open);document.body.classList.toggle('menu-open',!open)});menu.addEventListener('click',e=>{if(e.target.matches('a')){toggle.setAttribute('aria-expanded','false');menu.classList.remove('is-open');document.body.classList.remove('menu-open')}})}
const tabs=document.querySelectorAll('[data-collection-tab]');const panels=document.querySelectorAll('[data-collection-panel]');tabs.forEach(tab=>tab.addEventListener('click',()=>{const key=tab.dataset.collectionTab;tabs.forEach(t=>t.classList.toggle('is-active',t===tab));panels.forEach(p=>p.hidden=p.dataset.collectionPanel!==key)}));
const search=document.querySelector('.decision-search');if(search){search.addEventListener('submit',event=>{const input=search.querySelector('input');if(!input.value.trim()){event.preventDefault();input.focus()}})}


const graph=document.querySelector('[data-bomgraph]');
if(graph){
  const topics=[...graph.querySelectorAll('[data-graph-topic]')];
  const links=[...graph.querySelectorAll('[data-link]')];
  const caption=graph.querySelector('[data-graph-caption]');
  const copy={
    contracts:'Contracts connect compensation, finance, ownership, and long-term flexibility.',
    compensation:'Compensation connects incentives, practice economics, contracts, and career value.',
    ai:'AI changes workflow, practice economics, risk, and the value of human judgment.',
    practice:'Practice decisions connect people, technology, compensation, ownership, and growth.',
    finance:'Finance connects career choices, contracts, ownership, risk, and optionality.',
    ownership:'Ownership connects control, equity, operations, capital, and exit paths.'
  };
  const clear=()=>{
    graph.classList.remove('is-focused');
    topics.forEach(t=>t.classList.remove('is-active'));
    links.forEach(l=>l.classList.remove('is-active'));
    if(caption)caption.textContent='Explore how one decision changes the others.';
  };
  const focus=topic=>{
    if(topic==='core'){clear();return}
    graph.classList.add('is-focused');
    topics.forEach(t=>t.classList.toggle('is-active',t.dataset.graphTopic===topic));
    links.forEach(l=>l.classList.toggle('is-active',l.dataset.link.split(' ').includes(topic)));
    if(caption)caption.textContent=copy[topic]||'Connected knowledge creates better decisions.';
  };
  topics.forEach(t=>{
    const topic=t.dataset.graphTopic;
    t.addEventListener('mouseenter',()=>focus(topic));
    t.addEventListener('focus',()=>focus(topic));
    t.addEventListener('mouseleave',clear);
    t.addEventListener('blur',clear);
  });
  graph.addEventListener('pointermove',e=>{
    if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
    const r=graph.getBoundingClientRect();
    const x=((e.clientX-r.left)/r.width-.5)*8;
    const y=((e.clientY-r.top)/r.height-.5)*8;
    graph.style.setProperty('--graph-x',`${x}px`);
    graph.style.setProperty('--graph-y',`${y}px`);
    topics.forEach((t,i)=>{
      const f=(i%3+1)/3;
      t.style.setProperty('--drift-x',`${x*f}px`);
      t.style.setProperty('--drift-y',`${y*f}px`);
    });
  });
  graph.addEventListener('pointerleave',()=>{
    topics.forEach(t=>{t.style.removeProperty('--drift-x');t.style.removeProperty('--drift-y')});
  });
}
