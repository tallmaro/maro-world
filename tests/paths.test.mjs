import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

test('public URLs are relative, so the world also works under a subpath such as GitHub Pages',async()=>{
  const files=['index.html','style.css',...(await readdir(new URL('../public/src/',import.meta.url))).map(f=>`src/${f}`)];
  for(const file of files)assert.doesNotMatch(await readFile(new URL(`../public/${file}`,import.meta.url),'utf8'),/["'(`]\/(assets|vendor|src|fonts|style\.css|favicon)/,file);
});
