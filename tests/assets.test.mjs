import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { normalizeLandmark, batchStaticGroups, disposeTree } from '../public/src/assets.js';
import { createLandmark as roomFactory } from '../public/assets/room/landmark.js';
import { createLandmark as libraryFactory, setCutaway, setEntranceOpen } from '../public/assets/library/landmark.js';
import { createLandmark as stambaFactory } from '../public/assets/stamba/landmark.js';
import { createLandmark as schoolFactory } from '../public/assets/qsi/landmark.js';

for (const [name, factory] of Object.entries({room:roomFactory, library:libraryFactory, stamba:stambaFactory, qsi:schoolFactory})) {
  test(`${name} is finite, grounded and normalized by a host transform on r180`, () => {
    const model=factory(THREE), host=normalizeLandmark(model,8);
    const bounds=new THREE.Box3().setFromObject(host), size=bounds.getSize(new THREE.Vector3());
    assert.ok(Math.abs(size.x-8)<.001); assert.ok(Math.abs(bounds.min.y)<.001);
    assert.ok(size.toArray().every(Number.isFinite)); assert.equal(model.scale.x,1);
    disposeTree(host);
  });
}
test('room batching preserves triangles, bounds, semantic anchors and corrected clear floor', () => {
  const room=roomFactory(THREE), before=new THREE.Box3().setFromObject(room);
  const count=root=>{let n=0;root.traverse(o=>{if(o.isMesh)n+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;});return n;};
  const triangles=count(room); batchStaticGroups(room);
  let meshes=0;room.traverse(o=>{if(o.isMesh)meshes++;});
  assert.ok(meshes<110,`still ${meshes} meshes`); assert.equal(count(room),triangles);
  const after=new THREE.Box3().setFromObject(room);
  assert.ok(before.min.distanceTo(after.min)<.00001); assert.ok(before.max.distanceTo(after.max)<.00001);
  for(const name of ['room-shell','pale-desk','pleated-lamp','tall-shelves']) assert.ok(room.getObjectByName(name));
  assert.deepEqual(room.getObjectByName('pleated-lamp').userData.lightAnchor,[1.72,3.405,-2.21]);
  const ray=new THREE.Raycaster(new THREE.Vector3(-2.5,1.1,2),new THREE.Vector3(0,-1,0));
  assert.ok(ray.intersectObject(room,true)[0].point.y<.4);
  disposeTree(room);
});
test('library helpers and named study anchors survive host placement',()=>{
  const library=libraryFactory(THREE), host=normalizeLandmark(library,8); host.position.set(-9,0,-7);
  setCutaway(library,true); assert.equal(library.getObjectByName('upper-storeys').visible,false);
  setEntranceOpen(library,false); assert.equal(library.getObjectByName('entrance-door-left').rotation.y,0);
  setEntranceOpen(library,true); assert.equal(library.getObjectByName('entrance-door-left').rotation.y,-1.27);
  for(const name of ['study-table-01','study-table-06','bookshelf-01','bookshelf-02','entrance-anchor','study-seat-anchor'])assert.ok(host.getObjectByName(name));
  disposeTree(host);
});
test('shared resources are disposed once, including instanced mesh buffers',()=>{
  const root=new THREE.Group(), geometry=new THREE.BoxGeometry(), material=new THREE.MeshStandardMaterial();
  let g=0,m=0,i=0;geometry.addEventListener('dispose',()=>g++);material.addEventListener('dispose',()=>m++);
  root.add(new THREE.Mesh(geometry,material)); const inst=new THREE.InstancedMesh(geometry,material,2);inst.addEventListener('dispose',()=>i++);root.add(inst);
  disposeTree(root); assert.deepEqual([g,m,i],[1,1,1]);assert.equal(root.children.length,0);
});
