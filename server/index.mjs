/** FINOVA local web server for static files and optional cloud accounts.
 * Run using Node 20+: node server/index.mjs
 * No external npm dependencies required. Never expose this local development server to the public internet.
 */
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {register,login,logout,userFromRequest,getWorkspace,putWorkspace,clearCookie} from './accounts.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const PORT=Number(process.env.PORT||8787);
const send=(res,code,obj)=>{res.writeHead(code,{'content-type':'application/json; charset=utf-8','cache-control':'no-store','x-content-type-options':'nosniff'});res.end(JSON.stringify(obj));};
const readBody=async(req,max=1024*1024)=>{const parts=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>max)throw new Error('Upload too large');parts.push(chunk);}return Buffer.concat(parts);};
const rate=new Map();
const server=http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://localhost');
 try{
  // Account endpoints are available only when an authenticated session is present.
  if(url.pathname.startsWith('/api/account/')){
   const secure=process.env.FINOVA_HTTPS==='true';
   const origin=req.headers.origin;
   const host=req.headers.host;
   // Browser-origin validation prevents cross-site POSTs against cookie sessions.
   if(req.method==='POST' && (!origin || new URL(origin).host!==host || !['http:','https:'].includes(new URL(origin).protocol))) return send(res,403,{error:'Cross-origin requests are forbidden.'});
   if(url.pathname==='/api/account/me'&&req.method==='GET')return send(res,200,{user:userFromRequest(req)});
   if(['/api/account/register','/api/account/login'].includes(url.pathname)&&req.method==='POST'){
    const ip=req.socket.remoteAddress||'unknown',now=Date.now(),rk='auth:'+ip;
    const list=(rate.get(rk)||[]).filter(t=>now-t<900000);if(list.length>=12)return send(res,429,{error:'Too many attempts. Try again later.'});list.push(now);rate.set(rk,list);
    const data=JSON.parse((await readBody(req,8192)).toString('utf8'));
    const result=url.pathname.endsWith('register')?await register(data,secure):await login(data,secure);
    res.setHeader('Set-Cookie',result.cookie);return send(res,200,{user:result.user});
   }
   if(url.pathname==='/api/account/logout'&&req.method==='POST'){logout(req);res.setHeader('Set-Cookie',clearCookie(secure));return send(res,200,{ok:true});}
   const user=userFromRequest(req);if(!user)return send(res,401,{error:'Sign in to access your workspace.'});
   if(url.pathname==='/api/account/workspace'&&req.method==='GET')return send(res,200,getWorkspace(user.id));
   if(url.pathname==='/api/account/workspace'&&req.method==='POST'){
    const payload=JSON.parse((await readBody(req,1200000)).toString('utf8'));
    return send(res,200,putWorkspace(user.id,payload.data,payload.revision));
   }
   return send(res,404,{error:'Account endpoint not found.'});
  }
  if(url.pathname.startsWith('/api/'))return send(res,404,{error:'API endpoint not found.'});
  const relative=decodeURIComponent(url.pathname)==='/'?'index.html':decodeURIComponent(url.pathname).slice(1);
  const file=path.resolve(root,relative);if(!file.startsWith(root+path.sep)||relative.includes('..'))return send(res,403,{error:'Forbidden'});
  const info=await stat(file).catch(()=>null);if(!info?.isFile())return send(res,404,{error:'Not found'});
  const ext=path.extname(file);res.writeHead(200,{'content-type':({'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png'}[ext]||'application/octet-stream'),'x-content-type-options':'nosniff'});res.end(await readFile(file));
 }catch(err){console.error('FINOVA request:',err.message);send(res,err.status||500,{error:err.status?err.message:'Request failed. Please try again.'});}
});
server.listen(PORT,'127.0.0.1',()=>console.log(`FINOVA at http://localhost:${PORT}`));
