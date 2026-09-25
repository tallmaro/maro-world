export function createMusic(element,win=window){
  let current=null,timer=null,frame=null,open=false,offline=!win.navigator.onLine;
  const stop=()=>{if(timer)win.clearTimeout(timer);timer=null;frame?.remove();frame=null;};
  const status=message=>{const node=element.querySelector('[data-music-status]');if(node)node.textContent=message;};
  function close(restore=true){stop();open=false;const panel=element.querySelector('[data-music-panel]');if(panel)panel.hidden=true;const button=element.querySelector('[data-music-toggle]');button?.setAttribute('aria-expanded','false');if(restore)button?.focus();}
  function load(){
    stop();if(offline||!win.navigator.onLine){status('You’re offline. The world still works; music needs an internet connection.');return;}
    const track=current.music;frame=win.document.createElement('iframe');frame.title=`${track.title} — official ${track.provider} player`;frame.src=track.embed;frame.height=String(track.height);frame.allow='encrypted-media; fullscreen; picture-in-picture';frame.referrerPolicy='no-referrer';
    frame.addEventListener('error',()=>{stop();status('The player could not load. Try again or use the official link.');});
    element.querySelector('[data-music-frame]').append(frame);
    status('Official player requested. Use its own Play control. Playback may be a preview or require sign-in.');
    timer=win.setTimeout(()=>status('If the player is blank or unavailable, use the official link. In-scene and full-track playback are not verified.'),12000);
  }
  function setPlace(place){
    stop();current=place;open=false;element.replaceChildren();if(!place)return;
    const track=place.music;
    element.innerHTML=`<button class="music-toggle" data-music-toggle aria-expanded="false" aria-controls="music-panel"><span class="record-icon" aria-hidden="true"></span><span>Music for this place<small></small></span><span aria-hidden="true">+</span></button><div id="music-panel" data-music-panel hidden><p class="track-title"></p><p class="track-version"></p><a class="official-link" target="_blank" rel="noreferrer noopener">Open in ${track.provider} <span aria-hidden="true">↗</span></a><p class="music-consent">Optional. Loading the player connects to ${track.provider}. It may be blank, preview-only, or require sign-in.</p><div class="music-actions"><button data-music-load>Load official player</button><button data-music-close>Close music</button></div><div data-music-frame></div><p class="fine-print" data-music-status role="status"></p></div>`;
    element.querySelector('.music-toggle small').textContent=`${track.artist} · ${track.title}`;
    element.querySelector('.track-title').textContent=`${track.artist} — ${track.title}`;
    element.querySelector('.track-version').textContent=track.version;
    element.querySelector('.official-link').href=track.url;
    element.querySelector('[data-music-toggle]').addEventListener('click',()=>{if(open){close();return;}open=true;element.querySelector('[data-music-panel]').hidden=false;element.querySelector('[data-music-toggle]').setAttribute('aria-expanded','true');});
    element.querySelector('[data-music-load]').addEventListener('click',load);element.querySelector('[data-music-close]').addEventListener('click',()=>close());
  }
  const onOffline=()=>{offline=true;stop();status('You’re offline. Music has been unloaded. Reconnect, then load it again if you wish.');};
  const onOnline=()=>{offline=false;};const onHide=()=>close(false);
  const onKey=e=>{if(e.key==='Escape'&&open){e.stopPropagation();close();}};
  win.addEventListener('offline',onOffline);win.addEventListener('online',onOnline);win.addEventListener('pagehide',onHide);element.addEventListener('keydown',onKey);
  return {setPlace,close,dispose(){stop();element.replaceChildren();win.removeEventListener('offline',onOffline);win.removeEventListener('online',onOnline);win.removeEventListener('pagehide',onHide);element.removeEventListener('keydown',onKey);}};
}
