import { places,courses } from './places.js';
import { createMusic } from './music.js';

const $=id=>document.getElementById(id),music=createMusic($('music'));
let world=null,current=null,webgl=true,lastTrigger=null;
const icons={arrow:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14m-6-6 6 6-6 6"/></svg>'};
const labels=new Map();
for(const place of places){const button=document.createElement('button');button.className='place-label';button.style.setProperty('--place-color',place.color);button.setAttribute('aria-label',`Explore ${place.name}`);button.innerHTML=`${place.name}${icons.arrow}`;button.addEventListener('click',()=>navigate(place.id,button));$('map-labels').append(button);labels.set(place.id,button);}
for(const area of [...new Set(courses.map(c=>c.area))]){const group=document.createElement('optgroup');group.label=area;courses.filter(c=>c.area===area).forEach(c=>{const option=document.createElement('option');option.textContent=c.title;option.value=String(courses.indexOf(c));group.append(option);});$('course-select').append(group);}
function updateCourse(){const course=courses[Number($('course-select').value)||0];$('course-area').textContent=`Area: ${course.area}`;$('course-title').textContent=course.title;$('takeaway').textContent='Favourite takeaway — not added yet.';}
$('course-select').addEventListener('change',updateCourse);updateCourse();
function updateViews(name){const selected=['table','shelf'].includes(name)?'study':name;document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.view===selected)));$('study-layer').hidden=current?.id!=='library'||(webgl&&!['study','table','shelf'].includes(name));}
function updateAvailability(){const ready=webgl&&!!world?.models.has(current?.id);$('place-panel').setAttribute('aria-busy',String(webgl&&!!current&&!ready));document.querySelectorAll('[data-view],[data-light],#study-table,#doors').forEach(b=>b.disabled=!ready);}
function showPlace(place){
  current=place;document.body.dataset.mode=place?'place':'overview';$('world-intro').hidden=!!place;$('chapter-labels').hidden=!!place;$('map-labels').hidden=!!place;$('back').hidden=!place;$('place-panel').hidden=!place;
  document.querySelectorAll('#place-nav button').forEach(b=>{const selected=b.dataset.place===(place?.id||'overview');if(selected)b.setAttribute('aria-current','true');else b.removeAttribute('aria-current');});
  music.setPlace(place);$('study-layer').hidden=webgl||place?.id!=='library';$('room-light').hidden=place?.id!=='room'||!webgl;
  document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.light==='day')));
  if(!place){$('fallback').querySelector('img').src='assets/library/preview.png';$('fallback').querySelector('img').alt='Original miniature of Bocconi library';return;}
  $('place-title').textContent=place.name;$('place-city').textContent=place.city;$('place-intro').textContent=place.intro;$('place-note').textContent=place.note;$('view-buttons').replaceChildren();
  for(const [name,label] of place.views){const button=document.createElement('button');button.textContent=label;button.dataset.view=name;button.disabled=!webgl;button.setAttribute('aria-pressed',String(name==='place'));button.addEventListener('click',()=>{world?.view(name);updateViews(name);});$('view-buttons').append(button);}
  $('fallback').querySelector('img').src=`assets/${place.id}/preview.png`;$('fallback').querySelector('img').alt=`Original miniature of ${place.name}`;
  if(place.id==='library'){$('doors').textContent='Close entrance doors';$('doors').setAttribute('aria-pressed','true');}
  updateAvailability();
}
function navigate(id,trigger=null,{history=true}={}){
  const place=places.find(p=>p.id===id)||null;lastTrigger=trigger||lastTrigger;showPlace(place);
  if(history){const hash=place?`#${place.id}`:'#world';if(location.hash!==hash)window.history.pushState(null,'',hash);}
  if(place){if(webgl)world?.visit(place.id);$('place-title').focus({preventScroll:true});}
  else{if(webgl)world?.overview();lastTrigger?.focus({preventScroll:true});}
  if(innerWidth<=700)window.scrollTo({top:0,behavior:'instant'});
}
document.querySelectorAll('#place-nav button').forEach(button=>button.addEventListener('click',()=>navigate(button.dataset.place,button)));
$('brand').addEventListener('click',()=>navigate(null,$('brand')));$('back').addEventListener('click',()=>navigate(null));
$('study-table').addEventListener('click',()=>world?.view('table'));
$('doors').addEventListener('click',()=>{const open=world?.toggleDoors();if(open===undefined)return;$('doors').setAttribute('aria-pressed',String(open));$('doors').textContent=open?'Close entrance doors':'Open entrance doors';});
document.querySelectorAll('[data-light]').forEach(button=>button.addEventListener('click',()=>{world?.setLight(button.dataset.light==='night');document.querySelectorAll('[data-light]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));}));
$('rotate-left').addEventListener('click',()=>world?.orbit(-.3));$('zoom-in').addEventListener('click',()=>world?.zoom(1.18));$('zoom-out').addEventListener('click',()=>world?.zoom(1/1.18));$('reset-view').addEventListener('click',()=>current?world?.view('place'):world?.overview());
function help(show){$('help-panel').hidden=!show;$('help-toggle').setAttribute('aria-expanded',String(show));if(!show)$('help-toggle').focus();}
$('help-toggle').addEventListener('click',()=>help($('help-panel').hidden));$('help-close').addEventListener('click',()=>help(false));
document.addEventListener('keydown',event=>{if(event.key!=='Escape')return;if(!$('help-panel').hidden){help(false);return;}if(current)navigate(null);});
window.addEventListener('popstate',()=>navigate(location.hash.slice(1),null,{history:false}));
$('retry-3d').addEventListener('click',()=>location.reload());
function fallback(message){webgl=false;document.body.dataset.webgl='false';$('place-panel').setAttribute('aria-busy','false');$('fallback').hidden=false;$('fallback-message').textContent=message;$('loading-status').dataset.complete='true';music.close(false);$('load-errors').hidden=true;document.querySelectorAll('[data-view],#study-table,#doors').forEach(b=>b.disabled=true);$('room-light').hidden=true;$('study-layer').hidden=current?.id!=='library';}
async function boot(){
  try{
    const {World}=await import('./world.js');
    world=new World($('scene'),{
      onSelect:id=>navigate(id,document.querySelector(`[data-place="${id}"]`)),
      onStatus:(message,complete=false)=>{$('loading-status').textContent=message;$('loading-status').dataset.complete=String(complete);},
      onReady:(id)=>{const error=document.querySelector(`[data-error="${id}"]`);error?.remove();if(!$('load-errors').children.length)$('load-errors').hidden=true;updateAvailability();},
      onLoadError:(id)=>{if(document.querySelector(`[data-error="${id}"]`))return;const row=document.createElement('p');row.dataset.error=id;row.textContent=`${places.find(p=>p.id===id).name} could not load.`;const retry=document.createElement('button');retry.textContent='Retry';retry.addEventListener('click',async()=>{retry.disabled=true;await world.ensure(places.find(p=>p.id===id));retry.disabled=false;if(current?.id===id)world.visit(id);if(world.models.size===4)$('loading-status').dataset.complete='true';});row.append(retry);$('load-errors').append(row);$('load-errors').hidden=false;},
      onError:fallback,onView:updateViews,onDoors:open=>{$('doors').textContent=open?'Close entrance doors':'Open entrance doors';$('doors').setAttribute('aria-pressed',String(open));},
      onProject:points=>{for(const {id,x,y} of points)labels.get(id).style.transform=`translate(-50%,-50%) translate(${x}px,${y}px)`;},
      onManual:()=>document.querySelectorAll('[data-view]').forEach(b=>b.setAttribute('aria-pressed','false'))
    });
    window.worldDiagnostics=()=>world.diagnostics();
    if(current)world.visit(current.id);
  }catch(error){world?.dispose();fallback('This browser could not start the 3D world. You can still explore each place using the index and original miniature stills.');}
}
showPlace(places.find(p=>p.id===location.hash.slice(1))||null);boot();
window.addEventListener('pagehide',event=>{music.close(false);if(!event.persisted)world?.dispose();});
window.addEventListener('pageshow',event=>{if(event.persisted&&webgl)world?.draw();});
