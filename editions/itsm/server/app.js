import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve, extname, sep } from 'node:path';
import { Readable } from 'node:stream';
import { createStore, hashPassword, verifyPassword, digest } from './store.js';
import { loadScenario } from './content.js';
import { createHandler } from './handler.js';
const root=resolve(fileURLToPath(new URL('../public/',import.meta.url)));
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml'};
export function createApp(options={}){
 const scenario=options.scenario||loadScenario();
 const store=createStore(options.databasePath||'./data/mavi-vadi.sqlite',scenario,options.admin);
 const handle=createHandler({store,scenario,passwords:{hashPassword,verifyPassword,digest},secureCookies:options.secureCookies,platformOwnerEmail:options.platformOwnerEmail});
 const server=createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','same-origin');
  res.setHeader('Content-Security-Policy',"default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'");
  try{
   const url=new URL(req.url,'http://'+req.headers.host);
   if(url.pathname.startsWith('/api/')||url.pathname==='/health'){
    const request=new Request(url,{method:req.method,headers:req.headers,...(!['GET','HEAD'].includes(req.method)?{body:Readable.toWeb(req),duplex:'half'}:{})});
    const response=await handle(request,{remoteAddress:req.socket.remoteAddress});
    res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));return;
   }
   if(!['GET','HEAD'].includes(req.method)){res.writeHead(405);res.end();return;}
   let decoded;try{decoded=decodeURIComponent(url.pathname);}catch{res.writeHead(400);res.end();return;}
   const file=resolve(root,'.'+(decoded==='/'?'/index.html':decoded));
   if(!file.startsWith(root+sep)){res.writeHead(404);res.end();return;}
   try{const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});res.end(req.method==='HEAD'?undefined:data);}
   catch{res.writeHead(404,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'Sayfa bulunamadı.'}));}
  }catch(error){console.error(error);if(!res.headersSent)res.writeHead(500);res.end();}
 });
 server.on('close',()=>store.db.close());return {server,store,scenario};
}
