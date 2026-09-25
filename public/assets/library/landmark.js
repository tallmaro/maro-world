/**
 * Bocconi Library / Via Gobbi 5. Original, texture-free miniature.
 * Receives the host's THREE; no imports, DOM, network, lights or render loop.
 * Architectural proportions and study layout are interpretive. See README.
 */
export function createLandmark(THREE) {
  const root = new THREE.Group();
  root.name = 'bocconi-library';
  root.userData = {
    title: 'Bocconi Library · Via Gobbi 5',
    version: '1.0.0', units: 'miniature display units, not metres',
    front: '+Z', cutaway: false, entranceOpen: true,
    walkableFloorY: 0.26,
    route: [[0,0.26,4.25],[0,0.26,3.3],[0,0.26,1.3],[0,0.26,0.1],[0,0.26,-1.6]],
    interpretation: 'Verified building identity; compressed massing and invented neutral study layout.'
  };
  const colors = {
    ochre: '#b59b70', ochreLight: '#c5ac80', ochreDark: '#a38b63',
    grout: '#998365', stone: '#ddd1b8', paleStone: '#e9dfc8',
    concrete: '#b5b1a0', concreteDark: '#8e958a',
    green: '#31564c', greenLight: '#53786a', glass: '#597975', glassLight: '#91aca4',
    recess: '#233f3b', brass: '#b39c63', floor: '#d0c5aa',
    paper: '#f1e8d3', wood: '#b58a58', woodDark: '#795d3f',
    ink: '#2c4844', blue: '#687d88', red: '#985e4e', moss: '#82896a',
    leaf: '#758566', leafLight: '#98a47c', bark: '#776b50', paving: '#c9c8b8'
  };
  const mats = Object.fromEntries(Object.entries(colors).map(([name,color]) => [name, new THREE.MeshStandardMaterial({
    name, color, roughness: name.includes('glass') ? 0.28 : name === 'brass' ? 0.46 : 0.82,
    metalness: name === 'brass' ? 0.48 : name.includes('glass') ? 0.16 : 0
  })]));
  const templates = {
    box: new THREE.BoxGeometry(1,1,1),
    cylinder: new THREE.CylinderGeometry(1,1,1,8),
    crown: new THREE.IcosahedronGeometry(1,1),
    orb: new THREE.IcosahedronGeometry(1,0)
  };
  // Material-batched geometry keeps the rich miniature inexpensive to draw.
  // Selectable groups remain separate; there is no dependence on BufferGeometryUtils.
  function batch(name, parent=root, data={}) {
    const group = new THREE.Group(); group.name = name; group.userData = data; parent.add(group);
    const buffers = new Map();
    function add(kind, material, position, scale, rotation=[0,0,0]) {
      if (!buffers.has(material)) buffers.set(material, {p:[],n:[],i:[]});
      const out = buffers.get(material), source = templates[kind];
      const m = new THREE.Matrix4().compose(new THREE.Vector3(...position), new THREE.Quaternion().setFromEuler(new THREE.Euler(...rotation)), new THREE.Vector3(...scale));
      const nm = new THREE.Matrix3().getNormalMatrix(m);
      const offset = out.p.length / 3;
      const p = source.attributes.position, n = source.attributes.normal;
      for(let j=0;j<p.count;j++) {
        const v = new THREE.Vector3().fromBufferAttribute(p,j).applyMatrix4(m);
        const normal = new THREE.Vector3().fromBufferAttribute(n,j).applyMatrix3(nm).normalize();
        out.p.push(v.x,v.y,v.z); out.n.push(normal.x,normal.y,normal.z);
      }
      if(source.index) for(const i of source.index.array) out.i.push(i+offset);
      else for(let j=0;j<p.count;j++) out.i.push(j+offset);
    }
    return {
      group,
      box: (material,x,y,z,w,h,d,rx=0,ry=0,rz=0) => add('box',material,[x,y,z],[w,h,d],[rx,ry,rz]),
      cylinder: (material,x,y,z,r,h,rx=0,ry=0,rz=0) => add('cylinder',material,[x,y,z],[r,h,r],[rx,ry,rz]),
      crown: (material,x,y,z,sx,sy,sz) => add('crown',material,[x,y,z],[sx,sy,sz]),
      orb: (material,x,y,z,s) => add('orb',material,[x,y,z],[s,s,s]),
      finish() {
        for(const [mat,b] of buffers) {
          const g = new THREE.BufferGeometry();
          g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));
          g.setAttribute('normal',new THREE.Float32BufferAttribute(b.n,3));
          g.setIndex(b.i); g.computeBoundingSphere(); g.computeBoundingBox();
          const mesh = new THREE.Mesh(g,mats[mat]); mesh.name = `${name}-${mat}`;
          mesh.castShadow=true; mesh.receiveShadow=true; group.add(mesh);
        }
        return group;
      }
    };
  }
  function anchor(name, position, target) {
    const a = new THREE.Object3D(); a.name = name; a.position.set(...position); a.userData = {cameraTarget:target}; root.add(a);
  }

  const site = batch('paved-miniature-base');
  site.box('concreteDark',0,0.06,0,9.6,0.12,8.9);
  site.box('paving',0,0.145,0,9.5,0.05,8.8);
  site.box('stone',0,0.21,0,7.55,0.1,6.7);
  // Broad entrance landing is flush with the stylised interior floor.
  site.box('paleStone',0,0.21,3.75,2.05,0.1,1.35);
  for(let x=-4.4;x<=4.4;x+=0.55) {
    site.box('concrete',x,0.174,3.81,0.012,0.006,1.22);
    site.box('concrete',x,0.174,-3.93,0.012,0.006,0.64);
  }
  for(const z of [3.45,3.98]) site.box('concrete',0,0.174,z,9.45,0.005,0.012);
  site.finish();

  const ground = batch('portico-and-ground-floor');
  ground.box('floor',0,0.23,0,7.36,0.06,6.45);
  // Low opaque plinths and open glazing; the front portico remains truly hollow.
  ground.box('stone',-3.61,0.38,-0.55,0.16,0.24,5.2);
  ground.box('stone',3.61,0.38,-0.55,0.16,0.24,5.2);
  ground.box('stone',0,0.37,-3.14,7.36,0.22,0.17);
  for(const x of [-3.34,-2.67,-2,-1.33,-0.67,0.67,1.33,2,2.67,3.34]) {
    ground.box('stone',x,0.995,3.02,0.17,1.47,0.22);
    ground.box('paleStone',x-0.065,0.995,3.145,0.035,1.46,0.022);
    ground.box('concreteDark',x,0.295,3.02,0.21,0.07,0.26);
  }
  for(const z of [2.26,1.43,0.60,-0.23,-1.06,-1.89,-2.72]) {
    ground.box('stone',-3.51,1.0,z,0.22,1.48,0.18);
  }
  // Recessed portico ceiling and shallow coffer grid.
  ground.box('stone',0,1.765,2.57,7.4,0.14,1.15);
  for(let x=-3.35;x<=3.4;x+=0.67) ground.box('paleStone',x,1.68,2.58,0.065,0.075,1.03);
  for(const z of [2.12,2.6,3.05]) ground.box('paleStone',0,1.68,z,7.25,0.075,0.052);
  function groundWindow(x,z,side=false) {
    const w=0.54,h=1.09,y=1.02;
    const rotate=side ? Math.PI/2 : 0;
    const bx=(mat,dx,dy,dz,bw,bh,bd) => side ? ground.box(mat,x+dz,y+dy,z-dx,bw,bh,bd,0,rotate) : ground.box(mat,x+dx,y+dy,z+dz,bw,bh,bd);
    bx('glass',0,0,-0.04,w,h,0.028);
    for(const dx of [-w/2,0,w/2]) bx('green',dx,0,0,0.034,h+0.06,0.065);
    for(const dy of [-h/2,0.06,h/2]) bx('green',0,dy,0,w,0.038,0.065);
    bx('stone',0,-h/2-0.025,0.005,w+0.08,0.06,0.12);
    bx('glassLight',-w*0.23,0.16,-0.014,0.06,0.5,0.006);
  }
  for(const x of [-3.02,-2.39,-1.76,1.76,2.39,3.02]) groundWindow(x,1.99);
  for(let z=-2.75;z<=1.5;z+=0.66) {groundWindow(3.59,z,true);groundWindow(-3.59,z,true);}
  ground.finish();

  const entry = batch('library-entrance',root,{type:'entrance',label:'Enter the library',action:'enter-library'});
  for(const x of [-0.88,0.88]) entry.box('green',x,1.05,1.98,0.085,1.58,0.11);
  entry.box('green',0,1.815,1.98,1.85,0.085,0.11);
  entry.box('glass',0,1.68,1.94,1.68,0.19,0.032);
  entry.box('green',0,1.575,1.98,1.76,0.035,0.09);
  entry.box('brass',0,1.965,2.005,1.50,0.21,0.05);
  // Small original geometric lettering, not a copied university logo or image.
  const glyphs={B:['110','101','110','101','110'],O:['010','101','101','101','010'],C:['011','100','100','100','011'],N:['101','111','111','111','101'],I:['111','010','010','010','111']};
  let letterX=-0.57;
  for(const ch of 'BOCCONI') {
    glyphs[ch].forEach((row,iy)=>Array.from(row).forEach((v,ix)=>{if(v==='1') entry.box('ink',letterX+ix*0.038,2.039-iy*0.029,2.033,0.027,0.022,0.009);}));
    letterX+=0.167;
  }
  entry.finish();
  for(const [name,x,direction] of [['left',-0.79,1],['right',0.79,-1]]) {
    const b=batch(`entrance-door-${name}`,root,{type:'door'});
    b.group.position.set(x,0.27,1.98);
    const cx=direction*0.395;
    b.box('glass',cx,0.635,0,0.735,1.23,0.035);
    for(const dx of [0,direction*0.79]) b.box('green',dx,0.65,0,0.04,1.3,0.07);
    for(const y of [0.02,0.48,1.29]) b.box('green',cx,y,0,0.79,0.042,0.07);
    b.box('brass',cx,0.67,0.044,0.58,0.15,0.035);
    b.box('brass',direction*0.67,0.67,0.09,0.025,0.22,0.045);
    b.finish();
  }

  const upper=batch('upper-storeys');
  // Four upper window registers on the street-facing L-shaped block.
  upper.box('ochre',0,3.76,3.055,7.4,3.86,0.16);
  upper.box('ochre',-3.62,3.76,0.1,0.16,3.86,6.04);
  upper.box('ochre',3.62,3.76,2.14,0.16,3.86,1.98);
  upper.box('ochre',0,3.76,1.25,7.4,3.86,0.15);
  upper.box('ochre',-2.37,3.76,-0.79,0.15,3.86,4.0);
  upper.box('ochre',-2.98,3.76,-2.86,1.37,3.86,0.16);
  for(const y of [1.86,2.8,3.76,4.72,5.67]) {
    upper.box('ochreLight',0,y,3.16,7.48,0.075,0.115);
    upper.box('ochreLight',-3.715,y,0.11,0.115,0.075,6.12);
    upper.box('ochreLight',3.72,y,2.17,0.1,0.075,2.03);
    upper.box('stone',0,y,1.24,7.44,0.045,0.08);
  }
  // Fine horizontal clinker joints and alternating short vertical joints.
  for(let row=0;row<48;row++) {
    const y=1.93+row*0.077;
    upper.box('grout',0,y,3.139,7.28,0.006,0.009);
    upper.box('grout',-3.704,y,0.13,0.009,0.006,5.91);
    if(row%3===0) for(let j=0;j<26;j++) {
      const x=-3.52+j*0.275+(row%2)*0.1;
      upper.box('ochreDark',x,y+0.032,3.143,0.006,0.052,0.008);
    }
  }
  function windowAt(x,y,z,side=0,variation=0) {
    const w=0.415,h=0.675;
    const c=Math.cos(side),s=Math.sin(side);
    const box=(mat,dx,dy,dz,bw,bh,bd)=>upper.box(mat,x+c*dx+s*dz,y+dy,z-s*dx+c*dz,bw,bh,bd,0,side);
    box('recess',0,0,0,w+0.09,h+0.075,0.05);
    box(variation%5===0?'glassLight':'glass',0,0,0.027,w,h,0.018);
    for(const dx of [-w/2,w/2]) box('green',dx,0,0.063,0.033,h+0.03,0.06);
    for(const dy of [-h/2,h/2]) box('green',0,dy,0.063,w,0.033,0.06);
    box('green',0,0,0.062,0.022,h,0.045);
    box('green',0,-0.1,0.061,w,0.023,0.05);
    box('stone',0,-h/2-0.045,0.067,w+0.105,0.064,0.145);
    box('ochreLight',-w/2-0.054,0,0.039,0.043,h+0.12,0.075);
    box('glassLight',-0.115,0.1,0.041,0.04,0.37,0.008);
    if(variation%4===0) box('concrete',0,h/2-0.1,0.044,w-0.04,0.16,0.01);
  }
  for(let floor=0;floor<4;floor++) {
    const y=2.33+floor*0.96;
    for(let i=0;i<11;i++) {
      windowAt(-3.23+i*0.646,y,3.16,0,i+floor);
      windowAt(-3.23+i*0.646,y,1.16,Math.PI,i+floor);
    }
    for(let i=0;i<9;i++) windowAt(-3.73,y,-2.51+i*0.64,-Math.PI/2,i+floor);
    for(let i=0;i<3;i++) windowAt(3.73,y,1.48+i*0.64,Math.PI/2,i+floor);
    for(let i=0;i<6;i++) windowAt(-2.27,y,-2.48+i*0.635,Math.PI/2,i+floor);
  }
  // Flat roof, coping and recessed roof surfaces retain the rationalist silhouette.
  for(const [x,z,w,d] of [[0,2.17,7.5,2.04],[-3.0,-0.85,1.5,4.08]]) {
    upper.box('stone',x,5.76,z,w,0.18,d);
    upper.box('concrete',x,5.865,z,w-0.14,0.04,d-0.14);
    for(const e of [-1,1]) {
      upper.box('ochreLight',x+e*(w/2-0.035),5.94,z,0.07,0.14,d);
      upper.box('ochreLight',x,5.94,z+e*(d/2-0.035),w,0.14,0.07);
    }
  }
  upper.box('concrete',-3,6.02,0.34,0.68,0.19,0.9);
  for(let i=0;i<6;i++) upper.box('concreteDark',-3.27+i*0.108,6.126,0.34,0.034,0.018,0.74);
  upper.finish();

  const repository=batch('book-repository');
  repository.box('concrete',0.7,2.0,-3.0,5.88,3.48,0.56);
  repository.box('stone',0.7,3.82,-3.0,6.02,0.16,0.73);
  for(let i=0;i<23;i++) {
    const x=-2.0+i*0.247;
    repository.box('concreteDark',x,1.97,-3.29,0.087,3.1,0.02);
    for(let j=0;j<15;j++) repository.box('glassLight',x,0.55+j*0.197,-3.307,0.067,0.158,0.02);
    // Inside-facing slits make the repository readable from the cutaway.
    repository.box('glass',x,2.29,-2.7,0.064,2.69,0.02);
  }
  for(const y of [0.46,1.36,2.31,3.27]) repository.box('concrete',0.7,y,-3.326,5.83,0.059,0.05);
  repository.finish();

  const roof=batch('reading-room-roof');
  roof.box('stone',0.67,1.81,-0.7,4.95,0.16,3.81);
  roof.box('concrete',0.67,1.911,-0.7,4.79,0.045,3.65);
  // Raised clerestory bands, abstracted from the archive reading-room images.
  for(const z of [-1.93,-0.69,0.55]) {
    roof.box('green',0.68,2.025,z,4.2,0.20,0.57);
    roof.box('glassLight',0.68,2.14,z,4.14,0.032,0.56);
    roof.box('glass',0.68,2.025,z+0.295,4.1,0.13,0.015);
    for(let i=0;i<10;i++) roof.box('green',-1.2+i*0.416,2.17,z,0.029,0.035,0.59);
    roof.box('stone',0.68,2.19,z-0.292,4.29,0.06,0.065);
    roof.box('stone',0.68,2.19,z+0.292,4.29,0.06,0.065);
  }
  roof.finish();

  const interior=batch('reading-room-floor');
  for(let i=0;i<18;i++) interior.box(i%3===0?'paleStone':'floor',-3.3+i*0.388,0.266,-0.64,0.37,0.012,4.3);
  interior.box('green',0,0.273,0.03,0.035,0.006,3.9);
  interior.finish();
  // Study bays: paired pale tables, slim frames, open notebooks, and muted chairs.
  for(let row=0;row<3;row++) for(const side of [-1,1]) {
    const num=row*2+(side===-1?1:2), id=String(num).padStart(2,'0');
    const x=side*1.2,z=0.40-row*1.06;
    const t=batch(`study-table-${id}`,root,{type:'study-table',label:`Study table ${id}`,content:null,interactionId:`bocconi.study.${id}`});
    t.box('wood',x,0.86,z,1.38,0.075,0.52);
    t.box('paper',x,0.904,z,1.31,0.017,0.47);
    for(const dx of [-0.59,0.59]) for(const dz of [-0.18,0.18]) t.box('ink',x+dx,0.564,z+dz,0.036,0.54,0.036);
    t.box('ink',x,0.52,z,1.22,0.035,0.032);
    for(const dx of [-0.34,0.34]) {
      t.box('greenLight',x+dx,0.54,z+0.43,0.35,0.07,0.30);
      t.box('green',x+dx,0.735,z+0.58,0.35,0.34,0.042,0.10);
      for(const lx of [-0.13,0.13]) for(const lz of [-0.1,0.1]) t.box('ink',x+dx+lx,0.41,z+0.43+lz,0.025,0.29,0.025);
      t.box('blue',x+dx,0.928,z,0.27,0.028,0.20,0,0.05);
      t.box('paper',x+dx,0.947,z-0.003,0.254,0.012,0.186,0,0.05);
      t.box('woodDark',x+dx+0.18,0.933,z,0.018,0.012,0.17,0,0.17);
    }
    t.finish();
  }
  // Shelving is deliberately neutral: no course names or personal notes.
  for(const side of [-1,1]) {
    const x=side*2.92;
    const shelf=batch(`bookshelf-${side===-1?'01':'02'}`,root,{type:'bookshelf',label:side===-1?'Open stacks · west':'Open stacks · east',content:null,interactionId:`bocconi.shelves.${side===-1?'01':'02'}`});
    for(const z of [-2.22,-0.9,0.42]) {
      shelf.box('paleStone',x,0.93,z,0.33,1.31,1.2);
      // Face inward; shelf backing sits towards the outer wall.
      shelf.box('woodDark',x-side*0.18,0.95,z,0.016,1.22,1.10);
      for(let level=0;level<4;level++) {
        const y=0.34+level*0.305;
        shelf.box('paper',x-side*0.27,y,z,0.22,0.036,1.2);
        for(let book=0;book<14;book++) {
          const height=0.19+((book*7+level*3)%5)*0.014;
          const color=['paper','blue','red','green','moss','ochreLight'][(book+level*3)%6];
          const bz=z-0.51+book*0.078;
          shelf.box(color,x-side*0.265,y+height/2+0.02,bz,0.21,height,0.056);
          shelf.box('paper',x-side*0.377,y+0.058,bz,0.009,0.026,0.043);
        }
      }
    }
    shelf.finish();
  }

  const scenery=batch('street-trees-and-benches');
  for(const [x,z,scale] of [[-4.16,2.74,0.87],[4.18,2.80,0.91],[-4.16,-2.53,0.74],[4.2,-2.63,0.78]]) {
    scenery.box('concreteDark',x,0.195,z,0.75,0.05,0.78);
    scenery.box('moss',x,0.227,z,0.64,0.012,0.67);
    scenery.cylinder('bark',x,0.89,z,0.047,1.32);
    scenery.cylinder('bark',x-0.12,1.24,z,0.028,0.64,0,0,0.42);
    scenery.cylinder('bark',x+0.12,1.34,z+0.02,0.025,0.58,0,0,-0.45);
    scenery.crown('leaf',x,1.83*scale,z,0.51*scale,0.69*scale,0.51*scale);
    scenery.crown('leafLight',x-0.21,2.12*scale,z-0.09,0.34*scale,0.39*scale,0.36*scale);
    scenery.crown('leafLight',x+0.26,1.86*scale,z+0.16,0.29*scale,0.36*scale,0.30*scale);
  }
  for(const x of [-2.55,2.55]) {
    for(let i=0;i<4;i++) scenery.box('wood',x,0.49,3.88+i*0.075,1.04,0.045,0.052);
    for(const dx of [-0.4,0.4]) scenery.box('ink',x+dx,0.345,3.98,0.045,0.26,0.30);
  }
  scenery.finish();

  anchor('entrance-anchor',[0,1.15,3.85],[0,0.8,0.3]);
  anchor('reading-room-anchor',[0,3.8,1.25],[0,0.4,-1.0]);
  anchor('study-seat-anchor',[1.2,1.45,1.18],[1.2,0.87,0.13]);
  for(const geometry of Object.values(templates)) geometry.dispose();
  setEntranceOpen(root,true);
  root.updateMatrixWorld(true);
  return root;
}

/** Show the interpreted study layer. Does not change the host camera or run a loop. */
export function setCutaway(root, enabled) {
  for(const name of ['upper-storeys','reading-room-roof']) {
    const part=root.getObjectByName(name);
    if(part) part.visible=!enabled;
  }
  root.userData.cutaway=Boolean(enabled);
}

/** Pivot two entrance doors. The default is open with a clear centre aisle. */
export function setEntranceOpen(root, open) {
  const left=root.getObjectByName('entrance-door-left');
  const right=root.getObjectByName('entrance-door-right');
  if(left) left.rotation.y=open ? -1.27 : 0;
  if(right) right.rotation.y=open ? 1.27 : 0;
  root.userData.entranceOpen=Boolean(open);
}
