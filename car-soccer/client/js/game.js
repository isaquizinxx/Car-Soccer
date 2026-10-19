// Jogo: predição local do carro (física compartilhada) + reconciliação com o servidor, interpolação/extrapolação dos demais, efeitos, loop de render
const GAME=(()=>{
 const DT=Phys.DT,keys={},bpos=new T.Vector3(0,1.5,0),ax=new T.Vector3(),tq=new T.Quaternion();
 let rm=null,me=0,st='lobby',prevSt='',ents={},L=null,hist=[],seq=0,acc=0,off={x:0,y:0,z:0},ball={x:0,y:1.5,z:0,vx:0,vy:0,vz:0,t:0},lastIn={b:0},pv=null,gAng=0,gDist=9,drag=false,last=performance.now(),
  gUntil=0,goUntil=0,gText='',lastCd=-1,pads='',fxOK=false,mineR=null;
 const hexOf=c=>parseInt(c.slice(1),16),mine=()=>rm?rm.players.find(p=>p.id===me)||{}:{};
 function preview(){if(pv)CAR.dispose(pv);pv=CAR.make(CFG,0);pv.g.position.set(0,.8,0)}
 function syncCars(){
  for(const id in ents)if(!rm.players.find(p=>p.id==id)){A.stop(id);CAR.dispose(ents[id].o);delete ents[id]}
  for(const p of rm.players)if(!ents[p.id])ents[p.id]={o:CAR.make(p.cfg,p.team),cfg:p.cfg,team:p.team,s:null,r:null,bst:0,rq:new T.Quaternion()}}
 function setRoom(m){rm=m;syncCars();UI.disc(m.players.filter(p=>p.off).map(p=>p.name+' desconectou').join(' · '));
  if(m.state==='lobby'){L=null;hist=[];for(const id in ents)ents[id].s=ents[id].r=null;UI.go('lobby');UI.lobby(m,me)}else if(m.state!=='end'&&vw!=='hud')UI.go('hud')}
 function impact(x,y,z,p,hex,d,car){FX.burst(x,y,z,6+30*p,4+12*p,.5,.9,hex,-14,2);if(car)FX.burst(x,y,z,4,3,.25,2.2,0xffffff,0);CAMX.shake=Math.max(CAMX.shake,p*.7/(1+d/18));car?A.hit(p,d):A.wall(p,d)}
 function ballFx(p,n){if(!fxOK)return;const dv=Math.hypot(n.vx-p.vx,n.vy-p.vy,n.vz-p.vz);if(dv<8)return;const pw=Math.min(1,dv/35),d=Math.hypot(n.x-cam.position.x,n.z-cam.position.z);
  let car=false;for(const id in ents){const s=ents[id].s;if(s&&Math.hypot(s.x-n.x,s.y-n.y,s.z-n.z)<4.4)car=true}impact(n.x,n.y,n.z,pw,car?0xfff0b0:0x9fd8ff,d,car)}
 function carFx(e,n,isMe){const p=e.s;if(!p)return;const d=Math.hypot(n.x-cam.position.x,n.z-cam.position.z),bh=hexOf(e.cfg.boost);
  if(n.jc>p.jc&&n.jc>0){FX.burst(n.x,n.y-.6,n.z,8,4,.4,.6,0xcccccc,0,1);if(d<40)A.jump()}
  if(n.fl>0&&!(p.fl>0))FX.burst(n.x,n.y,n.z,16,8,.45,.7,bh,0,0);
  const land=p.vy<-6&&n.vy>-1&&n.y<1.2;if(land){FX.burst(n.x,.2,n.z,14,5,.5,.9,0x998877,-2,1);if(d<40)A.land()}
  const dv=Math.hypot(n.vx-p.vx,n.vy-p.vy,n.vz-p.vz);if(fxOK&&dv>9&&!land&&n.jc===p.jc&&(n.fl>0)===(p.fl>0))impact(n.x,n.y,n.z,Math.min(1,dv/30),0xffdd99,d,false)}
 function reconcile(n,ack){const o=L&&{x:L.x,y:L.y,z:L.z};L=n;hist=hist.filter(h=>h.q>ack);if(st==='play'||st==='goal')for(const h of hist)Phys.stepCar(L,h,DT);
  if(o){off.x+=o.x-L.x;off.y+=o.y-L.y;off.z+=o.z-L.z;if(Math.hypot(off.x,off.y,off.z)>5)off.x=off.y=off.z=0}}
 function snap(m){const now=performance.now();st=m.st;
  if(m.st!==prevSt){if(prevSt==='cd'&&m.st==='play')goUntil=now+900;if(m.st==='cd'){hist=[];off.x=off.y=off.z=0}fxOK=false;prevSt=m.st}else fxOK=m.st==='play'||m.st==='goal';
  const nb={x:m.b[0],y:m.b[1],z:m.b[2],vx:m.b[3],vy:m.b[4],vz:m.b[5],t:now};ballFx(ball,nb);ball=nb;pads=m.pd;
  for(const c of m.c){const e=ents[c[0]];if(!e)continue;const n={x:c[1],y:c[2],z:c[3],yaw:c[4],boost:c[5],off:c[6],vx:c[7],vy:c[8],vz:c[9],jc:c[10],fdt:c[11],fl:c[12],jp:!!c[14],qw:c[15],qx:c[16],qy:c[17],qz:c[18],fds:c[19],wx:0,wy:0,wz:0,t:now};
   carFx(e,n,c[0]===me);if(e.s&&n.boost<e.s.boost-.2)e.bst=now+220;if(c[0]===me)reconcile(Object.assign({},n),c[13]);e.s=n;if(!e.r){e.r=Object.assign({},n);e.rq.set(n.qx,n.qy,n.qz,n.qw)}}
  UI.score(m);SC.board(m.sc,m.time>0?Math.floor(m.time/60)+':'+String(m.time%60).padStart(2,'0'):'OT');
  if(m.st==='cd'&&m.cd!==lastCd){lastCd=m.cd;A.count(m.cd)}if(m.st!=='cd')lastCd=-1;
  UI.banner(m.st==='cd'?(m.cd>0?m.cd:'GO!'):now<gUntil?gText:now<goUntil?'GO!':'')}
 function goal(m){const now=performance.now(),c=m.team?0xff8a1f:0x2d8cff;gUntil=now+3200;gText='GOOOOOOOL!<br><small style="font-size:.4em;color:'+(m.team?'#ff9d45':'#4da3ff')+'">'+(m.by||'')+'</small>';
  const sp=rm&&rm.players.find(p=>p.name===m.by),gx=sp?sp.cfg.gfx:0; // efeito de gol escolhido pelo marcador
  if(gx===1){for(let i=0;i<160*QS().pf;i++){const a=i*.2,s=26+Math.random()*6;FX.emit(ball.x,.5,ball.z,Math.cos(a)*s,.5,Math.sin(a)*s,1.2,1.4,c,0)}FX.burst(ball.x,ball.y,ball.z,60,20,.8,1.2,0xffffff,-4,4)}
  else if(gx===2)FX.burst(ball.x,ball.y,ball.z,200,16,2.4,2.2,0xfff0b0,-3,9);
  else{FX.burst(ball.x,ball.y,ball.z,320,30,1.6,1.6,c,-6,6);FX.burst(ball.x,ball.y,ball.z,120,45,1.1,1.2,0xffffff,-4,4)}CAMX.shake=1.6;CAMX.a=Math.random()*6;SC.cheer(1.6);SC.gl[m.team?0:1].intensity=7;
  const f=$('flash');f.style.transition='none';f.style.opacity=.75;requestAnimationFrame(()=>{f.style.transition='opacity .9s';f.style.opacity=0});A.goal();A.crowd(1);setTimeout(()=>A.crowd(0),3500)}
 function end(m){const w=m.winner===mine().team;UI.end(w,m.sc);w?A.win():A.lose();const c=w?0xffd23f:0x556080;for(let i=0;i<6;i++)setTimeout(()=>FX.burst((Math.random()-.5)*30,8,(Math.random()-.5)*20,80,18,1.4,1.2,c,-6,6),i*250)}
 const readInput=()=>UI.paused()||vw!=='hud'?{t:0,s:0,j:0,b:0,h:0}:{t:(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0),s:(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),j:keys.Space?1:0,b:keys.ShiftLeft||keys.ShiftRight?1:0,h:keys.KeyF?1:0,r:(keys.KeyE?1:0)-(keys.KeyQ?1:0)};
 function tick(){if(!L||(st!=='play'&&st!=='goal'))return;const k=readInput(),i={q:++seq,t:k.t,s:k.s,j:k.j,b:k.b,h:k.h,r:k.r||0};lastIn=i;hist.push(i);if(hist.length>150)hist.shift();Phys.stepCar(L,i,DT);NET.send({type:'input',...i})}
 function frame(now){requestAnimationFrame(frame);const dt=Math.min(.05,(now-last)/1000);last=now;const hud=vw==='hud';
  acc+=dt;for(let n=0;acc>=DT&&n<5;n++){acc-=DT;tick()}if(acc>DT)acc=0;
  const age=Math.min(.12,(now-ball.t)/1000),k=1-Math.exp(-dt*20);ax.set(ball.x+ball.vx*age,Math.max(Phys.BR,ball.y+ball.vy*age),ball.z+ball.vz*age);bpos.lerp(ax,k);SC.ball.position.copy(bpos);
  const sp=Math.hypot(ball.vx,ball.vz);if(sp>.5){ax.set(ball.vz,0,-ball.vx).normalize();SC.ball.rotateOnWorldAxis(ax,sp*dt/Phys.BR)}
  const bs=Math.hypot(ball.vx,ball.vy,ball.vz);SC.bglow.material.opacity=Math.min(.8,bs/45);if(hud&&bs>28&&Math.random()<.6)FX.emit(bpos.x,bpos.y,bpos.z,0,0,0,.35,.9,0x66ccff,0);
  let skid=false,boosting=false,mspd=0;mineR=null;const dq=Math.exp(-dt*12);off.x*=dq;off.y*=dq;off.z*=dq;
  for(const id in ents){const e=ents[id],s=e.s;e.o.g.visible=hud&&!!s;if(!hud||!s)continue;const isMe=+id===me&&L;let r;
   if(isMe){r={x:L.x+off.x,y:L.y+off.y,z:L.z+off.z,yaw:L.yaw,vx:L.vx,vy:L.vy,vz:L.vz,qw:L.qw,qx:L.qx,qy:L.qy,qz:L.qz,fl:L.fl,boosting:!!lastIn.b&&L.boost>0&&!UI.paused()};mineR=r;mspd=Math.hypot(L.vx,L.vz);boosting=r.boosting}
   else{const a=Math.min(.12,(now-s.t)/1000),kk=1-Math.exp(-dt*18),q=e.r;q.x+=(s.x+s.vx*a-q.x)*kk;q.y+=(Math.max(.8,s.y+s.vy*a)-q.y)*kk;q.z+=(s.z+s.vz*a-q.z)*kk;q.yaw+=Phys.wrap(s.yaw-q.yaw)*kk;q.vx=s.vx;q.vy=s.vy;q.vz=s.vz;tq.set(s.qx,s.qy,s.qz,s.qw);e.rq.slerp(tq,kk);q.qx=e.rq.x;q.qy=e.rq.y;q.qz=e.rq.z;q.qw=e.rq.w;q.fl=s.fl;q.boosting=now<e.bst;r=q}
   const lv=CAR.anim(e.o,r,dt),F=Phys.rot(r,1,0,0),fx=F[0],fz=F[2],dc=Math.hypot(r.x-cam.position.x,r.z-cam.position.z);
   if(r.boosting){const n=Math.round(3*QS().pf+Math.random()*.6),bh=hexOf(e.cfg.boost),bs2=e.cfg.bstyle,px=r.x-fx*2.4,pz=r.z-fz*2.4;
    for(let i=0;i<n;i++){const j=Math.random()-.5;FX.emit(px,r.y+.1-F[1]*2.4,pz,-fx*(10+Math.random()*6)+r.vx*.3+(bs2===1?-fz*j*6:0),j*2-F[1]*12,-fz*(10+Math.random()*6)+r.vz*.3+(bs2===1?fx*j*6:0),bs2===2?.8:bs2===1?.5:.35,bs2===1?1.4:bs2===2?.6:1,bh,0);
     if(!i&&bs2===0)FX.emit(px,r.y+.1-F[1]*2.4,pz,-fx*8,0,-fz*8,.2,.6,0xffffff,0)}}
   if(Math.abs(lv)>6){if(Math.random()<.7)FX.emit(r.x-fx*1.3,.15,r.z-fz*1.3,(Math.random()-.5)*2,.8,(Math.random()-.5)*2,.6,1.3,0x8a8a8a,0);if(isMe)skid=true}
   A.engine(id,Math.hypot(r.vx,r.vz),dc,r.boosting)}
  if(pv)pv.g.visible=vw!=='hud'&&vw!=='end';
  if(hud&&mineR){if(st==='goal')CAMX.goal(dt,bpos);else CAMX.follow(dt,mineR,bpos,mspd,boosting);UI.hud(L?L.boost:0,mspd,NET.ping(),boosting)}
  else{if(!drag&&vw==='garage')gAng+=dt*.25;const gar=vw==='garage';if(pv)CAR.anim(pv,{x:0,y:.8,z:0,yaw:0,vx:0,vy:0,vz:0,qw:1,qx:0,qy:0,qz:0,fl:0},dt);CAMX.orbit(dt,gar?gAng:now/6000,gar?gDist:10,gar?3:4)}
  SC.pads.forEach((p,i)=>p.material.opacity=pads[i]==='1'?.1:.5+Math.sin(now/300+i)*.2);
  FX.update(dt);SC.update(dt,bpos);A.frame(boosting,skid);R.render(S,cam)}
 addEventListener('keydown',e=>{keys[e.code]=1;if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();if(e.code==='KeyC')CAMX.ball=!CAMX.ball;if(e.code==='Escape'&&vw==='hud')UI.pause()});addEventListener('keyup',e=>keys[e.code]=0);
 addEventListener('blur',()=>{for(const k in keys)keys[k]=0});
 const cv=$('c');cv.addEventListener('mousedown',()=>drag=true);addEventListener('mouseup',()=>drag=false);addEventListener('mousemove',e=>{if(drag&&vw==='garage')gAng-=e.movementX*.01});
 addEventListener('wheel',e=>{if(vw==='garage')gDist=Phys.clamp(gDist+e.deltaY*.01,5,16)});
 function resize(){R.setSize(innerWidth,innerHeight);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();SC.offset(0);UI.go(vw)}addEventListener('resize',resize);
 return{setMe:id=>me=id,room:setRoom,snap,goal,end,preview,mine,frame,resize,reset(){rm=null;L=null;hist=[];for(const id in ents){A.stop(id);CAR.dispose(ents[id].o)}ents={}}}})();
