/**
 * Stamba, Tbilisi — original stylised architectural miniature.
 * No textures, imports, browser APIs, timers, lights or network requests.
 * See README.md for reference/interpretation boundaries and resource disposal.
 */
export function createLandmark(THREE) {
  const root = new THREE.Group();
  root.name = 'stamba-tbilisi';
  root.userData = {
    title: 'Stamba · Tbilisi',
    treatment: 'Compressed courtyard cutaway; not a surveyed reconstruction',
    up: 'Y', ground: 0, version: '1.0.1',
  };
  let seed = 54319;
  const rand = () => ((seed = (Math.imul(1664525, seed) + 1013904223) >>> 0) / 4294967296);
  const materials = {};
  function mat(name, color, roughness = 0.8, metalness = 0, extra = {}) {
    const m = new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra });
    m.name = name;
    materials[name] = m;
    return m;
  }
  mat('plinth', '#b7b4a3'); mat('edge', '#727a70');
  mat('paving', '#afa994'); mat('paving-light', '#c2b9a3');
  mat('concrete', '#bbbaa9'); mat('cut-concrete', '#d9d6c5');
  mat('stone', '#d4cbb7'); mat('stone-shadow', '#a9a994');
  mat('mortar', '#71675a'); mat('brick0', '#92745b');
  mat('brick1', '#a5876b'); mat('brick2', '#806c59');
  mat('brick3', '#b09276'); mat('brick4', '#967b63');
  mat('metal', '#293d39', 0.52, 0.4); mat('rust', '#78503c', 0.75, 0.2);
  mat('glass0', '#304e4b', 0.25, 0.15);
  mat('glass1', '#4c6258', 0.28, 0.12);
  mat('glass2', '#b2a67c', 0.48, 0.05, { emissive: '#c6a265', emissiveIntensity: 0.2 });
  mat('glass3', '#79908a', 0.32, 0.2);
  mat('wood0', '#947450'); mat('wood1', '#ac895f');
  mat('wood2', '#bb986d'); mat('wood3', '#8d6e4c');
  mat('walnut', '#654c39'); mat('book0', '#9e6048');
  mat('book1', '#697765'); mat('book2', '#c7bfa1');
  mat('book3', '#b99256'); mat('book4', '#425d58');
  mat('soil', '#4f5140'); mat('trunk', '#685844');
  mat('leaf0', '#3d6344'); mat('leaf1', '#587746');
  mat('leaf2', '#6e8b53'); mat('leaf3', '#7f995d');
  mat('terracotta', '#a46c51'); mat('linen', '#d9cfb3');
  mat('sage', '#819083'); mat('pink', '#bf8478');
  mat('brass', '#b19157', 0.36, 0.6);
  mat('light', '#ffdda0', 0.45, 0, { emissive: '#ffbf69', emissiveIntensity: 0.9 });
  mat('neon', '#e7a36c', 0.45, 0, { emissive: '#ff7336', emissiveIntensity: 1.4 });

  const geometries = {
    box: new THREE.BoxGeometry(1, 1, 1),
    cylinder: new THREE.CylinderGeometry(1, 1, 1, 12),
    pot: new THREE.CylinderGeometry(1, 0.72, 1, 12),
    sphere: new THREE.SphereGeometry(1, 12, 8),
    crown: new THREE.IcosahedronGeometry(1, 1),
  };
  // Double-curved leaf, actual geometry rather than alpha-cutout textures.
  const leafPositions = [0,0,0, -0.16,0.38,0.05, 0,0.48,0.12, 0.16,0.38,0.05, 0,1,0];
  const leafGeo = new THREE.BufferGeometry();
  leafGeo.setAttribute('position', new THREE.Float32BufferAttribute(leafPositions, 3));
  leafGeo.setIndex([0,1,2, 0,2,3, 1,4,2, 2,4,3, 2,1,0, 3,2,0, 2,4,1, 3,4,2]);
  leafGeo.computeVertexNormals();
  geometries.leaf = leafGeo;
  const buckets = new Map();
  const dummy = new THREE.Object3D();
  function group(name, parent = root, position = [0, 0, 0], rotation = 0) {
    const g = new THREE.Group(); g.name = name;
    g.position.set(...position); g.rotation.y = rotation;
    parent.add(g); return g;
  }
  function put(g, geo, material, p, s, r = [0,0,0]) {
    const key = `${g.id}/${geo}/${material}`;
    if (!buckets.has(key)) buckets.set(key, { g, geo, material, matrices: [] });
    dummy.position.set(...p); dummy.scale.set(...s); dummy.rotation.set(...r);
    dummy.updateMatrix(); buckets.get(key).matrices.push(dummy.matrix.clone());
  }
  const box = (g, m, p, s, r) => put(g, 'box', m, p, s, r);
  const cyl = (g, m, p, radius, height) => put(g, 'cylinder', m, p, [radius, height, radius]);
  function beam(g, m, from, to, width = 0.035, depth = width) {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), d = b.clone().sub(a);
    dummy.position.copy(a.add(b).multiplyScalar(0.5));
    dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), d.clone().normalize());
    dummy.scale.set(width, d.length(), depth); dummy.updateMatrix();
    const key = `${g.id}/box/${m}`;
    if (!buckets.has(key)) buckets.set(key, {g, geo:'box', material:m, matrices:[]});
    buckets.get(key).matrices.push(dummy.matrix.clone());
  }
  function solid(g, name, geo, m, p = [0,0,0], r = [0,0,0]) {
    const mesh = new THREE.Mesh(geo, materials[m]); mesh.name = name;
    mesh.position.set(...p); mesh.rotation.set(...r);
    mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh); return mesh;
  }
  function slab(g, w, d, h, y, material, name) {
    const shape = new THREE.Shape(), c = 0.22;
    const pts = [[-w/2+c,-d/2],[w/2-c,-d/2],[w/2,-d/2+c],[w/2,d/2-c],
      [w/2-c,d/2],[-w/2+c,d/2],[-w/2,d/2-c],[-w/2,-d/2+c]];
    shape.moveTo(...pts[0]); pts.slice(1).forEach(p=>shape.lineTo(...p)); shape.closePath();
    const geo = new THREE.ExtrudeGeometry(shape, {depth:h, bevelEnabled:false});
    geo.rotateX(-Math.PI/2); geo.translate(0,y,0);
    return solid(g,name,geo,material);
  }
  const ground = group('diorama-ground');
  slab(ground,9.6,8.2,0.18,0,'plinth','chamfered-stone-base');
  slab(ground,9.42,8.02,0.075,0.18,'paving','courtyard-ground');
  box(ground,'edge',[0,0.065,4.04],[8.95,0.035,0.035]);
  for(let x=-4.2;x<4.5;x+=0.5) for(let z=-3.6;z<3.9;z+=0.52) {
    box(ground,rand()>.7?'paving-light':'paving',[x,0.26,z],[0.484,0.015,0.506]);
  }

  // Window normal is local +Z. Frames have real depth and fine mullions.
  function window(g,x,y,z,w,h,lit=false) {
    box(g,'metal',[x,y,z],[w+0.09,h+0.1,0.12]);
    box(g,lit?'glass2':`glass${[0,0,1,3][Math.floor(rand()*4)]}`,[x,y,z+0.069],[w,h,0.025]);
    const cols = w>1 ? 4 : 3, rows = h>1.3 ? 5 : 4;
    for(let c=1;c<cols;c++) box(g,'metal',[x-w/2+w*c/cols,y,z+0.096],[0.024,h,0.028]);
    for(let r=1;r<rows;r++) box(g,'metal',[x,y-h/2+h*r/rows,z+0.096],[w,0.025,0.028]);
    box(g,'stone-shadow',[x,y-h/2-0.075,z+0.1],[w+0.19,0.055,0.21]);
  }
  function brickFace(g,w,h,z,windows=[]) {
    // Recess backing on every edge: only one finish owns each exposed end cap.
    box(g,'mortar',[0,0.255+h/2,z-0.055],[w-0.024,h-0.016,0.145]);
    const bh=0.12,bw=0.30;
    for(let row=0;row<Math.floor(h/bh);row++) {
      const y=0.255+row*bh+bh/2;
      for(let x=-w/2+bw/2-(row%2)*bw/2;x<w/2;x+=bw) {
        const left=Math.max(-w/2,x-bw/2),right=Math.min(w/2,x+bw/2);
        if(right-left<0.02) continue;
        if(windows.some(a=> Math.abs(x-a.x)<a.w/2+0.06 && Math.abs(y-a.y)<a.h/2+0.08)) continue;
        box(g,`brick${Math.floor(rand()*5)}`,[(left+right)/2,y,z+0.035+(rand()-.5)*.012],
          [right-left-0.012,bh-0.012,0.052]);
      }
    }
    for(const a of windows) window(g,a.x,a.y,z+0.054,a.w,a.h,a.lit);
  }

  // A compressed rear wing. Inner brick / outer pale preserved street frontage.
  const courtyard = group('brick-courtyard');
  box(courtyard,'concrete',[0,3.08,-2.65],[8.25,5.65,1.3]);
  const back = group('warehouse-window-wall',courtyard,[0,0,-1.945]);
  const wins=[];
  for(let row=0;row<4;row++) for(let i=0;i<5;i++) {
    wins.push({x:-3.28+i*1.64,y:1.06+row*1.36,w:1.14,h:.95,lit:(i+row)%5===0});
  }
  brickFace(back,8.3,5.58,0,wins);
  for(let i=0;i<6;i++) box(back,'brick2',[-4.10+i*1.64,3.05,0.13],[0.09,5.55,0.12]);
  for(let y of [0.4,5.69,5.88]) box(back,'stone-shadow',[0,y,0.10],[8.48,0.085,0.24]);
  // Flat parapet and discreet industrial roof vents, no fictitious rooftop amenities.
  box(courtyard,'metal',[0,5.91,-2.65],[8.45,0.09,1.51]);
  for(const x of [-4.13,4.13]) box(courtyard,'stone',[x,5.97,-2.65],[0.11,0.17,1.5]);
  for(let x of [-2.5,1.7]) {
    box(courtyard,'stone-shadow',[x,6.01,-2.75],[0.42,0.16,0.49]);
    box(courtyard,'metal',[x,6.11,-2.75],[0.48,0.06,0.55]);
  }
  const street=group('heritage-street-facade',root,[0,0,-3.335],Math.PI);
  box(street,'stone',[0,3.06,0],[8.3,5.6,0.11]);
  for(let i=0;i<6;i++) for(let row=0;row<4;row++) {
    window(street,-3.425+i*1.37,1.08+row*1.36,0.075,1.01,1.07,row===0&&i===2);
  }
  for(let i=0;i<7;i++) {
    const x=-4.12+i*1.373;
    box(street,'stone',[x,3.15,0.15],[0.18,5.42,0.22]);
    for(let y=0.5;y<5.7;y+=0.5) box(street,'stone-shadow',[x,y,0.267],[0.177,0.011,0.012]);
  }
  for(const y of [0.38,5.77,5.97]) box(street,'stone',[0,y,0.13],[8.54,0.13,0.35]);
  // Long entrance canopy and a row of warm bare-bulb lights verified in the gallery.
  const entry=group('entrance-canopy',street);
  box(entry,'rust',[0,1.91,0.43],[2.65,0.13,0.86]);
  box(entry,'wood1',[0,1.842,0.43],[2.54,0.025,0.80]);
  for(const x of [-1.05,1.05]) beam(entry,'rust',[x,1.96,0.78],[x,2.78,0.13],0.024);
  for(let x=-1.1;x<=1.11;x+=.36) for(const z of [.18,.43,.69]) {
    cyl(entry,'brass',[x,1.805,z],.025,.035);
    put(entry,'sphere','light',[x,1.77,z],[.033,.035,.033]);
  }
  // Model lettering is original block geometry, not a borrowed logo/font texture.
  const glyphs={S:['111','100','111','001','111'],T:['111','010','010','010','010'],A:['010','101','111','101','101'],M:['10001','11011','10101','10001','10001'],B:['110','101','110','101','110']};
  let pen=-0.92;
  for(const ch of 'STAMBA') {
    const rows=glyphs[ch],cw=.068;
    rows.forEach((row,yy)=>[...row].forEach((bit,xx)=>{if(bit==='1')box(entry,'stone',[pen+xx*cw,2.45-yy*cw,.28],[.058,.057,.035]);}));
    pen+=(rows[0].length+1)*cw;
  }

  // Open-front jungle lobby: structure, galleries, shelves, trees and furniture.
  const atrium=group('jungle-atrium');
  box(atrium,'mortar',[-4.01,2.88,0.2],[.18,5.25,4.126]);
  const outer=group('west-brick-elevation',atrium,[-4.12,0,.2],-Math.PI/2);
  const ow=[];
  for(let r=0;r<4;r++) for(let c=0;c<3;c++) ow.push({x:-1.34+c*1.34,y:.96+r*1.28,w:.88,h:.91,lit:false});
  brickFace(outer,4.15,5.25,0,ow);
  box(atrium,'wood0',[-3.12,.3,.1],[1.86,.08,4.2]);
  for(let z=-1.7;z<2.25;z+=.23) box(atrium,'wood2',[-3.11,.348,z],[1.83,.015,.22]);
  for(const x of [-3.92,-2.24]) for(const z of [-1.7,.18,2.13]) {
    box(atrium,'cut-concrete',[x,2.96,z],[.19,5.42,.23]);
    box(atrium,'concrete',[x,.45,z],[.29,.22,.33]);
  }
  for(const y of [1.83,3.2,4.57,5.63]) {
    for(const z of [-1.7,.18,2.13]) box(atrium,'cut-concrete',[-3.08,y,z],[1.99,.17,.22]);
    box(atrium,'cut-concrete',[-2.24,y,.2],[.18,.17,4.1]);
    box(atrium,'concrete',[-3.73,y,.2],[.44,.13,4.1]);
    if(y<5.6) {
      for(let z=-1.55;z<2.16;z+=.28) box(atrium,'metal',[-3.5,y+.26,z],[.015,.46,.02]);
      box(atrium,'metal',[-3.5,y+.48,.2],[.026,.025,4.04]);
    }
  }
  // Red-brown vertical remnants of the printing-house industrial equipment.
  for(const z of [-1.15,1.42]) {
    for(const x of [-3.02,-2.75]) box(atrium,'rust',[x,3.12,z],[.045,5.13,.08]);
    for(let y=.73;y<5.7;y+=.35) box(atrium,'rust',[-2.885,y,z],[.31,.045,.095]);
  }
  const shelving=group('lobby-bookshelves',atrium);
  for(let z=-1.55;z<1.91;z+=.86) {
    box(shelving,'walnut',[-3.84,1.03,z],[.22,1.42,.70]);
    for(let shelf=0;shelf<5;shelf++) {
      const y=.46+shelf*.26;
      box(shelving,'wood1',[-3.70,y,z],[.31,.028,.74]);
      for(let b=0;b<9;b++) {
        const h=.135+rand()*.083;
        box(shelving,`book${Math.floor(rand()*5)}`,[-3.668,y+h/2+.02,z-.31+b*.073],[.20,h,.047+rand()*.012]);
      }
    }
  }
  // Three structural skylight bars, deliberately open for the dollhouse cutaway.
  for(const z of [-1.36,.18,1.73]) box(atrium,'metal',[-3.07,5.75,z],[1.95,.07,.07]);
  for(const x of [-3.94,-2.21]) box(atrium,'metal',[x,5.75,.18],[.07,.07,4.13]);
  const sofa=group('lobby-seating',atrium,[-3.05,.35,1.3]);
  box(sofa,'wood0',[0,.12,0],[.85,.17,.45]);
  for(const x of [-.22,.22]) box(sofa,'wood2',[x,.25,0],[.40,.18,.46]);
  box(sofa,'wood1',[0,.47,-.2],[.85,.3,.13]);
  for(const x of [-.44,.44]) box(sofa,'wood1',[x,.33,0],[.12,.28,.49]);
  cyl(sofa,'metal',[.12,.17,.65],.18,.025);
  cyl(sofa,'brass',[.12,.09,.65],.02,.16);

  // Short right-hand return makes the court spatial without closing the view.
  // Stop the perpendicular brick courses at the rear wall, rather than overlap it.
  const ret=group('courtyard-return',courtyard,[3.77,0,-.815],-Math.PI/2);
  box(ret,'concrete',[0,2.51,-.22],[2.09,4.5,.43]);
  const rw=[];
  for(let r=0;r<3;r++) for(let c=0;c<2;c++) rw.push({x:-.55+c*1.1,y:1.03+r*1.34,w:.78,h:1.05,lit:r===0});
  brickFace(ret,2.09,4.49,0,rw);
  box(ret,'stone-shadow',[0,4.85,-.08],[2.23,.12,.7]);
  const east=group('east-brick-elevation',courtyard,[4.215,0,-.815],Math.PI/2);
  brickFace(east,2.09,4.49,0,rw);

  // Broad wooden amphitheatre with a narrow stair aisle and riser reveals.
  const steps=group('timber-amphitheatre',root,[1.85,.27,1.76]);
  for(let i=0;i<6;i++) {
    const x=.08+i*.34, h=.14+i*.17;
    box(steps,'wood0',[x,h/2,0],[.346,h,2.65]);
    for(let p=0;p<12;p++) box(steps,`wood${(p+i)%4}`,[x,h+.009,-1.24+p*.218],[.33,.018,.207]);
    box(steps,'walnut',[x-.173,h-.04,0],[.017,.026,2.62]);
  }
  for(let i=0;i<12;i++) {
    const x=-.005+i*.172,h=.1+i*.085;
    box(steps,'wood2',[x,h/2,1.57],[.17,h,.37]);
  }
  // Planters cap the high edge instead of fictitious spectators or meeting props.
  box(steps,'concrete',[2.1,1.04,-.05],[.35,.26,2.8]);
  box(steps,'soil',[2.1,1.18,-.05],[.30,.035,2.72]);

  const tower=group('voltage-tower',root,[3.22,1.095,2.1]);
  box(tower,'concrete',[0,.055,0],[.72,.11,.63]);
  const th=5.48;
  for(const x of [-.19,.19]) for(const z of [-.17,.17]) beam(tower,'rust',[x,.11,z],[x*.53,th,z*.53],.045);
  for(let i=0;i<9;i++) {
    const y=.14+i*.58, a=.19*(1-y/th*.47), b=.19*(1-(y+.58)/th*.47);
    for(const zsign of [-1,1]) {
      beam(tower,'rust',[-a,y,zsign*a*.89],[b,y+.58,zsign*b*.89],.027);
      beam(tower,'rust',[a,y,zsign*a*.89],[-b,y+.58,zsign*b*.89],.027);
    }
    for(const xsign of [-1,1]) beam(tower,'rust',[xsign*a,y,-a*.89],[xsign*b,y+.58,b*.89],.023);
  }
  for(const [y,span] of [[2.55,1.13],[3.86,1.5],[4.98,.98]]) {
    for(const sign of [-1,1]) {
      beam(tower,'rust',[0,y-.12,0],[span*sign,y,0],.045);
      beam(tower,'rust',[0,y+.36,0],[span*sign,y,0],.035);
      beam(tower,'rust',[0,y,-.18],[span*sign,y,0],.025);
      beam(tower,'neon',[.05*sign,y-.075,.035],[(span-.08)*sign,y+.025,.035],.018);
      beam(tower,'metal',[span*sign,y,0],[span*sign,y-.42,0],.045);
      for(let d=0;d<7;d++) cyl(tower,'sage',[span*sign,y-.065-d*.046,0],.042,.018);
      put(tower,'sphere','light',[span*sign,y-.43,0],[.065,.08,.065]);
    }
  }
  beam(tower,'neon',[-.13,.3,.205],[-.07,5.40,.113],.022);
  beam(tower,'neon',[.13,.3,.205],[.07,5.40,.113],.022);

  const garden=group('garden');
  function planter(g,x,z,r=.25) {
    put(g,'pot','terracotta',[x,.27+r*.59,z],[r,r*1.18,r]);
    cyl(g,'soil',[x,.27+r*1.18,z],r*.89,.025);
    return .27+r*1.18;
  }
  function broadleaf(g,x,y,z,h,rot=0) {
    for(let j=0;j<9;j++) {
      const a=rot+j*2.4, l=h*(.63+rand()*.35), tilt=.35+rand()*.9;
      beam(g,'leaf0',[x,y,z],[x+Math.sin(a)*l*.24,y+l*.44,z+Math.cos(a)*l*.24],.014);
      put(g,'leaf',`leaf${j%4}`,[x+Math.sin(a)*l*.24,y+l*.38,z+Math.cos(a)*l*.24],
        [l*1.03,l,l],[tilt, a, -.1]);
    }
  }
  function tree(g,x,z,h,spread) {
    const y=.29;
    beam(g,'trunk',[x,y,z],[x+.10,y+h*.78,z+.04],.095,.085);
    for(let j=0;j<13;j++) {
      const a=j*2.39, r=spread*(.30+rand()*.6), top=y+h*(.66+rand()*.25);
      const dx=Math.sin(a)*r,dz=Math.cos(a)*r;
      beam(g,'trunk',[x+.04,y+h*.45,z],[x+dx,top,z+dz],.032);
      put(g,'crown',`leaf${j%4}`,[x+dx,top,z+dz],[spread*.36,spread*.43,spread*.34],[rand(),rand(),rand()]);
    }
    put(g,'crown','leaf2',[x+.05,y+h*.94,z],[spread*.55,spread*.39,spread*.5]);
  }
  function palm(g,x,z,h,scale=1) {
    const y=planter(g,x,z,.20*scale);
    beam(g,'trunk',[x,y,z],[x+.05,y+h,z],.055);
    for(let k=0;k<10;k++) {
      const a=k*Math.PI/5, len=.68*scale;
      const end=[x+Math.sin(a)*len,y+h-.13,z+Math.cos(a)*len];
      beam(g,'leaf1',[x+.05,y+h,z],end,.017);
      for(let t=1;t<6;t++) {
        const f=t/6, px=x+Math.sin(a)*len*f, py=y+h+Math.sin(f*Math.PI)*.12-f*.13,pz=z+Math.cos(a)*len*f;
        for(const sign of [-1,1]) put(g,'leaf',`leaf${(k+t)%4}`,[px,py,pz],
          [.5*scale,.42*scale*(1-f*.6),.5*scale],[1.05,a+sign*.85,sign*.22]);
      }
    }
  }
  box(garden,'stone-shadow',[-.92,.34,2.69],[1.35,.17,1.35]);
  box(garden,'soil',[-.92,.44,2.69],[1.22,.035,1.22]);
  tree(garden,-1.05,2.68,2.53,.78);
  box(garden,'stone-shadow',[-1.25,.33,-.93],[1.05,.14,1.13]);
  box(garden,'soil',[-1.25,.412,-.93],[.96,.025,1.04]);
  tree(garden,-1.30,-.96,3.56,.70);
  tree(garden,-3.02,-.49,3.1,.45);
  palm(garden,1.22,-1.24,.62,.87);
  palm(garden,-2.1,2.88,.56,.82);
  for(const [x,z,s] of [[-.35,-1.19,.75],[2.95,.25,.71],[-2.34,.18,.7],[-1.85,2.3,.6],[-.38,2.54,.46]]) {
    const y=planter(garden,x,z,.18); broadleaf(garden,x,y,z,s,rand()*6);
  }
  for(let z=.48;z<3.15;z+=.42) broadleaf(garden,3.95,1.46,z,.38,z);
  // Creeping planting climbing the brick wall, discretely following real masonry.
  for(let t=0;t<34;t++) {
    const y=.5+t*.12,x=-2.05+Math.sin(t*.41)*.10;
    put(garden,'leaf',`leaf${t%3}`,[x,y,-1.67],[.32,.25,.3],[0,Math.sin(t)*.7,Math.sin(t*.9)*.9]);
    if(t%3===0) put(garden,'crown','leaf0',[x+.13,y,-1.67],[.12,.075,.08]);
  }

  const cafe=group('cafe-terrace');
  function chair(g,x,z,angle) {
    const c=group(`terrace-chair-${g.children.length}`,g,[x,.275,z],angle);
    cyl(c,'walnut',[0,.25,0],.16,.045);
    for(const sx of [-.12,.12]) for(const sz of [-.1,.1]) beam(c,'metal',[sx,.015,sz],[sx*.83,.25,sz*.85],.022);
    for(const sx of [-.13,.13]) beam(c,'metal',[sx,.24,-.10],[sx,.56,-.15],.021);
    box(c,'sage',[0,.48,-.15],[.27,.13,.032]);
    // Avoid one draw per chair by flattening small chair transforms into its parent.
    return c;
  }
  for(const [x,z] of [[.03,.35],[.63,2.51]]) {
    cyl(cafe,'brass',[x,.50,z],.028,.45);
    cyl(cafe,'metal',[x,.294,z],.18,.035);
    cyl(cafe,'linen',[x,.75,z],.35,.055);
    cyl(cafe,'terracotta',[x+.06,.819,z],.043,.07);
    put(cafe,'crown','leaf2',[x+.06,.89,z],[.055,.066,.05]);
    for(const a of [0,2.10,4.2]) chair(cafe,x+Math.sin(a)*.57,z+Math.cos(a)*.57,a+Math.PI);
  }
  // Reclaimed-timber portal is a courtyard motif, not a claim about exact position.
  const portal=group('reclaimed-timber-portal',root,[-.1,.27,3.57]);
  for(const x of [-.67,.67]) box(portal,'wood0',[x,.89,0],[.14,1.78,.20]);
  box(portal,'wood1',[0,1.80,0],[1.52,.17,.25]);
  for(let x=-.7;x<.74;x+=.115) box(portal,'wood2',[x,1.901,0],[.10,.028,.24]);

  for(const {g,geo,material,matrices} of buckets.values()) {
    const mesh=new THREE.InstancedMesh(geometries[geo],materials[material],matrices.length);
    mesh.name=`${g.name}-${material}-${geo}`;
    matrices.forEach((m,i)=>mesh.setMatrixAt(i,m));
    mesh.instanceMatrix.needsUpdate=true;
    mesh.castShadow=!material.startsWith('glass')&&!['light','neon'].includes(material);
    mesh.receiveShadow=true;
    g.add(mesh);
  }
  root.updateMatrixWorld(true);
  return root;
}
