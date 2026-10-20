// Testes de física SEM rede: aerial, flip, drible e flick usando exatamente o código do servidor
const P=require('../shared/physics'),{step}=require('./physics'),DT=P.DT,ok=(c,t)=>{console.log((c?'OK   ':'FALHA ')+t);if(!c)process.exitCode=1};
const mk=x=>{const c={id:1,team:0,bot:false,off:false,q:[],x:x||-10,y:.8,z:0,vx:0,vy:0,vz:0,yaw:0,boost:100,jp:false,jc:0,fl:0,wx:0,wy:0,wz:0,fdt:0,fds:0,ack:0,last:null};P.setYaw(c,0);return c};
const room=(c,b,n)=>({size:n||2,A:P.arena(n||2),players:[c],ball:Object.assign({x:30,y:1.5,z:0,vx:0,vy:0,vz:0,wx:0,wy:0,wz:0},b),pads:[0,0,0,0,0,0],diff:'normal',state:'play'});
const run=(r,n,f)=>{const c=r.players[0];for(let i=0;i<n;i++){c.last=f(i,c);step(r,DT)}};const I=o=>Object.assign({t:0,s:0,j:0,b:0,h:0,r:0},o);
// 1) aerial: pula, usa boost e inclina o nariz para cima
let c=mk(),r=room(c),maxY=0,maxPitch=0;run(r,150,i=>{maxY=Math.max(maxY,c.y);maxPitch=Math.max(maxPitch,Math.asin(P.rot(c,1,0,0)[1]));return I({j:i<3?1:0,t:i>10&&Math.asin(P.rot(c,1,0,0)[1])<1?1:0,b:i>8?1:0})});
ok(maxY>12&&maxPitch>.8,'aerial: altura máx '+maxY.toFixed(1)+' m, pitch máx '+(maxPitch*57.3|0)+'°');
// 2) air roll muda a orientação (teto vira de lado)
c=mk();r=room(c);let minUp=1;run(r,80,(i)=>{minUp=Math.min(minUp,P.rot(c,0,1,0)[1]);return I({j:i<3?1:0,r:i>10?1:0})});ok(minUp<.3,'air roll: teto inclinou até up.y='+minUp.toFixed(2));
// 3) flip direcional: gira ~360° e transfere impulso
c=mk();c.vx=10;r=room(c);let low=1,v0=0,sp=0;run(r,100,(i)=>{low=Math.min(low,P.rot(c,0,1,0)[1]);if(i===19)v0=c.vx;sp=c.vx;return I({j:i===1||i===20?1:0,t:i>=20?1:0})});
ok(low<-.5&&P.rot(c,0,1,0)[1]>.8&&sp>v0+5,'flip frontal: girou por baixo (up.y mín '+low.toFixed(2)+'), voltou ao normal, vx '+v0.toFixed(1)+' -> '+sp.toFixed(1));
// 4) bola no ar na frente do carro durante voo: impacto muda a trajetória da bola
c=mk();r=room(c,{x:100,y:100});let hit=0;run(r,70,(i)=>{if(i===30){const f=P.rot(c,1,0,0);Object.assign(r.ball,{x:c.x+f[0]*3.3,y:c.y+f[1]*3.3,z:c.z,vx:0,vy:0,vz:0})}if(i===31)hit=Math.hypot(r.ball.vx,r.ball.vy,r.ball.vz);return I({j:i<3?1:0,t:i>10?1:0,b:i>8?1:0})});
ok(hit>8,'aerial: bola atingida no ar mudou de 0 para '+hit.toFixed(1)+' m/s');
// 5) drible: bola apoiada no capô com o carro em movimento; 6) flick: pulo + flip frontal lança a bola
c=mk(-20);c.vx=10;r=room(c,{x:-19.2,y:c.y+.7+1.5+.03,vx:10});run(r,90,(i,c)=>I({t:c.vx<10?1:0}));
const d=Math.hypot(r.ball.x-c.x,r.ball.z-c.z);ok(d<3.3&&r.ball.y>c.y+1.2,'drible: após 1,5 s a bola segue sobre o capô (dist '+d.toFixed(1)+' m, vel carro '+c.vx.toFixed(1)+')');
const bv=()=>Math.hypot(r.ball.vx,r.ball.vy,r.ball.vz);let pk=0;run(r,50,(i,c)=>{pk=Math.max(pk,bv());return I({t:i>=6?1:(c.vx<10?1:0),j:i===0||i===6?1:0})});
ok(pk>20,'flick: pulo + flip frontal lançou a bola a '+pk.toFixed(1)+' m/s (vx '+r.ball.vx.toFixed(1)+', vy '+r.ball.vy.toFixed(1)+')');

// ================= novos testes: direção, drift, bola, colisões, arenas, 4v4 =================
const C=P.PHYS,{spawn}=require('./physics'),yawOf=c=>c.yaw,lat=c=>-c.vx*Math.sin(c.yaw)+c.vz*Math.cos(c.yaw),far={x:500,y:500};
let sp2=[];c=mk();r=room(c,far,4);run(r,180,i=>{if(i%60===59)sp2.push(c.vx);return I({t:1})});
ok(sp2[0]>12&&sp2[0]<sp2[1]&&sp2[2]<=C.vmax+.01,'aceleração: '+sp2.map(v=>v.toFixed(1)).join(' → ')+' m/s em 1s/2s/3s (teto '+C.vmax+')');
c=mk();c.vx=20;r=room(c,far,4);run(r,30,()=>I({t:-1}));const vb=c.vx;run(r,90,()=>I({t:-1}));ok(vb<2&&c.vx<0&&c.vx>=-C.rev-.01,'frenagem: 20 m/s -> '+vb.toFixed(1)+' em .5 s; ré limitada a '+c.vx.toFixed(1));
const turn=v=>{const k=mk();k.vx=v;const q=room(k,far,4);run(q,60,()=>I({s:1,t:v>10?.5:0.1}));return Math.abs(k.yaw)};const lo=turn(6),hi=turn(26);
ok(lo>hi*1.4&&hi>.4,'direção por velocidade: giro em 1 s = '+lo.toFixed(2)+' rad a 6 m/s vs '+hi.toFixed(2)+' rad a 26 m/s');
c=mk();c.vx=20;r=room(c,far,4);let maxLat=0;run(r,24,()=>{maxLat=Math.max(maxLat,Math.abs(lat(c)));return I({s:.6,h:1})});const vslide=Math.hypot(c.vx,c.vz);run(r,60,()=>I({}));
ok(maxLat>3&&Math.abs(lat(c))<1&&Math.hypot(c.vx,c.vz)>5,'powerslide: lateral até '+maxLat.toFixed(1)+' m/s, recupera aderência ('+Math.abs(lat(c)).toFixed(2)+' m/s) e mantém '+Math.hypot(c.vx,c.vz).toFixed(1)+' m/s');
c=mk(-30);r=room(c,far,4);run(r,120,()=>I({t:1,b:1}));const vbo=c.vx;run(r,10,()=>I({t:1}));ok(vbo>40&&c.vx>vbo-6,'boost: '+vbo.toFixed(1)+' m/s; ao acabar mantém '+c.vx.toFixed(1)+' (sem zerar)');
// bola
let bb={x:0,y:12,z:0,vx:0,vy:0,vz:0};c=mk();c.x=-30;r=room(c,bb,4);let peak=0,seen=false;for(let i=0;i<360;i++){step(r,DT);if(r.ball.vy>0)seen=true;if(seen)peak=Math.max(peak,r.ball.y)}
ok(peak>4&&peak<9&&Math.abs(r.ball.y-1.5)<.05,'bola: quique até '+peak.toFixed(1)+' m (de 12) e repousa em y='+r.ball.y.toFixed(2));
c=mk(-60);r=room(c,{x:-30,y:1.5,vx:15},4);run(r,180,()=>I({}));const bl=r.ball;ok(bl.vx>2&&bl.vx<15&&Math.abs(bl.vx+bl.wz*C.BR)<1.5,'rolamento: 15 -> '+bl.vx.toFixed(1)+' m/s em 3 s, spin coerente com rolar (escorregamento '+Math.abs(bl.vx+bl.wz*C.BR).toFixed(2)+')');
c=mk(-60);r=room(c,{x:55,y:1.5,z:20,vx:25},3);let vb1=0;run(r,30,()=>{if(!vb1&&r.ball.vx<0)vb1=r.ball.vx;return I({})});ok(vb1<-10&&vb1>-25,'bola x parede: 25 m/s -> '+vb1.toFixed(1)+' m/s logo após bater (restituição ~.7)');
c=mk(-4);c.z=-1.9;c.vx=15;r=room(c,{x:0,y:1.5,z:0},4);run(r,40,()=>I({}));ok(Math.hypot(r.ball.wx,r.ball.wy,r.ball.wz)>.4&&r.ball.vx>0,'contato lateral rasante gera spin na bola: |ω|='+Math.hypot(r.ball.wx,r.ball.wy,r.ball.wz).toFixed(2)+' rad/s');
// colisões
{const a=mk(-8),b=mk(8);a.id=1;b.id=2;a.vx=20;b.vx=-20;b.yaw=Math.PI;P.setYaw(b,Math.PI);const q={size:4,A:P.arena(4),players:[a,b],ball:{x:300,y:300,z:0,vx:0,vy:0,vz:0,wx:0,wy:0,wz:0},pads:[0,0,0,0,0,0],diff:'normal',state:'play'};
 let mx=0;for(let i=0;i<120;i++){a.last=b.last=I({});step(q,DT);mx=Math.max(mx,Math.hypot(a.vx,a.vz),Math.hypot(b.vx,b.vz))}const d=Math.hypot(a.x-b.x,a.z-b.z);
 ok(d>=3.4&&mx<=C.vmax+1&&Number.isFinite(d),'carro x carro frontal: separados ('+d.toFixed(2)+' m), sem explosão de velocidade (máx '+mx.toFixed(1)+')')}
c=mk(-8);r=room(c,{x:2,y:1.5,vx:-55},4);let passed=false;for(let i=0;i<40;i++){c.last=I({});step(r,DT);if(r.ball.x<c.x-1)passed=true}ok(!passed&&r.ball.vx>0,'alta velocidade: bola a 55 m/s NÃO atravessa o carro (vx final '+r.ball.vx.toFixed(1)+')');
c=mk(-30);c.vx=46;r=room(c,{x:-18,y:1.5},4);passed=false;for(let i=0;i<30;i++){c.last=I({t:1,b:1});step(r,DT);if(r.ball.x<c.x-1)passed=true}ok(!passed,'alta velocidade: carro a 46 m/s NÃO atravessa a bola parada');
c=mk();r=room(c,far,4);c.x=NaN;step(r,DT);ok(Number.isFinite(c.x)&&Number.isFinite(r.ball.x)&&r.resets>=1,'proteção NaN: carro corrompido foi reposicionado');
// arenas, gols e 4v4 só com bots
for(const n of [1,2,3,4]){const A=P.arena(n),bots=[];let id=1;for(const tm of [0,1])for(let i=0;i<n;i++)bots.push({id:id++,name:'B',team:tm,bot:true,off:false,cfg:{},input:{}});
  const q={size:n,A,players:bots,diff:'expert',state:'play'};spawn(q);const inside=bots.every(b=>Math.abs(b.x)<A.AX&&Math.abs(b.z)<A.AZ);
  const g=(()=>{const t={size:n,A,players:[bots[0]],ball:{x:A.AX+C.BR+.2,y:1.5,z:0,vx:0,vy:0,vz:0,wx:0,wy:0,wz:0},pads:A.pads.map(()=>0)};return step(t,DT)})();
  let goals=0,bad=0,oob=0,mxs=0;const t0=process.hrtime.bigint();
  for(let i=0;i<1800;i++){const gl=step(q,DT);if(gl>=0){goals++;spawn(q)}
    for(const o of [...bots,q.ball]){if(!Number.isFinite(o.x+o.y+o.z+o.vx+o.vy+o.vz))bad++;if(Math.abs(o.x)>A.AX+A.GD+.1||Math.abs(o.z)>A.AZ+.1||o.y>A.H+.1||o.y<.5)oob++}for(const b of bots)mxs=Math.max(mxs,Math.hypot(b.vx,b.vy,b.vz))}
  const ms=Number(process.hrtime.bigint()-t0)/1e6/1800;
  ok(inside&&g===0&&bad===0&&oob===0&&q.resets===undefined&&ms<8,n+'v'+n+' (arena '+(2*A.AX)+'x'+(2*A.AZ)+', gol '+(2*A.GW)+' m): 30 s com '+2*n+' bots expert, '+goals+' gols, 0 NaN, 0 fora dos limites, gol detectado, '+ms.toFixed(2)+' ms/tick, vel. máx '+mxs.toFixed(0))}
