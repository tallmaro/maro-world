/**
 * QSI International School of Tbilisi — original stylised campus miniature.
 * Visual provenance and reconstruction limits: README.md.
 * No imports, browser globals, textures, lights, cameras, or animation loops.
 */
export function createLandmark(THREE) {
  const root = new THREE.Group();
  root.name = 'qsi-tbilisi';
  root.userData = {
    title: 'QSI International School of Tbilisi',
    campus: 'Village Zurgovani, Tbilisi, Georgia',
    representation: 'Reference-based stylised miniature; not a surveyed or year-exact reconstruction',
    front: '+Z',
    version: '1.0.0',
  };

  // Materials are owned by this instance. All surfaces are untextured PBR.
  const colors = {
    plaster: '#ede0bd', ivory: '#fcf0d1', stone: '#b7ae92',
    clay: '#af5441', clayLight: '#c97052', clayDark: '#783e34',
    timber: '#c9a064', glass: '#456a70', glassLight: '#85a5a0',
    metal: '#697e79', chalk: '#f5edcf', grass: '#6d8d4b',
    turf: '#477c56', turfLight: '#50885e', track: '#bc8766',
    leaves: '#607a43', leavesLight: '#819752', bark: '#856646',
    earth: '#9f8c63', base: '#d4c7a4', shadow: '#344d4b',
  };
  const materials = Object.fromEntries(Object.entries(colors).map(([name, color]) => {
    const material = new THREE.MeshStandardMaterial({
      color, roughness: name.startsWith('glass') ? 0.3 : 0.84,
      metalness: name === 'metal' ? 0.4 : 0,
    });
    material.name = `qsi-${name}`;
    return [name, material];
  }));
  const buckets = new Map();
  function group(name) {
    const g = new THREE.Group();
    g.name = name;
    root.add(g);
    return g;
  }
  const ground = group('campus-plinth');
  const main = group('main-school');
  const towers = group('twin-pavilions');
  const stands = group('terraced-stands');
  const gym = group('gymnasium');
  const field = group('football-field');
  const lights = group('floodlights');
  const plants = group('landscape');
  const pavilion = group('side-pavilion');

  const unitBox = new THREE.BoxGeometry(1, 1, 1);
  const unitCylinder = new THREE.CylinderGeometry(1, 1, 1, 8);
  const matrix = new THREE.Matrix4();
  const quaternion = new THREE.Quaternion();
  const euler = new THREE.Euler();
  const position = new THREE.Vector3();
  const scale = new THREE.Vector3();

  // Batch by semantic part and material; retain useful picking boundaries.
  function add(g, geometry, material, x = 0, y = 0, z = 0, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) {
    const shape = geometry.index ? geometry.toNonIndexed() : geometry.clone();
    matrix.compose(position.set(x, y, z), quaternion.setFromEuler(euler.set(rx, ry, rz)), scale.set(sx, sy, sz));
    shape.applyMatrix4(matrix);
    const key = `${g.name}/${material}`;
    if (!buckets.has(key)) buckets.set(key, { g, material, positions: [], normals: [] });
    const bucket = buckets.get(key);
    bucket.positions.push(shape.attributes.position.array);
    bucket.normals.push(shape.attributes.normal.array);
    shape.dispose();
  }
  function box(g, mat, x, y, z, w, h, d, rx = 0, ry = 0, rz = 0) {
    add(g, unitBox, mat, x, y, z, w, h, d, rx, ry, rz);
  }
  function rod(g, mat, a, b, radius = 0.025) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b);
    const vector = end.clone().sub(start);
    const center = start.add(end).multiplyScalar(0.5);
    const rotation = new THREE.Euler().setFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), vector.clone().normalize()));
    add(g, unitCylinder, mat, center.x, center.y, center.z, radius, vector.length(), radius, rotation.x, rotation.y, rotation.z);
  }
  function surface(g, mat, vertices) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices.flat(), 3));
    geometry.computeVertexNormals();
    add(g, geometry, mat);
    geometry.dispose();
  }
  function quad(g, mat, a, b, c, d) {
    surface(g, mat, [a, b, c, a, c, d]);
  }
  function roundedSlab(g, mat, x, y, z, w, d, height, r = 0.18) {
    const s = new THREE.Shape();
    const a = -w / 2, b = -d / 2;
    s.moveTo(a + r, b);
    s.lineTo(a + w - r, b); s.quadraticCurveTo(a + w, b, a + w, b + r);
    s.lineTo(a + w, b + d - r); s.quadraticCurveTo(a + w, b + d, a + w - r, b + d);
    s.lineTo(a + r, b + d); s.quadraticCurveTo(a, b + d, a, b + d - r);
    s.lineTo(a, b + r); s.quadraticCurveTo(a, b, a + r, b);
    const geo = new THREE.ExtrudeGeometry(s, { depth: height, bevelEnabled: false, curveSegments: 6 });
    add(g, geo, mat, x, y, z, 1, 1, 1, -Math.PI / 2);
    geo.dispose();
  }
  function hip(g, x, y, z, w, d, rise, ridge = 0.3) {
    const a = [x-w/2,y,z-d/2], b = [x+w/2,y,z-d/2];
    const c = [x+w/2,y,z+d/2], d0 = [x-w/2,y,z+d/2];
    const p = [x-ridge/2,y+rise,z], q = [x+ridge/2,y+rise,z];
    quad(g, 'clay', a, p, q, b);
    quad(g, 'clayLight', d0, c, q, p);
    surface(g, 'clay', [a,d0,p]);
    surface(g, 'clayDark', [b,q,c]);
    box(g, 'clayDark', x,y-0.026,z,w,0.052,d);
    rod(g, 'clayLight', p, q, 0.035);
    // Modest roof-course relief, not a texture or a tile-per-draw-call grid.
    for (let i=1; i<=5; i++) {
      const t=i/6, yy=y+rise*t+0.004, ww=w*(1-t)+ridge*t;
      for (const sign of [-1,1]) rod(g,'clay', [x-ww/2,yy,z+sign*d/2*(1-t)],[x+ww/2,yy,z+sign*d/2*(1-t)],0.009);
    }
  }
  function windowFront(g, x, y, z, w = 0.3, h = 0.43) {
    box(g,'ivory',x,y,z,w+0.065,h+0.075,0.055);
    box(g,'glass',x,y,z+0.032,w,h,0.018);
    box(g,'glassLight',x-w*0.2,y+h*0.1,z+0.043,w*0.28,h*0.72,0.008);
    box(g,'ivory',x,y,z+0.048,0.025,h,0.014);
    box(g,'ivory',x,y-h/2-0.035,z+0.047,w+0.11,0.045,0.10);
  }
  function windowSide(g, x, y, z, w = 0.28, h = 0.43, side = 1) {
    box(g,'ivory',x,y,z,0.055,h+0.075,w+0.065);
    box(g,'glass',x+side*0.032,y,z,0.018,h,w);
    box(g,'glassLight',x+side*0.042,y+h*0.1,z-w*0.2,0.008,h*0.72,w*0.28);
    box(g,'ivory',x+side*0.048,y,z,0.014,h,0.025);
  }
  function rail(g, x1, x2, y, z, height = 0.30) {
    box(g,'ivory',(x1+x2)/2,y+height,z,x2-x1,0.04,0.045);
    box(g,'timber',(x1+x2)/2,y+0.055,z,x2-x1,0.028,0.028);
    const n = Math.ceil((x2-x1)/0.15);
    for(let i=0;i<=n;i++) box(g,'ivory',x1+(x2-x1)*i/n,y+height/2,z,0.027,height,0.027);
  }

  // The display plinth touches y=0; the campus sits on its 0.28-unit deck.
  roundedSlab(ground,'base',0,0,0,9.6,8.6,0.22,0.44);
  roundedSlab(ground,'earth',0,0.22,0,9.5,8.5,0.035,0.4);
  roundedSlab(ground,'grass',0,0.255,0,9.42,8.42,0.025,0.37);
  roundedSlab(ground,'stone',-0.35,0.28,-1.12,7.15,3.38,0.035,0.14);
  roundedSlab(ground,'track',-0.20,0.285,2.04,7.8,3.83,0.032,0.34);
  roundedSlab(field,'turf',-0.20,0.32,2.04,7.14,3.26,0.018,0.07);

  // Continuous lower storey and upper classroom wing behind a shaded veranda.
  box(main,'plaster',-0.4,0.835,-2.40,6.30,1.11,1.48);
  box(main,'stone',-0.4,0.36,-2.40,6.38,0.15,1.53);
  box(main,'ivory',-0.4,1.39,-2.11,6.42,0.10,2.12);
  box(main,'plaster',-0.4,1.79,-2.47,6.22,0.74,1.24);
  box(main,'timber',-0.4,2.14,-2.02,6.50,0.11,2.31);
  hip(main,-0.4,2.21,-2.1,6.66,2.46,0.29,5.55);
  for (let i=0;i<14;i++) {
    const x=-3.28+i*0.442;
    windowFront(main,x,0.92,-1.646,0.29,0.43);
    windowFront(main,x,1.78,-1.835,0.29,0.42);
  }
  for (const x of [-3.44,-2.88,-2.32,-1.76,-1.20,-0.64,-0.08,0.48,1.04,1.60,2.16,2.68]) {
    box(main,'timber',x,1.79,-1.02,0.064,0.78,0.064);
    box(main,'ivory',x,1.45,-1.02,0.095,0.13,0.095);
    box(main,'ivory',x,2.12,-1.02,0.11,0.08,0.11);
  }
  rail(main,-3.48,-0.88,1.43,-0.997);
  rail(main,0.08,2.71,1.43,-0.997);
  for (const side of [-1,1]) {
    const x=side<0?-3.566:2.766;
    for(const z of [-2.02,-2.55,-2.96]) windowSide(main,x,0.91,z,0.26,0.43,side);
  }
  // Rear has only restrained repeat windows; the unverified layout is not elaborated.
  for(let i=0;i<12;i++) {
    const x=-3.10+i*0.49;
    box(main,'ivory',x,0.91,-3.158,0.35,0.48,0.03);
    box(main,'glass',x,0.91,-3.178,0.29,0.42,0.014);
  }

  // The two recognisable upper pavilions and their low terracotta hip roofs.
  for(const x of [-2.17,1.35]) {
    box(towers,'plaster',x,2.64,-2.20,1.47,0.82,1.51);
    box(towers,'ivory',x,2.23,-2.20,1.56,0.10,1.58);
    box(towers,'ivory',x,3.04,-2.20,1.58,0.11,1.60);
    for(const offset of [-0.48,-0.16,0.16,0.48]) windowFront(towers,x+offset,2.66,-1.427,0.22,0.48);
    for(const side of [-1,1]) for(const z of [-2.62,-2.20,-1.78]) windowSide(towers,x+side*0.756,2.66,z,0.24,0.48,side);
    hip(towers,x,3.12,-2.20,1.81,1.86,0.36,0.22);
    // Simplified raised roof cap; the exact pale cap finish is not reproduced.
    hip(towers,x,3.38,-2.20,0.60,0.62,0.16,0.12);
  }

  // Central arrival gable, glazed double doors, split bleachers and stairs.
  box(main,'shadow',-0.4,1.81,-1.816,0.64,0.70,0.04);
  for(const x of [-0.56,-0.24]) {
    box(main,'glass',x,1.81,-1.787,0.27,0.64,0.02);
    box(main,'ivory',x,1.81,-1.77,0.026,0.64,0.02);
  }
  box(main,'ivory',-0.4,2.17,-1.80,0.71,0.06,0.055);
  for(const x of [-0.82,0.02]) box(main,'ivory',x,1.84,-0.81,0.08,0.9,0.08);
  const front=-0.71, back=-1.65;
  surface(main,'ivory',[[-0.94,2.22,front],[0.14,2.22,front],[-0.4,2.55,front]]);
  quad(main,'clayLight',[-1.00,2.24,front-0.02],[-0.4,2.60,front-0.02],[-0.4,2.60,back],[-1.00,2.24,back]);
  quad(main,'clay',[-0.4,2.60,front-0.02],[0.20,2.24,front-0.02],[0.20,2.24,back],[-0.4,2.60,back]);
  box(stands,'stone',-0.4,0.80,-0.98,3.78,1.00,0.35);
  for(let i=0;i<7;i++) {
    const h=0.13+(6-i)*0.14, z=-0.77+i*0.16;
    for(const cx of [-1.47,0.67]) {
      box(stands,'stone',cx,0.30+h/2,z,1.44,h,0.21);
      box(stands,'ivory',cx,0.31+h,z+0.018,1.46,0.043,0.19);
      box(stands,'timber',cx,0.347+h,z-0.012,1.38,0.034,0.10);
    }
  }
  for(let i=0;i<11;i++) {
    const h=0.10+(10-i)*0.098, z=-0.91+i*0.11;
    box(stands,'ivory',-0.4,0.3+h/2,z,0.65,h,0.13);
  }
  for(const x of [-0.76,-0.04]) {
    rod(stands,'metal',[x,1.70,-0.97],[x,0.75,0.20],0.018);
    for(let i=0;i<5;i++) rod(stands,'metal',[x,1.34-i*0.235,-0.96+i*0.285],[x,1.70-i*0.235,-0.96+i*0.285],0.013);
  }

  // Tall gym hall to the right, with the distinctive open arched portico.
  box(gym,'plaster',3.65,1.41,-2.30,1.46,2.25,2.56);
  box(gym,'stone',3.65,0.36,-2.30,1.49,0.15,2.61);
  const left=2.87, right=4.43, ridgeY=3.18, eaveY=2.58, frontZ=-0.96, backZ=-3.66;
  surface(gym,'ivory',[[left,eaveY,frontZ],[right,eaveY,frontZ],[3.65,ridgeY,frontZ]]);
  surface(gym,'plaster',[[right,eaveY,backZ],[left,eaveY,backZ],[3.65,ridgeY,backZ]]);
  quad(gym,'clayLight',[left-0.07,eaveY,frontZ+0.1],[3.65,ridgeY+0.05,frontZ+0.1],[3.65,ridgeY+0.05,backZ-0.07],[left-0.07,eaveY,backZ-0.07]);
  quad(gym,'clay',[3.65,ridgeY+0.05,frontZ+0.1],[right+0.07,eaveY,frontZ+0.1],[right+0.07,eaveY,backZ-0.07],[3.65,ridgeY+0.05,backZ-0.07]);
  rod(gym,'clayLight',[3.65,ridgeY+0.065,frontZ+0.10],[3.65,ridgeY+0.065,backZ-0.08],0.036);
  for(const x of [3.10,4.20]) windowFront(gym,x,1.25,-0.998,0.25,0.44);
  for(const z of [-1.65,-2.36,-3.06]) windowSide(gym,4.394,1.38,z,0.43,0.60,1);
  box(gym,'shadow',3.65,0.96,-0.985,0.70,1.18,0.045);
  box(gym,'glass',3.65,0.90,-0.950,0.57,1.02,0.025);
  box(gym,'ivory',3.65,0.90,-0.928,0.035,1.02,0.025);
  // Ring of real arch geometry: the opening remains open from every angle.
  const arch = new THREE.Shape();
  arch.moveTo(-0.49,0); arch.lineTo(-0.49,0.91);
  arch.absarc(0,0.91,0.49,Math.PI,0,true);
  arch.lineTo(0.49,0); arch.lineTo(0.34,0); arch.lineTo(0.34,0.91);
  arch.absarc(0,0.91,0.34,0,Math.PI,false);
  arch.lineTo(-0.34,0); arch.closePath();
  const archGeo=new THREE.ExtrudeGeometry(arch,{depth:0.14,bevelEnabled:false,curveSegments:20});
  add(gym,archGeo,'ivory',3.65,0.51,-0.50);
  archGeo.dispose();
  box(gym,'ivory',3.65,0.38,-0.60,1.20,0.15,0.80);
  box(gym,'stone',3.65,0.31,-0.18,1.27,0.055,0.20);
  for(const x of [3.20,4.10]) box(gym,'timber',x,1.16,-0.87,0.06,1.37,0.06);
  hip(gym,3.65,1.99,-0.76,1.22,0.88,0.32,0.22);
  for(const x of [3.11,4.19]) box(gym,'ivory',x,0.57,-0.38,0.15,0.18,0.18);

  // Small low roof on the left edge; no unverified interior is fabricated.
  box(pavilion,'plaster',-4.02,0.73,-2.15,0.87,0.88,1.67);
  hip(pavilion,-4.02,1.22,-2.15,1.02,1.87,0.19,0.10);
  for(const z of [-2.73,-2.14,-1.56]) windowSide(pavilion,-3.565,0.78,z,0.30,0.42,1);
  box(pavilion,'glass',-4.02,0.72,-1.300,0.35,0.74,0.03);

  // Compressed full pitch. White lines and nets are original mesh geometry.
  const fx=-0.20, fz=2.04, fw=6.82, fd=2.95, fy=0.346;
  for(let i=0;i<10;i+=2) box(field,'turfLight',fx-fw/2+(i+0.5)*fw/10,0.339,fz,fw/10,0.004,fd+0.16);
  function fieldLine(x1,z1,x2,z2,r=0.013) { rod(field,'chalk',[x1,fy,z1],[x2,fy,z2],r); }
  function rectangle(x,z,w,d) {
    fieldLine(x-w/2,z-d/2,x+w/2,z-d/2); fieldLine(x+w/2,z-d/2,x+w/2,z+d/2);
    fieldLine(x+w/2,z+d/2,x-w/2,z+d/2); fieldLine(x-w/2,z+d/2,x-w/2,z-d/2);
  }
  rectangle(fx,fz,fw,fd);
  fieldLine(fx,fz-fd/2,fx,fz+fd/2);
  for(let i=0;i<64;i++) {
    const a=i*Math.PI/32,b=(i+1)*Math.PI/32;
    fieldLine(fx+Math.cos(a)*0.49,fz+Math.sin(a)*0.49,fx+Math.cos(b)*0.49,fz+Math.sin(b)*0.49,0.011);
  }
  for(const sign of [-1,1]) {
    const gx=fx+sign*fw/2;
    rectangle(gx-sign*0.47,fz,0.94,1.69);
    rectangle(gx-sign*0.18,fz,0.36,1.02);
    const z1=fz-0.43,z2=fz+0.43, outer=gx+sign*0.27;
    for(const z of [z1,z2]) {
      rod(field,'chalk',[gx,0.35,z],[gx,0.88,z],0.025);
      rod(field,'chalk',[gx,0.88,z],[outer,0.38,z],0.015);
      rod(field,'chalk',[gx,0.35,z],[outer,0.35,z],0.016);
    }
    rod(field,'chalk',[gx,0.88,z1],[gx,0.88,z2],0.025);
    rod(field,'chalk',[outer,0.38,z1],[outer,0.38,z2],0.012);
    for(let i=1;i<9;i++) rod(field,'ivory',[gx,0.87,z1+i*0.086],[outer,0.38,z1+i*0.086],0.005);
    for(let i=1;i<5;i++) rod(field,'ivory',[gx+sign*0.27*i/5,0.88-0.50*i/5,z1],[gx+sign*0.27*i/5,0.88-0.50*i/5,z2],0.005);
  }
  // Thin running-edge lines read as sports grounds without claiming track dimensions.
  for(const z of [0.34,3.73]) box(ground,'ivory',-0.20,0.321,z,6.95,0.008,0.014);

  for(const x of [-2.89,2.10]) {
    const z=0.08;
    box(lights,'stone',x,0.39,z,0.19,0.18,0.19);
    rod(lights,'metal',[x,0.45,z],[x,3.85,z],0.030);
    rod(lights,'metal',[x-0.30,3.70,z],[x+0.30,3.70,z],0.024);
    rod(lights,'metal',[x-0.27,3.91,z],[x+0.27,3.91,z],0.017);
    for(const offset of [-0.24,0,0.24]) for(const y of [3.72,3.92]) {
      box(lights,'metal',x+offset,y,z,0.13,0.095,0.12,-0.12);
      box(lights,'ivory',x+offset,y,z+0.067,0.10,0.066,0.016,-0.12);
    }
  }

  // A restrained planted edge evokes the photographed green/hilly setting.
  const crownGeo = new THREE.IcosahedronGeometry(1,1);
  function tree(x,z,h,wide,variant) {
    rod(plants,'bark',[x,0.28,z],[x,h*0.70,z],0.065);
    rod(plants,'bark',[x,h*0.44,z],[x+wide*0.38,h*0.70,z+0.05],0.038);
    for(const [dx,dy,dz,s] of [[0,0,0,1],[-0.35,-0.16,0.1,0.74],[0.32,-0.11,0.13,0.76]]) {
      add(plants,crownGeo,variant?'leavesLight':'leaves',x+dx*wide,h+dy,z+dz,wide*s,wide*1.12*s,wide*0.92*s,0,variant?0.4:0.1,0);
    }
  }
  for(const t of [[-3.8,3.68,1.22,0.40,0],[-4.16,0.26,1.40,0.44,1],[-3.77,-3.61,1.54,0.48,0],[-2.55,-3.73,1.20,0.40,1],[0.2,-3.78,1.30,0.40,0],[2.25,-3.72,1.40,0.47,1],[4.03,3.56,1.44,0.46,0],[4.15,1.25,1.30,0.41,1]]) tree(...t);
  for(let i=0;i<9;i++) add(plants,crownGeo,i%3?'leaves':'leavesLight',-3.24+i*0.64,0.45,-3.73,0.27,0.22,0.23,0,i*0.3,0);
  crownGeo.dispose();
  // A few low benches, set away from the pitch and circulation.
  for(const z of [0.95,2.55]) {
    box(plants,'timber',4.10,0.59,z,0.26,0.055,0.67);
    for(const zz of [z-0.23,z+0.23]) box(plants,'metal',4.10,0.44,zz,0.20,0.29,0.055);
    box(plants,'timber',4.23,0.77,z,0.035,0.22,0.67);
  }

  function concat(arrays) {
    const out = new Float32Array(arrays.reduce((n,a)=>n+a.length,0));
    let offset=0;
    for(const a of arrays) { out.set(a,offset); offset+=a.length; }
    return out;
  }
  for(const [name,bucket] of buckets) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position',new THREE.BufferAttribute(concat(bucket.positions),3));
    geometry.setAttribute('normal',new THREE.BufferAttribute(concat(bucket.normals),3));
    geometry.computeBoundingBox(); geometry.computeBoundingSphere();
    const mesh = new THREE.Mesh(geometry,materials[bucket.material]);
    mesh.name=name;
    mesh.castShadow=true; mesh.receiveShadow=true;
    bucket.g.add(mesh);
  }
  unitBox.dispose(); unitCylinder.dispose();
  root.updateMatrixWorld(true);
  return root;
}
