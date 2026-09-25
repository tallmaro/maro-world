import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { normalizeLandmark, batchStaticGroups, disposeTree, libraryAction } from './assets.js';
import { places } from './places.js';

const v=a=>new THREE.Vector3(...a);
const clamp=THREE.MathUtils.clamp;
const tick=()=>new Promise(resolve=>requestAnimationFrame(resolve));

export class World {
  constructor(element,callbacks={}){
    this.element=element;this.callbacks=callbacks;this.models=new Map();this.pending=new Map();this.failures=new Set();this.active=null;this.viewName='overview';this.alive=true;this.frame=0;this.frames=0;this.tween=null;this.span=32;this.lastRenderMs=0;this.loaded=0;this.night=false;
    this.motion=matchMedia('(prefers-reduced-motion: reduce)');
    this.scene=new THREE.Scene();this.scene.background=new THREE.Color('#cce1ef');
    this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:'high-performance'});
    this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));this.renderer.outputColorSpace=THREE.SRGBColorSpace;this.renderer.toneMapping=THREE.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.12;
    this.renderer.shadowMap.enabled=false;this.renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    const canvas=this.renderer.domElement;canvas.tabIndex=0;canvas.setAttribute('aria-label','Interactive miniature world. Arrow keys rotate; plus and minus zoom; Home resets; Escape returns to the overview.');element.append(canvas);
    this.camera=new THREE.OrthographicCamera(-24,24,16,-16,.1,180);
    this.controls=new OrbitControls(this.camera,canvas);this.controls.enablePan=false;this.controls.enableDamping=false;this.controls.minPolarAngle=.2;this.controls.maxPolarAngle=Math.PI/2-.05;this.controls.minZoom=.5;this.controls.maxZoom=3;
    this.controls.addEventListener('change',()=>this.draw());
    this.controls.addEventListener('start',()=>{if(this.tween){this.tween=null;this.finishVisibility();}this.callbacks.onManual?.();});
    this.ambient=new THREE.HemisphereLight('#f5fcff','#728365',2.3);this.scene.add(this.ambient);
    this.sun=new THREE.DirectionalLight('#fff1d5',3.1);this.sun.position.set(-15,27,20);this.scene.add(this.sun,this.sun.target);
    this.fill=new THREE.DirectionalLight('#daeaf9',1.2);this.fill.position.set(10,10,-15);this.scene.add(this.fill);
    this.lamp=new THREE.PointLight('#ffd09a',0,8,2);this.scene.add(this.lamp);
    this.platforms=new Map();this.atlas=new THREE.Group();this.scene.add(this.atlas);
    this.buildAtlas();
    this.resizeObserver=new ResizeObserver(()=>this.resize());this.resizeObserver.observe(element);
    this.onKey=e=>{if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','Home'].includes(e.key)){e.preventDefault();if(e.key==='Home')this.active?this.view('place'):this.overview();else if(e.key==='+'||e.key==='=')this.zoom(1.15);else if(e.key==='-')this.zoom(1/1.15);else this.orbit(e.key==='ArrowLeft'?-.16:e.key==='ArrowRight'?.16:0,e.key==='ArrowUp'?-.12:e.key==='ArrowDown'?.12:0);}};
    canvas.addEventListener('keydown',this.onKey);
    let down=null;this.onDown=e=>{down={x:e.clientX,y:e.clientY,time:performance.now()};};this.onUp=e=>{if(down&&Math.hypot(e.clientX-down.x,e.clientY-down.y)<5&&performance.now()-down.time<600)this.pick(e);down=null;};canvas.addEventListener('pointerdown',this.onDown);canvas.addEventListener('pointerup',this.onUp);
    this.onLost=e=>{e.preventDefault();this.callbacks.onError?.('The 3D view was interrupted. The local stills and place index remain available.');this.dispose();};canvas.addEventListener('webglcontextlost',this.onLost);
    this.onVisibility=()=>{if(document.hidden&&this.tween){this.applyCamera(this.tween.to);this.tween=null;this.finishVisibility();}if(document.hidden){cancelAnimationFrame(this.frame);this.frame=0;}else this.draw();};document.addEventListener('visibilitychange',this.onVisibility);
    this.onMotion=()=>{if(this.motion.matches&&this.tween){this.applyCamera(this.tween.to);this.tween=null;this.finishVisibility();this.draw();}};this.motion.addEventListener('change',this.onMotion);
    this.resize();this.overview(true);this.loadAll();
  }

  buildAtlas(){
    const shape=new THREE.Shape(),w=5.35,h=5.3,r=1.6;
    shape.moveTo(-w+r,-h);shape.lineTo(w-r,-h);shape.quadraticCurveTo(w,-h,w,-h+r);shape.lineTo(w,h-r);shape.quadraticCurveTo(w,h,w-r,h);shape.lineTo(-w+r,h);shape.quadraticCurveTo(-w,h,-w,h-r);shape.lineTo(-w,-h+r);shape.quadraticCurveTo(-w,-h,-w+r,-h);
    const geometry=new THREE.ExtrudeGeometry(shape,{depth:.65,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.18,bevelThickness:.16,curveSegments:12});geometry.rotateX(-Math.PI/2);
    for(const place of places){
      const platform=new THREE.Group();platform.position.copy(v(place.position));platform.name=`island-${place.id}`;platform.userData.placeId=place.id;
      const land=new THREE.Mesh(geometry,new THREE.MeshStandardMaterial({color:place.id==='library'?'#d8cba7':'#bdcfa8',roughness:1}));land.position.y=-.9;platform.add(land);
      const edge=new THREE.Mesh(new THREE.CylinderGeometry(5.15,4.7,.3,64),new THREE.MeshStandardMaterial({color:'#879f80',roughness:1}));edge.scale.z=.96;edge.position.y=-1.06;platform.add(edge);
      this.platforms.set(place.id,platform);this.atlas.add(platform);
    }
    this.routes=new THREE.Group();this.atlas.add(this.routes);
    const paths=[[[ -8.2,-.28,-6.6],[-8.2,-.28,-1],[-8.2,-.28,6.6]], [[-8.2,-.28,6.6],[-2,-.28,5.8],[2,-.28,7.4],[8.2,-.28,6.6]],[[8.2,-.28,6.6],[9.1,-.28,0],[8.2,-.28,-6.6]],[[-8.2,-.28,-6.6],[-2,-.28,-7.4],[2,-.28,-5.9],[8.2,-.28,-6.6]]];
    const routeMaterial=new THREE.MeshStandardMaterial({color:'#eee4bf',roughness:1});
    for(const points of paths){const curve=new THREE.CatmullRomCurve3(points.map(v));const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,50,.3,8,false),routeMaterial);mesh.scale.y=.2;mesh.position.y=-.23;this.routes.add(mesh);}
    // Small, deliberately abstract wayfinding marker — not a person or likeness.
    this.marker=new THREE.Group();const stem=new THREE.Mesh(new THREE.CylinderGeometry(.028,.028,1.1,6),new THREE.MeshStandardMaterial({color:'#233c50'}));stem.position.y=.55;
    const flagGeo=new THREE.BufferGeometry().setFromPoints([v([0,1.1,0]),v([.75,.9,.04]),v([.02,.68,0])]);flagGeo.computeVertexNormals();const flag=new THREE.Mesh(flagGeo,new THREE.MeshStandardMaterial({color:'#68576d',side:THREE.DoubleSide}));this.marker.add(stem,flag);this.marker.position.set(0,0,0);this.atlas.add(this.marker);
  }

  async ensure(place){
    if(!this.alive)return null;
    if(this.models.has(place.id))return this.models.get(place.id);
    if(this.pending.has(place.id))return this.pending.get(place.id);
    const promise=(async()=>{
      this.callbacks.onStatus?.(`Unfolding ${place.name.toLowerCase()}…`);
      let timeout;
      try{
        const url=new URL(`../assets/${place.id}/landmark.js`,import.meta.url);if(this.failures.has(place.id))url.searchParams.set('retry',Date.now());
        const module=await Promise.race([import(url.href),new Promise((_,reject)=>{timeout=setTimeout(()=>reject(new Error('Model load timed out')),12000);})]);
        if(!this.alive)return null;
        const started=performance.now(),root=module.createLandmark(THREE);if(place.id==='room')batchStaticGroups(root);
        const host=normalizeLandmark(root,8.5);host.position.copy(v(place.position));host.userData.placeId=place.id;
        const item={root,host,module,buildMs:performance.now()-started};this.models.set(place.id,item);this.scene.add(host);this.failures.delete(place.id);this.loaded=this.models.size;
        if(place.id==='room')this.setLight(this.night);
        this.finishVisibility();this.draw();this.callbacks.onReady?.(place.id,this.loaded);return item;
      }catch(error){this.failures.add(place.id);this.callbacks.onLoadError?.(place.id,error.message);return null;}
      finally{clearTimeout(timeout);this.pending.delete(place.id);}
    })();this.pending.set(place.id,promise);return promise;
  }

  async loadAll(){for(const place of places){if(!this.alive)return;await this.ensure(place);await tick();}this.callbacks.onStatus?.(this.failures.size?'Some places could not load. Use Retry below.':'',!this.failures.size);}

  currentCamera(){return {position:this.camera.position.clone(),target:this.controls.target.clone(),span:this.span,zoom:this.camera.zoom};}
  applyCamera(state){this.camera.position.copy(state.position);this.controls.target.copy(state.target);this.span=state.span;this.camera.zoom=state.zoom??1;this.frustum();this.controls.update();}
  travel(to,immediate=false){
    if(!this.alive)return;
    this.tween=null;const from=this.currentCamera();
    if(immediate||this.motion.matches){this.applyCamera(to);this.finishVisibility();this.draw();return;}
    this.tween={from,to,start:performance.now(),duration:950};this.finishVisibility();this.draw();
  }
  overview(immediate=false){
    if(!this.alive)return;
    const library=this.models.get('library');if(library)library.module.setCutaway(library.root,false);
    this.active=null;this.viewName='overview';this.setLight(false);this.finishVisibility();
    const mobile=this.element.clientWidth<700,target=v(mobile?[0,3.8,0]:[-2.2,1,0]);
    const aspect=this.element.clientWidth/Math.max(1,this.element.clientHeight);
    this.travel({target,position:target.clone().add(v([14,28,39])),span:Math.max(mobile?29:27,(mobile?33:41)/aspect),zoom:1},immediate);
  }
  async visit(id){
    if(!this.alive)return;
    const place=places.find(p=>p.id===id);if(!place)return;this.active=id;this.viewName='place';this.setLight(false);
    const item=await this.ensure(place);if(!item||!this.alive||this.active!==id)return;
    if(id==='library')this.callbacks.onDoors?.(item.root.userData.entranceOpen);
    this.view('place');
  }
  view(name){
    if(!this.alive)return;
    const item=this.models.get(this.active);if(!item)return;
    this.viewName=name;const {root,module}=item;root.updateWorldMatrix(true,true);
    let pos=[11,9,14],target=[0,2,0],span=12.1;
    if(this.active==='library'){
      const study=['study','table','shelf'].includes(name);module.setCutaway(root,study);
      if(name==='study'){pos=[7,10,9];target=[0,.7,-.6];span=10.5;}
      if(name==='entrance'){const anchor=root.getObjectByName('entrance-anchor');pos=anchor.position.toArray();target=anchor.userData.cameraTarget;span=2.7;}
      if(name==='table'){const anchor=root.getObjectByName('study-seat-anchor');target=anchor.userData.cameraTarget;pos=[target[0]+1.6,3.6,target[2]+2.2];span=4.4;}
      if(name==='shelf'){pos=[.2,3.5,3.5];target=[-2.5,.9,-.6];span=5.8;}
    }
    if(this.active==='room'){
      pos=[10,8.8,12];target=[-.2,2.7,-.2];span=12.3;
      if(name==='desk'){pos=[7.8,7.2,11];target=[-.2,2.55,-1.5];span=7.9;}
      if(name==='shelves'){const center=new THREE.Box3().setFromObject(root.getObjectByName('tall-shelves')).getCenter(new THREE.Vector3());root.worldToLocal(center);target=center.toArray();pos=center.clone().add(v([6,3.4,10])).toArray();span=7.5;}
    }
    if(this.active==='stamba'){
      target=[0,2.55,0];
      if(name==='atrium'){pos=[5,5.8,10];target=[-2.5,2.4,.3];span=9;}
      if(name==='street'){pos=[-10,8.5,-14];target=[0,2.8,-.65];}
    }
    if(this.active==='qsi'){
      target=[0,1.4,0];span=11.5;
      if(name==='facade'){pos=[0,5.4,16];target=[0,1.9,-1.5];span=8.7;}
      if(name==='field'){pos=[3,13,11];target=[0,.3,1.9];span=9.2;}
    }
    root.updateWorldMatrix(true,true);const worldPos=root.localToWorld(v(pos)),worldTarget=root.localToWorld(v(target));
    const aspect=this.element.clientWidth/Math.max(1,this.element.clientHeight),scale=item.host.scale.x;
    const correctedSpan=Math.max(span,span*.95/aspect)*scale;
    this.marker.position.copy(item.host.position).add(v([4.8,0,4.5]));
    this.travel({position:worldPos,target:worldTarget,span:correctedSpan,zoom:1});this.callbacks.onView?.(name);
  }
  toggleDoors(){const item=this.models.get('library');if(!item)return false;const open=!item.root.userData.entranceOpen;item.module.setEntranceOpen(item.root,open);this.draw();return open;}
  setLight(night){
    this.night=night&&this.active==='room';this.ambient.intensity=this.night?.9:2.3;this.sun.intensity=this.night?.65:3.1;this.fill.intensity=this.night?.55:1.2;this.lamp.intensity=this.night?8:0;
    const root=this.models.get('room')?.root;if(root){root.updateWorldMatrix(true,true);const point=root.getObjectByName('pleated-lamp').userData.lightAnchor;this.lamp.position.copy(root.localToWorld(v(point)));}
    this.draw();
  }
  finishVisibility(){
    const all=!this.active||!!this.tween;
    for(const [id,item] of this.models)item.host.visible=all||id===this.active;
    for(const [id,platform] of this.platforms)platform.visible=all||id===this.active;
    this.routes.visible=all;this.marker.visible=!!this.active;
  }
  orbit(dx,dy=0){if(!this.alive)return;this.tween=null;const offset=this.camera.position.clone().sub(this.controls.target),s=new THREE.Spherical().setFromVector3(offset);s.theta+=dx;s.phi=clamp(s.phi+dy,.2,Math.PI/2-.05);this.camera.position.copy(this.controls.target).add(new THREE.Vector3().setFromSpherical(s));this.controls.update();this.finishVisibility();this.draw();this.callbacks.onManual?.();}
  zoom(factor){if(!this.alive)return;this.tween=null;this.camera.zoom=clamp(this.camera.zoom*factor,.5,3);this.camera.updateProjectionMatrix();this.finishVisibility();this.draw();}
  frustum(){const aspect=this.element.clientWidth/Math.max(1,this.element.clientHeight);this.camera.left=-this.span*aspect/2;this.camera.right=this.span*aspect/2;this.camera.top=this.span/2;this.camera.bottom=-this.span/2;this.camera.updateProjectionMatrix();}
  resize(){
    if(!this.alive)return;const width=this.element.clientWidth,height=this.element.clientHeight;if(width<1||height<1)return;
    this.renderer.setSize(width,height);this.frustum();
    if(this.models.size){this.active?this.view(this.viewName):this.overview(true);}this.draw();
  }
  draw(){if(!this.alive||this.frame||document.hidden)return;this.frame=requestAnimationFrame(time=>this.render(time));}
  render(time){
    this.frame=0;if(!this.alive)return;
    if(this.tween){const {from,to,start,duration}=this.tween,t=clamp((time-start)/duration,0,1),e=1-Math.pow(1-t,4);this.camera.position.lerpVectors(from.position,to.position,e);this.controls.target.lerpVectors(from.target,to.target,e);this.span=THREE.MathUtils.lerp(from.span,to.span,e);this.camera.zoom=THREE.MathUtils.lerp(from.zoom,to.zoom??1,e);this.frustum();this.controls.update();if(t>=1){this.tween=null;this.finishVisibility();}}
    const start=performance.now();this.renderer.render(this.scene,this.camera);this.lastRenderMs=performance.now()-start;this.frames++;this.renderer.domElement.dataset.ready='true';
    this.callbacks.onProject?.(places.map(place=>{const point=v(place.position).add(v(place.id==='library'?[0,7.1,-1]:[0,.35,5.2])).project(this.camera);return {id:place.id,x:(point.x+1)*this.element.clientWidth/2,y:(1-point.y)*this.element.clientHeight/2};}));
    if(this.tween)this.draw();
  }
  pick(event){
    const bounds=this.renderer.domElement.getBoundingClientRect(),pointer=new THREE.Vector2((event.clientX-bounds.left)/bounds.width*2-1,-(event.clientY-bounds.top)/bounds.height*2+1),ray=new THREE.Raycaster();ray.setFromCamera(pointer,this.camera);
    const targets=this.active?[this.models.get(this.active)?.host].filter(Boolean):[...this.models.values()].map(item=>item.host);
    const hits=ray.intersectObjects(targets,true).filter(hit=>{let o=hit.object;while(o){if(!o.visible)return false;o=o.parent;}return true;});if(!hits.length)return;
    let node=hits[0].object;
    while(node){
      if(this.active==='library'&&node.userData.type){this.view(libraryAction(node.userData.type));return;}
      if(!this.active&&node.userData.placeId){this.callbacks.onSelect?.(node.userData.placeId);return;}node=node.parent;
    }
  }
  diagnostics(){return {place:this.active,view:this.viewName,moving:!!this.tween,libraryCutaway:this.models.get('library')?.root.userData.cutaway,entranceOpen:this.models.get('library')?.root.userData.entranceOpen,loaded:this.models.size,visiblePlaces:[...this.models.values()].filter(m=>m.host.visible).length,drawCalls:this.renderer.info.render.calls,triangles:this.renderer.info.render.triangles,geometries:this.renderer.info.memory.geometries,textures:this.renderer.info.memory.textures,frames:this.frames,lastRenderSubmitMs:this.lastRenderMs,buildMs:Object.fromEntries([...this.models].map(([id,m])=>[id,Math.round(m.buildMs)])),roomMeshes:this.models.has('room')?(()=>{let n=0;this.models.get('room').root.traverse(o=>{if(o.isMesh)n++;});return n;})():0};}
  dispose(){
    if(!this.alive)return;this.alive=false;cancelAnimationFrame(this.frame);this.frame=0;this.tween=null;this.resizeObserver.disconnect();document.removeEventListener('visibilitychange',this.onVisibility);this.motion.removeEventListener('change',this.onMotion);
    const canvas=this.renderer.domElement;canvas.removeEventListener('keydown',this.onKey);canvas.removeEventListener('pointerdown',this.onDown);canvas.removeEventListener('pointerup',this.onUp);canvas.removeEventListener('webglcontextlost',this.onLost);this.controls.dispose();disposeTree(this.scene);this.renderer.renderLists.dispose();this.renderer.dispose();canvas.remove();this.models.clear();
  }
}
