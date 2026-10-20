// Servidor HTTP (arquivos estáticos) + WebSocket (salas, lobby, partida autoritativa 60Hz, snapshots 30Hz)
const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws'),{step,spawn}=require('./physics'),Phys=require('../shared/physics');
const ROOT=path.join(__dirname,'../client'),MIME={'.html':'text/html','.js':'text/javascript','.css':'text/css'},DT=1/60;
const srv=http.createServer((q,s)=>{const u=q.url.split('?')[0],f=u.startsWith('/shared/')?path.join(__dirname,'..',u):path.join(ROOT,u==='/'?'index.html':u);
  if(!(f.startsWith(ROOT)||f.startsWith(path.join(__dirname,'../shared')))||!fs.existsSync(f)||fs.statSync(f).isDirectory()){s.writeHead(404);return s.end()}
  s.writeHead(200,{'Content-Type':MIME[path.extname(f)]||'text/plain'});fs.createReadStream(f).pipe(s)});
const wss=new WebSocketServer({server:srv}),rooms=new Map();let uid=1,tick=0;
const send=(ws,m)=>ws&&ws.readyState===1&&ws.send(JSON.stringify(m)),bc=(r,m)=>r.players.forEach(p=>send(p.ws,m));
const humans=r=>r.players.filter(p=>!p.bot),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rd=n=>Math.round(n*100)/100,r3=n=>Math.round(n*1000)/1000;
const hex=(s,d)=>/^#[0-9a-f]{6}$/i.test(s)?s:d;
const ri=(v,n)=>Number.isInteger(v)&&v>=0&&v<n?v:0;
const cfgOf=c=>{c=c||{};return{color:hex(c.color,'#2d8cff'),color2:hex(c.color2,'#ffffff'),boost:hex(c.boost,'#ffb02e'),wcolor:hex(c.wcolor,'#dde3ee'),bstyle:ri(c.bstyle,3),model:ri(c.model,3),wheel:ri(c.wheel,3),acc:ri(c.acc,4),decal:ri(c.decal,3),finish:ri(c.finish,5),gfx:ri(c.gfx,3)}};
const newCode=()=>{let c;do c=Array.from({length:5},()=>'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'[Math.random()*32|0]).join('');while(rooms.has(c));return c};
const info=r=>bc(r,{type:'room',code:r.code,size:r.size,diff:r.diff,host:r.host,state:r.state,
  players:r.players.map(p=>({id:p.id,name:p.name,team:p.team,ready:p.ready,bot:p.bot,off:p.off,cfg:p.cfg}))});
function start(r){
  r.players=r.players.filter(p=>!p.bot);
  for(const tm of [0,1])for(let n=r.players.filter(p=>p.team===tm).length,k=1;n<r.size;n++,k++)
    r.players.push({id:uid++,name:'BOT '+(tm?'L':'A')+k,bot:true,team:tm,cfg:cfgOf({color:tm?'#ff8a1f':'#2d8cff',model:k%3,acc:k%3}),ready:true,input:{}});
  Object.assign(r,{state:'cd',cd:3,time:120,score:[0,0]});r.A=Phys.arena(r.size);spawn(r);info(r);
}
function leave(r,p){
  if(r.state==='lobby'||r.state==='end'){r.players=r.players.filter(x=>x!==p)} // no jogo, vira bot
  else Object.assign(p,{bot:true,off:false,ws:null,name:'BOT'});
  if(r.host===p.id){const h=humans(r)[0];r.host=h?h.id:0}
  info(r);
}
wss.on('connection',ws=>{
  let p=null,r=null;const fail=msg=>send(ws,{type:'err',msg});
  ws.on('message',raw=>{
    let m;try{m=JSON.parse(raw)}catch{return}
    if(m.type==='ping')return send(ws,{type:'pong',t:m.t});
    if(!p){
      if(m.type==='create')r={code:newCode(),size:[1,2,3,4].includes(m.size)?m.size:2,diff:['easy','normal','hard','expert'].includes(m.diff)?m.diff:'normal',
        players:[],state:'lobby',cd:0,time:120,score:[0,0],ball:null,host:0};
      else if(m.type==='join'){r=rooms.get(String(m.code||'').toUpperCase());if(!r)return fail('Sala não encontrada');
        p=r.players.find(x=>!x.bot&&x.token&&x.token===m.token);
        if(p){p.ws=ws;p.off=false;p.offT=0}
        else if(r.state!=='lobby')return fail('Partida já em andamento');
        else if(humans(r).length>=r.size*2)return fail('Sala cheia')}
      else return;
      if(!p){const c0=humans(r).filter(x=>x.team===0).length,c1=humans(r).length-c0;
        p={id:uid++,token:Math.random().toString(36).slice(2),ws,name:String(m.name||'').replace(/[^\w \-]/g,'').slice(0,12)||'Player',
          cfg:cfgOf(m.cfg),team:c0<r.size&&(c0<=c1||c1>=r.size)?0:1,ready:false,bot:false,off:false,offT:0,input:{t:0,s:0,j:0,b:0}};
        r.players.push(p);if(!r.host)r.host=p.id}
      rooms.set(r.code,r);send(ws,{type:'joined',id:p.id,token:p.token,code:r.code});return info(r);
    }
    const lobby=r.state==='lobby';
    if(m.type==='input'){(p.q=p.q||[]).push({q:m.q|0,t:clamp(+m.t||0,-1,1),s:clamp(+m.s||0,-1,1),j:!!m.j,b:!!m.b,h:!!m.h,r:clamp(+m.r||0,-1,1)});if(p.q.length>6)p.q.shift()}
    else if(m.type==='team'&&lobby){const t=m.team===1?1:0;if(humans(r).filter(x=>x!==p&&x.team===t).length<r.size){p.team=t;p.ready=false;info(r)}}
    else if(m.type==='ready'&&lobby){p.ready=!!m.v;info(r);if(humans(r).every(x=>x.ready))start(r)}
    else if(m.type==='cfg'&&lobby){p.cfg=cfgOf(m.cfg);info(r)}
    else if(m.type==='settings'&&lobby&&p.id===r.host){const n=[1,2,3,4].includes(m.size)?m.size:r.size;
      if([0,1].every(t=>humans(r).filter(x=>x.team===t).length<=n)){r.size=n;if(['easy','normal','hard','expert'].includes(m.diff))r.diff=m.diff;info(r)}}
    else if(m.type==='lobby'&&r.state==='end'&&p.id===r.host){r.players=r.players.filter(x=>!x.bot);r.players.forEach(x=>x.ready=false);r.state='lobby';info(r)}
    else if(m.type==='leave'){leave(r,p);p=null;ws.close()}
  });
  ws.on('close',()=>{if(!p||!r)return;if(r.state==='lobby'||r.state==='end')leave(r,p);else{p.off=true;p.ws=null;p.input={t:0,s:0,j:0,b:0};p.offT=0;info(r)}});
});
function finish(r){r.state='end';bc(r,{type:'end',sc:r.score,winner:r.score[0]>r.score[1]?0:1})}
function simTick(){ // um passo fixo de 1/60 s
  tick++;
  for(const r of rooms.values()){
    if(!humans(r).some(p=>!p.off)){if((r.idle=(r.idle||0)+DT)>30)rooms.delete(r.code);continue}r.idle=0;
    if(r.state==='lobby'||r.state==='end')continue;
    for(const p of r.players)if(p.off&&(p.offT+=DT)>20){Object.assign(p,{bot:true,off:false,name:'BOT'});info(r)} // desconectado >20s: bot assume
    if(r.state==='cd'){if((r.cd-=DT)<=0)r.state='play'}
    else{
      const g=step(r,DT);
      if(r.state==='play'){r.time=Math.max(0,r.time-DT);
        if(g>=0){r.score[g]++;const by=r.players.find(x=>x.id===r.lastTouch);bc(r,{type:'goal',team:g,by:by?by.name:'',sc:r.score});
          if(r.time<=0)finish(r);else{r.state='goal';r.cd=3}}
        else if(r.time<=0&&r.score[0]!==r.score[1])finish(r)}
      else if(r.state==='goal'&&(r.cd-=DT)<=0){spawn(r);r.state='cd';r.cd=3}
    }
    if(tick%2===0)bc(r,{type:'s',st:r.state,cd:Math.ceil(r.cd),time:Math.ceil(r.time),sc:r.score,b:[rd(r.ball.x),rd(r.ball.y),rd(r.ball.z),rd(r.ball.vx),rd(r.ball.vy),rd(r.ball.vz),rd(r.ball.wx),rd(r.ball.wy),rd(r.ball.wz)],pd:r.pads.map(v=>v>0?1:0).join(''),
      c:r.players.map(p=>[p.id,rd(p.x),rd(p.y),rd(p.z),rd(p.yaw),p.boost|0,p.off?1:0,rd(p.vx),rd(p.vy),rd(p.vz),p.jc|0,rd(p.fdt||0),rd(p.fl>0?p.fl:0),p.ack|0,p.jp?1:0,r3(p.qw),r3(p.qx),r3(p.qy),r3(p.qz),rd(p.fds||0)])});
  }
}
// Acumulador de tempo: passo fixo 1/60 s independente da precisão do timer (setInterval(16.67) vira 16 ms = 62,5 Hz no Node).
// No máximo 5 passos por volta: após um travamento o servidor não tenta simular um período enorme de uma vez.
let lastT=process.hrtime.bigint(),acc=0;setInterval(()=>{const n=process.hrtime.bigint();acc+=Math.min(.25,Number(n-lastT)/1e9);lastT=n;for(let k=0;acc>=DT&&k<5;k++){acc-=DT;simTick()}if(acc>DT*5)acc=0},4);
srv.listen(process.env.PORT||3000,()=>console.log('Car Soccer em http://localhost:'+(process.env.PORT||3000)));
