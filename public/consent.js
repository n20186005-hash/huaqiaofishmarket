(() => {
  const KEY='huaqiao-consent-v2', DENY='huaqiao-analytics-denied', MARK='|huaqiao-analytics-denied|', ID='G-HXM22WWPKP';
  function denied(){try{if(sessionStorage.getItem(DENY)==='1')return true;}catch{}try{return window.name.includes(MARK);}catch{return false;}}
  function markDeny(value){try{value?sessionStorage.setItem(DENY,'1'):sessionStorage.removeItem(DENY);}catch{}try{window.name=window.name.split(MARK).join('')+(value?MARK:'');}catch{}}
  function read(){
    if(denied())return null;
    try{
      const saved=JSON.parse(localStorage.getItem(KEY)||'null');
      // A stale stored grant must not revive while writes are blocked.
      localStorage.setItem(KEY+'-write-check','1');localStorage.removeItem(KEY+'-write-check');
      return saved && typeof saved.analytics==='boolean'?saved:null;
    }catch{return null;}
  }
  function apply(grant){
    window['ga-disable-'+ID]=!grant;
    if(!grant){window.gtag?.('consent','update',{analytics_storage:'denied'});return;}
    window.dataLayer=window.dataLayer||[];
    window.gtag=window.gtag||function(){window.dataLayer.push(arguments);};
    window.gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    window.gtag('consent','update',{analytics_storage:'granted'});
    if(document.getElementById('huaqiao-ga4'))return;
    const script=document.createElement('script');script.id='huaqiao-ga4';script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+ID;document.head.appendChild(script);
    window.gtag('js',new Date());window.gtag('config',ID,{allow_google_signals:false,allow_ad_personalization_signals:false});
  }
  function save(analytics){
    analytics=analytics===true;markDeny(!analytics);apply(analytics);
    try{localStorage.setItem(KEY,JSON.stringify({analytics}));return true;}catch{return false;}
  }
  try { document.cookie='huaqiao_consent=; Max-Age=0; Path=/; SameSite=Lax'; } catch {}
  window.huaqiaoConsent={read,save};
  const saved=read();apply(saved?.analytics===true);
  const checkbox=document.getElementById('analytics'),status=document.getElementById('consent-status');
  if(checkbox)checkbox.checked=saved?.analytics===true;
  function message(stored) {
    return stored ? '分析偏好已儲存。' : '已在本頁立即套用，但無法儲存。拒絕會在可用的同一分頁儲存中保留；不能保證新分頁或其他瀏覽器沿用。';
  }
  function choose(value){const stored=save(value);if(banner)banner.setAttribute('data-open',stored?'false':'true');if(checkbox)checkbox.checked=value;if(status)status.textContent=message(stored);}
  const banner=document.getElementById('cookie-banner'),bannerStatus=document.getElementById('cookie-banner-status');
  if(banner)banner.setAttribute('data-open',(!saved&&!denied())?'true':'false');
  function bannerChoose(value){
    const stored=save(value);
    if(banner)banner.setAttribute('data-open',stored?'false':'true');
    if(bannerStatus)bannerStatus.textContent=stored?'':message(false);
  }
  document.getElementById('cookies-essential')?.addEventListener('click',()=>bannerChoose(false));
  document.getElementById('cookies-accept')?.addEventListener('click',()=>bannerChoose(true));
  document.getElementById('save-consent')?.addEventListener('click',()=>choose(checkbox?.checked===true));
  document.getElementById('reject-consent')?.addEventListener('click',()=>choose(false));
})();
