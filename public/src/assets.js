import * as THREE from 'three';
import { mergeGeometries } from '../vendor/BufferGeometryUtils.js';

export const libraryAction=type=>type==='bookshelf'?'shelf':type==='study-table'?'table':'entrance';

export function normalizeLandmark(root,width=8){
  const box=new THREE.Box3().setFromObject(root),size=box.getSize(new THREE.Vector3()),center=box.getCenter(new THREE.Vector3());
  const host=new THREE.Group(),offset=new THREE.Group();
  host.name=`host-${root.name}`;offset.position.set(-center.x,-box.min.y,-center.z);offset.add(root);host.add(offset);host.scale.setScalar(width/size.x);
  host.userData.normalization={sourceBounds:{min:box.min.toArray(),max:box.max.toArray()},scale:width/size.x};host.updateMatrixWorld(true);return host;
}

export function batchStaticGroups(root){
  root.updateMatrixWorld(true);const retired=new Set();
  for(const group of root.children){
    if(!group.isGroup)continue;
    const meshes=[];group.traverse(o=>{if(o.isMesh&&!o.isInstancedMesh)meshes.push(o);});
    const batches=new Map(),inverse=new THREE.Matrix4().copy(group.matrixWorld).invert();
    for(const mesh of meshes){
      if(Array.isArray(mesh.material))continue;
      let geometry=mesh.geometry.index?mesh.geometry.toNonIndexed():mesh.geometry.clone();
      for(const key of Object.keys(geometry.attributes))if(!['position','normal'].includes(key))geometry.deleteAttribute(key);
      geometry.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inverse,mesh.matrixWorld));
      if(!batches.has(mesh.material))batches.set(mesh.material,[]);batches.get(mesh.material).push(geometry);
      retired.add(mesh.geometry);mesh.removeFromParent();
    }
    for(const [material,parts] of batches){
      const geometry=mergeGeometries(parts,false);if(!geometry)throw new Error(`Unable to batch ${group.name}`);
      parts.forEach(g=>g.dispose());geometry.computeBoundingBox();geometry.computeBoundingSphere();
      const mesh=new THREE.Mesh(geometry,material);mesh.name=`${group.name}-batch-${material.id}`;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);
    }
  }
  retired.forEach(g=>g.dispose());root.updateMatrixWorld(true);return root;
}

export function disposeTree(root){
  const geometries=new Set(),materials=new Set(),textures=new Set();
  root.traverse(o=>{
    if(o.geometry)geometries.add(o.geometry);
    for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[])materials.add(m);
    if(o.isInstancedMesh)o.dispose();
  });
  materials.forEach(m=>{for(const value of Object.values(m))if(value?.isTexture)textures.add(value);});
  root.removeFromParent();root.clear();textures.forEach(t=>t.dispose());geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());
}
