import http from 'node:http';
import { readFile, realpath, stat } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';

const publicRoot=fileURLToPath(new URL('../public',import.meta.url));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.woff2':'font/woff2','.txt':'text/plain; charset=utf-8','.svg':'image/svg+xml'};
export function createServer({root=publicRoot}={}){
  return http.createServer(async(req,res)=>{
    try{
      if(!['GET','HEAD'].includes(req.method)) {res.writeHead(405);res.end();return;}
      const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
      if(pathname.includes('\\')||pathname.includes('\0')||pathname.split('/').some(p=>p.startsWith('.')))throw new Error('not public');
      const requested=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
      const actual=await realpath(requested), base=await realpath(root);
      if(actual!==requested||!actual.startsWith(base+path.sep)||!types[path.extname(actual)]||!(await stat(actual)).isFile())throw new Error('not public');
      const data=await readFile(actual);
      res.writeHead(200,{'Content-Type':types[path.extname(actual)],'Content-Length':data.length,'Cache-Control':'no-store','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; frame-src https://open.spotify.com https://embed.music.apple.com; object-src 'none'; base-uri 'none'; frame-ancestors 'none'"});
      res.end(req.method==='HEAD'?undefined:data);
    }catch{res.writeHead(404,{'Content-Type':'text/plain'});res.end('Not found');}
  });
}
if(process.argv[1]&&pathToFileURL(path.resolve(process.argv[1])).href===import.meta.url){
  const port=Number(process.env.PORT||4390),server=createServer();
  server.on('error',e=>{console.error(`Preview did not start: ${e.message}. Choose another PORT; do not stop another server.`);process.exitCode=1;});
  server.listen(port,'127.0.0.1',()=>console.log(`Maro's world: http://127.0.0.1:${port}`));
}
