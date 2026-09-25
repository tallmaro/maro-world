/**
 * Maro's workspace — original, observation-based miniature geometry.
 * Pure factory: no imports, photo textures, DOM, renderer, lights or timers.
 * Display units are not physical measurements. See README.md for assumptions.
 */
export function createLandmark(THREE) {
  const room = new THREE.Group();
  room.name = 'tbilisi-workspace';
  room.userData = { title: "Maro's workspace", purpose: 'personal-exploration', version: 1 };
  const geometries = new Map();
  const material = (color, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.78, ...extra });
  const M = {
    wall: material('#b9bcb0'), edge: material('#d9d8c9'), ivory: material('#e5ddc9'),
    ivoryDark: material('#d1c7b1'), brass: material('#9a8254', { metalness: 0.58, roughness: 0.34 }),
    brassLight: material('#bba782', { metalness: 0.5, roughness: 0.32 }),
    wood: material('#9d764f'), woodDark: material('#765336'), base: material('#626757'),
    curtain: material('#254f46', { side: THREE.DoubleSide, roughness: 0.96 }),
    sheer: material('#e5e4d4', { side: THREE.DoubleSide, roughness: 1 }),
    glass: material('#b5cfcc', { emissive: '#608e84', emissiveIntensity: 0.13, roughness: 0.42 }),
    charcoal: material('#353a3c'), graphite: material('#242a2b'), chairFrame: material('#626968'),
    chairMesh: material('#454d4c'), screen: material('#192827', { roughness: 0.23, metalness: 0.12 }),
    screenEdge: material('#282d2a', { roughness: 0.4 }), mirror: material('#92a9a4', { metalness: 0.28, roughness: 0.35 }),
    mirrorGlint: material('#bfccc3', { roughness: 0.4 }), paper: material('#e9dfc8'),
    shade: material('#e7d4ad', { side: THREE.DoubleSide, roughness: 0.94 }),
    shadeEdge: material('#c9b78f'), lampInside: material('#f8ddb2', { emissive: '#e8b361', emissiveIntensity: 0.4 }),
    ceramic: material('#e3dfd1', { roughness: 0.38 }), blue: material('#3e8794', { roughness: 0.32 }),
    leaves: material('#526749'), stems: material('#56734a'), flowerCream: material('#eee1ae'),
    flowerYellow: material('#d3a745'), flowerRed: material('#a04b51'), textile: material('#ccc9b9'),
    terracotta: material('#aa6c57'), pink: material('#b9948d'),
  };
  const bookColors = ['#6e7771', '#835653', '#b9a68a', '#d2c1a1', '#3d5356', '#977652', '#a38d81'].map(c => material(c));
  const floorColors = ['#ab835a', '#b48d63', '#a78057', '#bc966d', '#b08b60', '#9e7955'].map(c => material(c));
  const group = (name, parent = room) => { const g = new THREE.Group(); g.name = name; parent.add(g); return g; };
  const mesh = (name, geometry, mat, parent, x = 0, y = 0, z = 0) => {
    const m = new THREE.Mesh(geometry, mat); m.name = name; m.position.set(x, y, z);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const boxGeo = (w, h, d, radius) => {
    const key = `b:${w}:${h}:${d}:${radius}`;
    if (geometries.has(key)) return geometries.get(key);
    let geo;
    if (!radius) geo = new THREE.BoxGeometry(w, h, d);
    else {
      // Unit-box rounding adapted from Three.js RoundedBoxGeometry (MIT;
      // vendor/LICENSE). Analytic normals keep even tiny bevels soft and clean.
      const r = Math.min(radius, w / 2, h / 2, d / 2);
      const segments = Math.max(w, h, d) < 0.22 ? 3 : 5;
      geo = new THREE.BoxGeometry(1, 1, 1, segments, segments, segments);
      const pos = geo.attributes.position, normals = geo.attributes.normal;
      const p = new THREE.Vector3(), n = new THREE.Vector3();
      for (let i = 0; i < pos.count; i++) {
        p.fromBufferAttribute(pos, i);
        const signs = [Math.sign(p.x), Math.sign(p.y), Math.sign(p.z)];
        n.copy(p).sub(new THREE.Vector3(...signs).multiplyScalar(0.5 / segments)).normalize();
        pos.setXYZ(i, signs[0] * (w / 2 - r) + n.x * r, signs[1] * (h / 2 - r) + n.y * r, signs[2] * (d / 2 - r) + n.z * r);
        normals.setXYZ(i, n.x, n.y, n.z);
      }
    }
    geometries.set(key, geo); return geo;
  };
  const box = (name, w, h, d, mat, parent, x, y, z, r = 0) => mesh(name, boxGeo(w, h, d, r), mat, parent, x, y, z);
  const cylinder = (name, top, bottom, height, mat, parent, x, y, z, segments = 24) => {
    const key = `c:${top}:${bottom}:${height}:${segments}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.CylinderGeometry(top, bottom, height, segments));
    return mesh(name, geometries.get(key), mat, parent, x, y, z);
  };
  const sphere = (name, radius, mat, parent, x, y, z, scale = [1, 1, 1]) => {
    const key = `s:${radius}`;
    if (!geometries.has(key)) geometries.set(key, new THREE.SphereGeometry(radius, 12, 8));
    const m = mesh(name, geometries.get(key), mat, parent, x, y, z); m.scale.set(...scale); return m;
  };
  const rod = (name, from, to, radius, mat, parent) => {
    const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to), delta = b.clone().sub(a);
    const m = cylinder(name, radius, radius, delta.length(), mat, parent, ...a.add(b).multiplyScalar(0.5).toArray(), 12);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), delta.normalize()); return m;
  };
  const lathe = (name, profile, mat, parent, x, y, z, segments = 32) => mesh(name,
    new THREE.LatheGeometry(profile.map(([r, h]) => new THREE.Vector2(r, h)), segments), mat, parent, x, y, z);
  const frame = (name, w, h, t, depth, mat, parent, x, y, z, radius = 0.01) => {
    const g = group(name, parent); g.position.set(x, y, z);
    box(`${name}-left`, t, h, depth, mat, g, -w / 2 + t / 2, 0, 0, radius);
    box(`${name}-right`, t, h, depth, mat, g, w / 2 - t / 2, 0, 0, radius);
    box(`${name}-top`, w - 2 * t, t, depth, mat, g, 0, h / 2 - t / 2, 0, radius);
    box(`${name}-bottom`, w - 2 * t, t, depth, mat, g, 0, -h / 2 + t / 2, 0, radius);
    return g;
  };

  // The stage is a deliberately cropped fragment of the visible room.
  const shell = group('room-shell');
  box('diorama-plinth', 8.8, 0.22, 6.8, M.base, shell, 0, 0.11, 0, 0.08);
  box('oak-floor-bed', 8.57, 0.08, 6.57, M.woodDark, shell, 0, 0.255, 0);
  const flooring = group('staggered-oak-parquet', shell);
  for (let row = 0; row < 22; row++) {
    const z = -3.15 + row * 0.294;
    for (let col = 0; col < 7; col++) {
      const start = -4.23 + col * 1.44 - (row % 2) * 0.72;
      const end = Math.min(start + 1.43, 4.23), left = Math.max(start, -4.23);
      if (end <= left) continue;
      box(`oak-plank-${row}-${col}`, end - left, 0.025, 0.282, floorColors[(col * 3 + row * 5) % 6], flooring, (left + end) / 2, 0.307, z);
    }
  }
  box('rear-sage-wall', 8.65, 6.0, 0.18, M.wall, shell, 0, 3.32, -3.21);
  // Left wall is actually open at the window; no fake window over a solid wall.
  box('left-window-sill-wall', 0.18, 1.31, 4.3, M.wall, shell, -4.23, 0.975, -1.15);
  box('left-window-header', 0.18, 0.8, 4.3, M.wall, shell, -4.23, 5.92, -1.15);
  box('left-rear-pier', 0.18, 3.9, 0.6, M.wall, shell, -4.23, 3.58, -3.0);
  box('left-front-pier', 0.18, 3.9, 0.54, M.wall, shell, -4.23, 3.58, 0.72);
  box('rear-baseboard', 8.45, 0.23, 0.07, M.edge, shell, 0, 0.435, -3.075, 0.025);
  box('left-baseboard', 0.07, 0.23, 4.22, M.edge, shell, -4.09, 0.435, -1.14, 0.025);
  box('rear-crown-lower', 8.65, 0.13, 0.26, M.edge, shell, 0, 6.08, -3.15, 0.035);
  box('rear-crown-cap', 8.75, 0.16, 0.39, M.edge, shell, 0, 6.24, -3.1, 0.035);
  box('left-crown-lower', 0.26, 0.13, 4.37, M.edge, shell, -4.17, 6.08, -1.14, 0.035);
  box('left-crown-cap', 0.38, 0.16, 4.45, M.edge, shell, -4.11, 6.24, -1.14, 0.035);

  const windowGroup = group('daylight-window');
  const windowFrame = group('window-frame', windowGroup); windowFrame.rotation.y = Math.PI / 2; windowFrame.position.set(-4.1, 3.57, -1.15);
  box('frosted-daylight-glass', 3.06, 3.72, 0.035, M.glass, windowFrame, 0, 0, -0.04);
  frame('ivory-window-trim', 3.17, 3.83, 0.1, 0.1, M.ivory, windowFrame, 0, 0, 0);
  box('window-central-mullion', 0.075, 3.68, 0.1, M.ivory, windowFrame, 0, 0, 0.035);
  box('window-crossbar', 3.01, 0.075, 0.1, M.ivory, windowFrame, 0, 0.54, 0.035);
  box('window-handle', 0.035, 0.23, 0.07, M.brassLight, windowFrame, 0.13, -0.1, 0.105, 0.016);
  box('deep-window-sill', 0.42, 0.11, 3.5, M.ivory, windowGroup, -4.01, 1.65, -1.16, 0.035);
  const curtains = group('green-curtains');
  rod('curtain-brass-rail', [-3.77, 5.92, -3.05], [-3.77, 5.92, 1.03], 0.028, M.brass, curtains);
  for (const z of [-3.06, 1.04]) sphere(`curtain-rail-finial-${z}`, 0.065, M.brass, curtains, -3.77, 5.92, z);
  const curtain = (name, zStart, width, folds, mat, x, bottom, top) => {
    const vertices = [], indices = [], nx = folds * 12, ny = 14;
    for (let j = 0; j <= ny; j++) {
      const v = j / ny;
      for (let i = 0; i <= nx; i++) {
        const u = i / nx, phase = u * folds * Math.PI * 2;
        const flare = 0.035 * (1 - v) ** 3;
        vertices.push(x + Math.cos(phase) * (0.055 + 0.035 * (1 - v)) + flare,
          bottom + v * (top - bottom) + (1 - v) ** 8 * Math.sin(phase + 1) * 0.027,
          zStart + u * width + Math.sin(phase) * 0.012);
      }
    }
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = j * (nx + 1) + i, b = a + nx + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    mesh(name, geo, mat, curtains);
    for (let i = 0; i < folds; i++) {
      const ring = mesh(`${name}-ring-${i}`, new THREE.TorusGeometry(0.04, 0.009, 5, 12), M.brass, curtains, x, top + 0.045, zStart + (i + 0.5) * width / folds); ring.rotation.y = Math.PI / 2;
    }
  };
  curtain('cream-sheer-drape', -0.14, 0.86, 6, M.sheer, -3.91, 0.36, 5.8);
  curtain('pine-curtain-rear', -3.04, 1.01, 7, M.curtain, -3.76, 0.35, 5.82);
  curtain('pine-curtain-front', 0.47, 0.48, 4, M.curtain, -3.76, 0.35, 5.82);

  // A narrow open shelving unit: warm timber uprights, pale shelves, anonymous belongings.
  const shelves = group('tall-shelves'); shelves.position.set(-2.68, 0.32, -2.29);
  for (const x of [-0.77, 0.77]) for (const z of [-0.45, 0.45]) {
    box(`shelf-upright-${x}-${z}`, 0.066, 4.24, 0.07, M.wood, shelves, x, 2.12, z, 0.016);
  }
  const levels = [0.16, 0.99, 1.82, 2.65, 3.48];
  for (let i = 0; i < levels.length; i++) {
    box(`shelf-board-${i}`, 1.58, 0.075, 0.99, M.ivory, shelves, 0, levels[i], 0, 0.025);
    box(`shelf-back-rail-${i}`, 1.53, 0.065, 0.045, M.wood, shelves, 0, levels[i] + 0.18, -0.455);
  }
  for (const x of [-0.77, 0.77]) box(`shelf-top-side-${x}`, 0.06, 0.08, 0.93, M.wood, shelves, x, 4.18, 0, 0.02);
  const book = (parent, name, x, y, z, w, h, d, color, angle = 0) => {
    const g = group(name, parent); g.position.set(x, y, z); g.rotation.y = angle;
    box(`${name}-pages`, w - 0.015, h - 0.015, d - 0.025, M.paper, g, 0, 0, 0);
    box(`${name}-cover-top`, w + 0.016, 0.013, d + 0.015, color, g, 0, h / 2, 0, 0.004);
    box(`${name}-cover-bottom`, w + 0.016, 0.013, d + 0.015, color, g, 0, -h / 2, 0, 0.004);
    box(`${name}-spine`, w + 0.016, h, 0.022, color, g, 0, 0, d / 2, 0.007); return g;
  };
  for (let level = 0; level < 4; level++) {
    let stackY = levels[level] + 0.05;
    const count = [3, 5, 4, 4][level];
    for (let i = 0; i < count; i++) {
      const h = 0.055 + ((i + level) % 3) * 0.028;
      book(shelves, `stack-${level}-book-${i}`, -0.32 + Math.sin(i * 7) * 0.04, stackY + h / 2, 0.03, 0.65 + (i % 2) * 0.14, h, 0.64, bookColors[(i + level * 2) % 7], Math.sin(i * 2 + level) * 0.08);
      stackY += h + 0.024;
    }
  }
  box('folded-linen-lower-shelf', 0.61, 0.13, 0.65, M.textile, shelves, 0.38, 0.29, 0.02, 0.055);
  box('linen-fold-on-top', 0.59, 0.08, 0.63, M.ivory, shelves, 0.39, 0.39, 0.025, 0.03);
  box('small-rose-pouch', 0.5, 0.33, 0.43, M.pink, shelves, 0.38, 1.23, 0.1, 0.065);
  rod('pouch-zipper', [0.18, 1.41, 0.1], [0.58, 1.41, 0.1], 0.009, M.brass, shelves);
  for (let i = 0; i < 4; i++) {
    const h = [0.43, 0.6, 0.52, 0.4][i];
    cylinder(`anonymous-bottle-${i}`, 0.055, 0.06, h, [M.ivory, M.blue, M.ceramic, M.charcoal][i], shelves, 0.1 + i * 0.14, 2.7 + h / 2, 0.14, 12);
    cylinder(`bottle-cap-${i}`, 0.039, 0.039, 0.065, M.charcoal, shelves, 0.1 + i * 0.14, 2.74 + h, 0.14, 12);
  }
  for (let i = 0; i < 3; i++) book(shelves, `top-stack-book-${i}`, 0.3, 3.58 + i * 0.13, -0.09, 0.67 - i * 0.035, 0.095, 0.53, bookColors[i + 1], -0.03);
  cylinder('top-shelf-mug', 0.105, 0.082, 0.24, M.ceramic, shelves, -0.26, 3.67, 0.16);
  const mugHandle = mesh('top-shelf-mug-handle', new THREE.TorusGeometry(0.068, 0.018, 6, 16), M.ceramic, shelves, -0.38, 3.69, 0.16);
  sphere('small-ceramic-object', 0.12, M.ceramic, shelves, 0.01, 3.67, 0.12, [0.75, 1.1, 0.8]);
  // Unlettered frame, deliberately not a reproduction of any document.
  frame('blank-shelf-frame', 0.77, 0.94, 0.045, 0.045, M.brassLight, shelves, -0.22, 4.19, -0.36);
  box('blank-shelf-frame-insert', 0.69, 0.86, 0.02, M.paper, shelves, -0.22, 4.19, -0.37);
  cylinder('slim-navy-cylinder', 0.043, 0.043, 0.86, bookColors[4], shelves, -0.53, 3.96, -0.21);

  const display = group('wall-display');
  box('display-bezel', 2.75, 1.62, 0.1, M.screenEdge, display, -0.08, 4.45, -3.055, 0.045);
  box('unlettered-dark-display', 2.64, 1.51, 0.016, M.screen, display, -0.08, 4.46, -2.995, 0.02);
  sphere('display-status-dot', 0.011, M.brassLight, display, -0.08, 3.668, -2.987);
  box('socket-plate', 0.82, 0.16, 0.06, M.ivory, display, 0.16, 3.19, -3.06, 0.03);
  for (let i = 0; i < 3; i++) cylinder(`socket-${i}`, 0.044, 0.044, 0.007, M.ivoryDark, display, -0.09 + i * 0.25, 3.19, -3.023, 16).rotation.x = Math.PI / 2;
  const cableCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.63, 3.63, -3.03), new THREE.Vector3(0.62, 3.12, -3.015), new THREE.Vector3(0.7, 2.79, -3), new THREE.Vector3(0.59, 2.43, -3)]);
  mesh('display-cable', new THREE.TubeGeometry(cableCurve, 20, 0.011, 6, false), M.graphite, display);

  const desk = group('pale-desk'); desk.position.set(0.35, 0.32, -2.12);
  const desktopShape = new THREE.Shape();
  desktopShape.moveTo(-1.72, -0.59); desktopShape.lineTo(1.64, -0.59);
  desktopShape.bezierCurveTo(2.13, -0.56, 2.24, -0.04, 2.05, 0.43);
  desktopShape.bezierCurveTo(1.86, 0.77, 1.1, 0.71, 0.46, 0.58);
  desktopShape.bezierCurveTo(-0.35, 0.43, -1.4, 0.74, -1.82, 0.49);
  desktopShape.bezierCurveTo(-2.1, 0.31, -2.13, -0.5, -1.72, -0.59);
  const topGeo = new THREE.ExtrudeGeometry(desktopShape, { depth: 0.1, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: 0.038, bevelThickness: 0.027, curveSegments: 24 });
  topGeo.rotateX(-Math.PI / 2);
  mesh('curved-ivory-desktop', topGeo, M.ivory, desk, 0, 1.79, 0);
  // Small bead under the scalloped edge.
  const beadGeo = topGeo.clone(); const bead = mesh('desktop-edge-bead', beadGeo, M.ivoryDark, desk, 0, 1.745, 0); bead.scale.set(0.993, 0.42, 0.993);
  box('desk-left-drawer', 0.71, 0.34, 0.93, M.ivory, desk, -1.33, 1.57, 0, 0.055);
  box('desk-right-drawer', 0.72, 0.34, 0.93, M.ivory, desk, 1.46, 1.57, 0, 0.055);
  for (const x of [-1.33, 1.46]) {
    box(`drawer-face-${x}`, 0.58, 0.23, 0.027, M.ivoryDark, desk, x, 1.57, 0.481, 0.035);
    rod(`drawer-pull-${x}`, [x - 0.075, 1.58, 0.535], [x + 0.075, 1.58, 0.535], 0.012, M.brass, desk);
  }
  const legProfile = [[0, 0], [0.067, 0], [0.078, 0.04], [0.073, 0.17], [0.06, 0.9], [0.105, 1.03], [0.07, 1.1], [0.126, 1.17], [0.127, 1.22], [0.073, 1.31], [0.123, 1.39], [0.12, 1.45], [0.11, 1.5], [0, 1.5]];
  for (const x of [-1.57, 1.67]) for (const z of [-0.37, 0.37]) lathe(`turned-desk-leg-${x}-${z}`, legProfile, M.ivory, desk, x, 0, z);
  box('desk-centre-apron', 1.91, 0.13, 0.11, M.ivoryDark, desk, 0.05, 1.68, 0.4, 0.03);
  box('closed-notebook', 0.66, 0.065, 0.43, bookColors[4], desk, -0.51, 1.94, 0.04, 0.022).rotation.y = -0.09;
  box('notebook-page-edge', 0.59, 0.035, 0.41, M.paper, desk, -0.51, 1.942, 0.045);
  box('quiet-keyboard', 0.79, 0.035, 0.27, M.ceramic, desk, 0.21, 1.94, 0.14, 0.018);
  for (let row = 0; row < 3; row++) for (let col = 0; col < 10; col++) box(`keyboard-key-${row}-${col}`, 0.047, 0.006, 0.041, M.ivoryDark, desk, -0.09 + col * 0.064, 1.961, 0.06 + row * 0.064, 0.006);
  sphere('desk-mouse', 0.073, M.ceramic, desk, 0.81, 1.958, 0.18, [0.85, 0.45, 1.2]);
  cylinder('blue-desk-bottle', 0.065, 0.072, 0.25, M.blue, desk, -1.63, 2.035, 0.17, 16);
  cylinder('blue-bottle-white-cap', 0.033, 0.034, 0.08, M.ceramic, desk, -1.63, 2.2, 0.17, 12);
  cylinder('pencil-cup', 0.068, 0.053, 0.16, M.ivoryDark, desk, -1.27, 1.997, -0.28, 16);
  rod('pencil-one', [-1.29, 2.03, -0.28], [-1.33, 2.38, -0.28], 0.011, M.wood, desk);
  rod('pencil-two', [-1.24, 2.03, -0.28], [-1.23, 2.33, -0.26], 0.01, M.graphite, desk);

  const bouquet = group('small-flower-bouquet', desk); bouquet.position.set(-0.91, 1.92, -0.29);
  lathe('ceramic-bud-vase', [[0, 0], [0.095, 0], [0.12, 0.06], [0.12, 0.24], [0.068, 0.36], [0.065, 0.43]], M.blue, bouquet, 0, 0, 0, 24);
  for (let i = 0; i < 9; i++) {
    const a = i * 2.4, x = Math.cos(a) * (i % 3 === 0 ? 0.11 : 0.25), z = Math.sin(a) * 0.19, y = 0.69 + (i % 3) * 0.095;
    rod(`flower-stem-${i}`, [0, 0.24, 0], [x, y, z], 0.012, M.stems, bouquet);
    sphere(`flower-leaf-${i}`, 0.085, M.leaves, bouquet, x * 0.52 + 0.04, y * 0.63, z * 0.6, [0.7, 1.45, 0.35]).rotation.z = 0.7;
    for (let p = 0; p < 5; p++) sphere(`flower-${i}-petal-${p}`, 0.059, [M.flowerCream, M.flowerYellow, M.flowerRed][i % 3], bouquet, x + Math.cos(p * 1.256) * 0.04, y + Math.sin(p * 1.256) * 0.035, z, [1, 1.1, 0.85]);
    sphere(`flower-${i}-centre`, 0.023, M.flowerYellow, bouquet, x, y, z + 0.048);
  }

  const lamp = group('pleated-lamp'); lamp.position.set(1.72, 2.235, -2.21);
  cylinder('lamp-brass-foot', 0.21, 0.235, 0.035, M.brass, lamp, 0, 0, 0, 48);
  cylinder('lamp-base-bead', 0.177, 0.198, 0.029, M.brassLight, lamp, 0, 0.025, 0, 48);
  cylinder('slender-lamp-stem', 0.019, 0.025, 1.09, M.brass, lamp, 0, 0.57, 0, 16);
  const shadeVertices = [], shadeIndices = [], segments = 128;
  for (let j = 0; j < 2; j++) for (let i = 0; i <= segments; i++) {
    const a = i / segments * Math.PI * 2, r = (j ? 0.33 : 0.52) + (i % 2 ? -0.013 : 0.013);
    shadeVertices.push(Math.cos(a) * r, j ? 1.89 : 0.94, Math.sin(a) * r);
  }
  for (let i = 0; i < segments; i++) { const a = i, b = i + segments + 1; shadeIndices.push(a, b, a + 1, b, b + 1, a + 1); }
  const shadeGeo = new THREE.BufferGeometry(); shadeGeo.setAttribute('position', new THREE.Float32BufferAttribute(shadeVertices, 3)); shadeGeo.setIndex(shadeIndices); shadeGeo.computeVertexNormals();
  mesh('pleated-linen-shade', shadeGeo, M.shade, lamp);
  for (const [r, y] of [[0.52, 0.94], [0.33, 1.89]]) { const rim = mesh(`shade-bound-edge-${y}`, new THREE.TorusGeometry(r, 0.014, 6, 64), M.shadeEdge, lamp, 0, y, 0); rim.rotation.x = Math.PI / 2; }
  sphere('warm-lamp-bulb', 0.093, M.lampInside, lamp, 0, 1.18, 0, [1, 1.2, 1]);
  lamp.userData.lightAnchor = [1.72, 3.405, -2.21];

  const mirror = group('tall-mirror'); mirror.position.set(3.12, 3.02, -3.025);
  box('mirror-backing', 1.92, 4.5, 0.065, M.woodDark, mirror, 0, 0, 0, 0.025);
  frame('mirror-outer-moulding', 1.98, 4.57, 0.084, 0.12, M.brassLight, mirror, 0, 0, 0.033, 0.025);
  frame('mirror-dark-recess', 1.82, 4.39, 0.061, 0.05, M.woodDark, mirror, 0, 0, 0.101, 0.012);
  frame('mirror-inner-bevel', 1.7, 4.27, 0.069, 0.065, M.brass, mirror, 0, 0, 0.117, 0.02);
  box('privacy-safe-mirror-glass', 1.566, 4.13, 0.017, M.mirror, mirror, 0, 0, 0.129);
  // Abstract light bands identify glass without reconstructing a reflected room.
  const glintShape = new THREE.Shape(); glintShape.moveTo(-0.75, -1.86); glintShape.lineTo(-0.75, -0.34); glintShape.lineTo(0.75, 1.88); glintShape.lineTo(0.75, 0.86); glintShape.closePath();
  mesh('abstract-mirror-light-band', new THREE.ShapeGeometry(glintShape), M.mirrorGlint, mirror, 0, 0, 0.14);
  const glintThin = new THREE.Shape(); glintThin.moveTo(-0.75, -2.01); glintThin.lineTo(-0.75, -1.94); glintThin.lineTo(0.75, 0.42); glintThin.lineTo(0.75, 0.29); glintThin.closePath();
  mesh('mirror-fine-light-band', new THREE.ShapeGeometry(glintThin), M.mirrorGlint, mirror, 0, 0, 0.141);

  const chair = group('dark-chair'); chair.position.set(0.01, 0.32, -0.19); chair.rotation.y = -0.11;
  cylinder('chair-gas-lift', 0.057, 0.065, 0.87, M.chairFrame, chair, 0, 0.62, 0, 16);
  cylinder('chair-base-hub', 0.11, 0.14, 0.11, M.graphite, chair, 0, 0.24, 0, 20);
  for (let i = 0; i < 5; i++) {
    const angle = i / 5 * Math.PI * 2, x = Math.sin(angle) * 0.73, z = Math.cos(angle) * 0.73;
    rod(`chair-base-spoke-${i}`, [0, 0.27, 0], [x, 0.15, z], 0.047, M.chairFrame, chair);
    const wheel = cylinder(`chair-castor-${i}`, 0.097, 0.097, 0.11, M.graphite, chair, x, 0.102, z, 16); wheel.rotation.z = Math.PI / 2;
  }
  box('chair-seat-underframe', 1.07, 0.1, 0.95, M.graphite, chair, 0, 1.08, -0.02, 0.045);
  box('chair-seat-cushion', 1.19, 0.2, 1.08, M.charcoal, chair, 0, 1.21, -0.02, 0.09);
  const back = group('sculpted-chair-back', chair); back.position.set(0, 1.96, 0.41); back.rotation.x = 0.095;
  box('chair-back-shell', 1.14, 1.42, 0.135, M.chairFrame, back, 0, 0, 0, 0.065);
  box('chair-back-mesh-inset', 0.99, 1.21, 0.03, M.graphite, back, 0, 0, 0.079, 0.055);
  // Raised, separated mesh ribs read as perforations without fragile alpha textures.
  for (let col = 0; col < 12; col++) {
    const x = -0.445 + col * 0.081;
    for (let row = 0; row < 7; row++) box(`chair-back-weave-${col}-${row}`, 0.025, 0.098, 0.016, M.chairMesh, back, x, -0.49 + row * 0.16, 0.102, 0.01);
  }
  box('chair-lumbar-bridge', 0.91, 0.1, 0.071, M.charcoal, back, 0, -0.4, 0.11, 0.035);
  box('headrest-support', 0.17, 0.46, 0.09, M.chairFrame, chair, 0, 2.71, 0.47, 0.03);
  box('chair-headrest-frame', 0.96, 0.4, 0.17, M.graphite, chair, 0, 2.96, 0.43, 0.077);
  box('chair-headrest-cushion', 0.85, 0.3, 0.05, M.charcoal, chair, 0, 2.96, 0.536, 0.06);
  for (const x of [-0.69, 0.69]) {
    rod(`armrest-upright-${x}`, [x, 1.08, 0.12], [x, 1.72, 0.1], 0.035, M.chairFrame, chair);
    box(`soft-chair-armrest-${x}`, 0.18, 0.09, 0.61, M.charcoal, chair, x, 1.76, -0.015, 0.045);
  }

  const bag = group('unbranded-tote'); bag.position.set(-3.08, 0.32, -0.65); bag.rotation.y = -0.2;
  box('tote-body', 0.48, 0.54, 0.3, M.terracotta, bag, 0, 0.28, 0, 0.045);
  for (const z of [-0.1, 0.1]) {
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.14, 0.55, z), new THREE.Vector3(-0.11, 0.8, z), new THREE.Vector3(0.11, 0.8, z), new THREE.Vector3(0.14, 0.55, z)]);
    mesh(`tote-handle-${z}`, new THREE.TubeGeometry(curve, 16, 0.017, 6, false), M.woodDark, bag);
  }
  // Lathed profile seams can contain non-unit averaged normals. Normalize once
  // per unique geometry so downstream GLB exporters need no repair pass.
  const normalized = new Set();
  room.traverse(obj => {
    if (!obj.isMesh || normalized.has(obj.geometry)) return;
    obj.geometry.normalizeNormals(); normalized.add(obj.geometry);
  });
  room.updateMatrixWorld(true);
  return room;
}

export default createLandmark;
