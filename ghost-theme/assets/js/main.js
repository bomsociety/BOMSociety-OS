/* Navigation is progressive enhancement; the canonical homepage is complete without JavaScript. */
(()=>{
  const toggle=document.querySelector('[data-menu-toggle]');
  const menu=document.querySelector('[data-menu]');
  if(!toggle||!menu)return;
  toggle.addEventListener('click',()=>{
    const open=toggle.getAttribute('aria-expanded')==='true';
    toggle.setAttribute('aria-expanded',String(!open));
    toggle.setAttribute('aria-label',open?'Open navigation':'Close navigation');
    menu.classList.toggle('is-open',!open);
    document.body.classList.toggle('menu-open',!open);
  });
  menu.addEventListener('click',event=>{
    if(!event.target.matches('a'))return;
    toggle.setAttribute('aria-expanded','false');
    toggle.setAttribute('aria-label','Open navigation');
    menu.classList.remove('is-open');
    document.body.classList.remove('menu-open');
  });
})();
