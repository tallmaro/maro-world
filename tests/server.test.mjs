import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from '../tools/serve.mjs';
test('server exposes the curated public root only',async()=>{
  const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${server.address().port}`;
  try{
    assert.equal((await fetch(base+'/')).status,200);
    for(const route of ['/README.md','/asset-sources.json','/me/personal.md','/node_modules/three/package.json','/.git/config','/../me/personal.md','/%2e%2e%2fme%2fpersonal.md'])assert.equal((await fetch(base+route)).status,404,route);
    const res=await fetch(base+'/assets/room/landmark.js');assert.equal(res.status,200);assert.match(res.headers.get('content-type'),/javascript/);
  }finally{await new Promise(r=>server.close(r));}
});
