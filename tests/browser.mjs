import { strict as assert } from 'node:assert';
import { mkdir, writeFile } from 'node:fs/promises';
import { createServer } from '../tools/serve.mjs';
const { chromium }=await import(process.env.PLAYWRIGHT_MODULE||'/Users/macbookpro/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
const server=createServer();await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin=`http://127.0.0.1:${server.address().port}`;
const errors=[],remote=[];const report={};
const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(!r.url().startsWith(origin))remote.push(r.url());});
const out=new URL('../.impeccable/review/',import.meta.url);await mkdir(out,{recursive:true});
try{
  const response=await page.goto(origin);assert.equal(response.status(),200,'world entry must exist');
  await page.waitForFunction(()=>document.querySelector('#scene canvas')?.dataset.ready==='true');
  await page.waitForFunction(()=>document.querySelector('#loading-status').dataset.complete==='true');
  assert.equal(await page.locator('canvas').count(),1);assert.equal(await page.locator('iframe').count(),0);assert.deepEqual(remote,[]);
  report.overview=await page.evaluate(()=>worldDiagnostics());
  await page.screenshot({path:new URL('desktop.png',out).pathname,fullPage:true});
  await page.getByRole('button',{name:'Visit Bocconi library',exact:true}).click();
  const transitionFrames=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let last=performance.now();function sample(now){samples.push(now-last);last=now;if(worldDiagnostics().moving)requestAnimationFrame(sample);else resolve(samples.slice(2));}requestAnimationFrame(sample);}));
  report.transitionFrameMs=transitionFrames.sort((a,b)=>a-b);assert.ok(report.transitionFrameMs.length>10);
  await page.getByRole('button',{name:'Study room',exact:true}).click();
  await page.waitForFunction(()=>worldDiagnostics().view==='study'&&!worldDiagnostics().moving);
  assert.equal(await page.locator('#study-layer').isVisible(),true);
  await page.getByRole('button',{name:'Close entrance doors',exact:true}).click();
  assert.equal(await page.getByRole('button',{name:'Open entrance doors',exact:true}).count(),1);
  await page.getByRole('button',{name:'Open entrance doors',exact:true}).click();
  await page.locator('#course-select').selectOption({label:'Game Theory and Mechanism Design'});
  assert.match(await page.locator('#takeaway').textContent(),/not added/i);
  await page.getByRole('button',{name:'Look at this study table',exact:true}).click();
  await page.waitForFunction(()=>!worldDiagnostics().moving);
  report.library=await page.evaluate(()=>worldDiagnostics());
  await page.screenshot({path:new URL('library.png',out).pathname,fullPage:true});
  await page.getByRole('button',{name:'Back to world',exact:true}).click();
  await page.waitForFunction(()=>!worldDiagnostics().moving);assert.equal(await page.evaluate(()=>worldDiagnostics().libraryCutaway),false,'overview must restore library exterior');
  for(const [id,name] of [['room','My workspace'],['qsi','QSI Tbilisi'],['stamba','Stamba']]){
    await page.getByRole('button',{name:`Visit ${name}`,exact:true}).click();
    await page.waitForFunction(id=>worldDiagnostics().place===id&&!worldDiagnostics().moving,id);
    report[id]=await page.evaluate(()=>worldDiagnostics());
    assert.equal(report[id].visiblePlaces,1);
    await page.screenshot({path:new URL(`${id}.png`,out).pathname,fullPage:true});
  }
  await page.getByRole('button',{name:'Music for this place',exact:false}).click();assert.equal(await page.locator('iframe').count(),0);
  await page.getByRole('button',{name:'Load official player',exact:true}).click();assert.equal(await page.locator('iframe').count(),1);
  await page.getByRole('button',{name:'Back to world',exact:true}).click();assert.equal(await page.locator('iframe').count(),0);
  // Repeated travel must not construct more renderers or GPU geometries.
  await page.waitForFunction(()=>!worldDiagnostics().moving);const memory=await page.evaluate(()=>worldDiagnostics().geometries);
  for(let i=0;i<3;i++){
    await page.getByRole('button',{name:'Visit My workspace',exact:true}).click();
    await page.waitForFunction(()=>!worldDiagnostics().moving);
    await page.getByRole('button',{name:'Back to world',exact:true}).click();await page.waitForFunction(()=>!worldDiagnostics().moving);
  }
  assert.equal(await page.evaluate(()=>worldDiagnostics().geometries),memory);assert.equal(await page.locator('canvas').count(),1);
  const frames=await page.evaluate(()=>new Promise(resolve=>{const samples=[];let last=performance.now();function frame(t){samples.push(t-last);last=t;if(samples.length<45)requestAnimationFrame(frame);else resolve(samples.slice(2));}requestAnimationFrame(frame);}));
  report.idleRafMedianMs=frames.sort((a,b)=>a-b)[Math.floor(frames.length/2)];
  await page.locator('canvas').focus();await page.keyboard.press('ArrowRight');await page.keyboard.press('+');
  await page.emulateMedia({reducedMotion:'reduce'});
  await page.getByRole('button',{name:'Visit My workspace',exact:true}).click();assert.equal(await page.evaluate(()=>worldDiagnostics().moving),false);
  await page.getByRole('button',{name:'Lamplight',exact:true}).click();await page.getByRole('button',{name:'At the desk',exact:true}).click();
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
  await page.screenshot({path:new URL('mobile-room.png',out).pathname,fullPage:true});
  await page.getByRole('button',{name:'Back to world',exact:true}).click();
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  await page.screenshot({path:new URL('mobile.png',out).pathname,fullPage:true});
  await page.setViewportSize({width:1057,height:900});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:new URL('user-1057.png',out).pathname,fullPage:true});
  await page.setViewportSize({width:1280,height:720});await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));await page.screenshot({path:new URL('user-1280.png',out).pathname,fullPage:true});
  // GPU failure keeps native navigation and local stills, and unloads music.
  await page.evaluate(()=>{const canvas=document.querySelector('canvas');canvas.dispatchEvent(new Event('webglcontextlost',{cancelable:true}));});
  assert.equal(await page.locator('#fallback').isVisible(),true);
  await page.getByRole('button',{name:'Visit My workspace',exact:true}).click();assert.equal(await page.locator('#fallback img').isVisible(),true);
  const fallback=await browser.newPage({viewport:{width:390,height:844}});
  await fallback.addInitScript(()=>{HTMLCanvasElement.prototype.getContext=()=>null;});await fallback.goto(origin);await fallback.waitForSelector('#fallback:not([hidden])');
  await fallback.getByRole('button',{name:'Visit QSI Tbilisi',exact:true}).click();assert.match(await fallback.locator('#place-title').textContent(),/QSI/);await fallback.close();
  assert.deepEqual(errors,[]);report.errors=errors;report.initialRemoteRequests=0;report.musicFrameMountedAndRemoved=true;report.resourceCountStable=true;
  await writeFile(new URL('../verification.json',import.meta.url),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();await new Promise(r=>server.close(r));}
