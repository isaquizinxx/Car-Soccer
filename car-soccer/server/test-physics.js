// Testes de física SEM rede: aerial, flip, drible e flick usando exatamente o código do servidor
const P=require('../shared/physics'),{step}=require('./physics'),DT=P.DT,ok=(c,t)=>{console.log((c?'OK   ':'FALHA ')+t);if(!c)process.exitCode=1};
const mk=x=>{const c={id:1,team:0,bot:false,off:false,q:[],x:x||-10,y:.8,z:0,vx:0,vy:0,vz:0,yaw:0,boost:100,jp:false,jc:0,fl:0,wx:0,wy:0,wz:0,fdt:0,fds:0,ack:0,last:null};P.setYaw(c,0);return c};
const room=(c,b)=>({players:[c],ball:Object.assign({x:30,y:1.5,z:0,vx:0,vy:0,vz:0},b),pads:[0,0,0,0,0,0],diff:'normal',state:'play'});
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
