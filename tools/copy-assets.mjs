import { readFile, copyFile, mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const project=fileURLToPath(new URL('../',import.meta.url));
const source=path.resolve(project,'../maro-world-assets');
const entries=[
  ['bocconi-library/landmark.js','assets/library/landmark.js'],
  ['tbilisi-workspace/landmark.js','assets/room/landmark.js'],
  ['qsi-tbilisi/landmark.js','assets/qsi/landmark.js'],
  ['stamba/stamba.js','assets/stamba/landmark.js'],
  ...[['bocconi-library','library'],['tbilisi-workspace','room'],['qsi-tbilisi','qsi'],['stamba','stamba']].map(([dir,id])=>[`${dir}/preview.png`,`assets/${id}/preview.png`]),
  ...['three.module.js','three.core.js','OrbitControls.js','THREE-LICENSE.txt'].map(f=>[`stamba/vendor/${f}`,`vendor/${f}`]),
  ['stamba/node_modules/three/examples/jsm/utils/BufferGeometryUtils.js','vendor/BufferGeometryUtils.js'],
  ...['barlow-latin-400-normal.woff2','barlow-latin-600-normal.woff2','barlow-condensed-latin-600-normal.woff2','OFL-Barlow.txt'].map(f=>[`qsi-tbilisi/fonts/${f}`,`fonts/${f}`])
];
const hash=data=>createHash('sha256').update(data).digest('hex');
const records=[];
for(const [from,to] of entries){
  const original=await readFile(path.join(source,from));const dest=path.join(project,'public',to);
  let current;try{current=await readFile(dest);}catch(e){if(e.code!=='ENOENT')throw e;}
  if(current && hash(current)!==hash(original))throw new Error(`Refusing to overwrite changed asset: ${to}`);
  if(!current){if(process.argv.includes('--verify'))throw new Error(`Missing ${to}`);await mkdir(path.dirname(dest),{recursive:true});await copyFile(path.join(source,from),dest);}
  records.push({source:`../maro-world-assets/${from}`,file:`public/${to}`,bytes:original.length,sha256:hash(original),representation:'Byte-identical copy; original preserved'});
}
if(!process.argv.includes('--verify'))await writeFile(path.join(project,'asset-sources.json'),JSON.stringify({copiedOn:'2026-09-25',threeRevision:180,scope:'Explicit public-ready allowlist only. GLBs and private references remain at source.',files:records},null,2)+'\n');
else{
  const saved=JSON.parse(await readFile(path.join(project,'asset-sources.json'),'utf8'));
  if(JSON.stringify(saved.files)!==JSON.stringify(records))throw new Error('Source manifest differs; inspect source changes before refreshing.');
}
console.log(`${records.length} allowlisted assets ${process.argv.includes('--verify')?'verified':'copied'}; all source/copy hashes match.`);
