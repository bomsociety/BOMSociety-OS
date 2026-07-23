/* Keep Ghost Portal strictly user initiated and discard stale Portal deep links. */
(()=>{
  const portalHash=/^#\/portal\/(?:signup|signin)\/?$/i;
  const dismissedKey='bom-portal-dismissed';
  let returnFocus=null;

  const closePortal=()=>{
    window.portal?.close?.();
    sessionStorage.setItem(dismissedKey,'true');
    returnFocus?.focus?.();
  };

  const clearStalePortalHash=()=>{
    if(!portalHash.test(window.location.hash))return false;
    closePortal();
    window.history.replaceState(window.history.state,document.title,`${window.location.pathname}${window.location.search}`);
    return true;
  };

  document.querySelectorAll('[data-portal-trigger]').forEach(trigger=>trigger.addEventListener('click',()=>{
    returnFocus=trigger;
    sessionStorage.removeItem(dismissedKey);
  }));

  document.addEventListener('keydown',event=>{
    if(event.key==='Escape')closePortal();
  });

  window.BOMPortalGuard={clearStalePortalHash,closePortal};
  clearStalePortalHash();
})();
