// Simulação autoritativa: carros (shared/physics), bola com spin e rolamento, hitbox orientada, subpassos anti-atravessamento, pads e gols.
const P=require('../shared/physics'),bot=require('./bot'),{PHYS:C,Z,bound,stepCar}=P,BR=C.BR;
function spawn(r){
  const A=r.A||(r.A=P.arena(r.size||2));r.ball={x:0,y:BR,z:0,vx:0,vy:0,vz:0,wx:0,wy:0,wz:0};r.pads=A.pads.map(()=>0);
  for(const tm of [0,1]){const l=r.players.filter(p=>p.team===tm);
    l.forEach((c,i)=>{Object.assign(c,{x:(tm?1:-1)*(A.AX-12*A.k),y:.8,z:(i-(l.length-1)/2)*10,vx:0,vy:0,vz:0,yaw:tm?Math.PI:0,boost:50,jp:false,jc:0,fl:0,wx:0,wy:0,wz:0,fdt:0,fds:0,q:[],last:null,ack:0});P.setYaw(c,c.yaw)})}
}
const nxt=c=>{if(c.q&&c.q.length){c.last=c.q.shift();c.ack=c.last.q}return c.last||Z};
const HX=2,HZ=1,Y0=-.4,Y1=.7,inv={};
// Esfera (bola) x caixa orientada (carro). Velocidade da superfície inclui a rotação do carro; o atrito tangencial gera spin real na bola.
function carBall(c,b,r){
  inv.qw=c.qw;inv.qx=-c.qx;inv.qy=-c.qy;inv.qz=-c.qz;const l=P.rot(inv,b.x-c.x,b.y-c.y,b.z-c.z),
    cx=Math.max(-HX,Math.min(HX,l[0])),cy=Math.max(Y0,Math.min(Y1,l[1])),cz=Math.max(-HZ,Math.min(HZ,l[2])),dx=l[0]-cx,dy=l[1]-cy,dz=l[2]-cz,d=Math.hypot(dx,dy,dz);
  if(d>=BR||d<1e-4)return;
  const n=P.rot(c,dx/d,dy/d,dz/d),p=P.rot(c,cx,cy,cz),w=P.rot(c,c.wx||0,c.wy||0,c.wz||0),pen=BR-d;b.x+=n[0]*pen;b.y+=n[1]*pen;b.z+=n[2]*pen;
  const sx=c.vx+w[1]*p[2]-w[2]*p[1],sy=c.vy+w[2]*p[0]-w[0]*p[2],sz=c.vz+w[0]*p[1]-w[1]*p[0],rel=(b.vx-sx)*n[0]+(b.vy-sy)*n[1]+(b.vz-sz)*n[2];
  if(rel<0){const j=-(1+(rel>-C.hitRest?0:C.hitE))*rel;b.vx+=n[0]*j;b.vy+=n[1]*j;b.vz+=n[2]*j; // apoio no capô sem quicar; impacto forte quica
    const tx=b.vx-sx-n[0]*(rel+j),ty=b.vy-sy-n[1]*(rel+j),tz=b.vz-sz-n[2]*(rel+j),k=C.hitFric;b.vx-=tx*k;b.vy-=ty*k;b.vz-=tz*k;
    const s=k*2.5/BR;b.wx+=(n[1]*tz-n[2]*ty)*s;b.wy+=(n[2]*tx-n[0]*tz)*s;b.wz+=(n[0]*ty-n[1]*tx)*s} // Δω = (r × Δv)·5/(2R²), r=-n·R
  r.lastTouch=c.id;
}
// Integra a bola: gravidade, Magnus leve, rolamento (acopla v e ω no contato com o chão), arrasto, paredes.
function ballStep(b,A,dt){
  b.vy+=C.G*dt;const m=C.magnus*dt;b.vx+=m*(b.wy*b.vz-b.wz*b.vy);b.vy+=m*(b.wz*b.vx-b.wx*b.vz);b.vz+=m*(b.wx*b.vy-b.wy*b.vx);
  b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;bound(b,BR,C.ballE,A);
  if(b.y<=BR+.01){const k=(1-Math.exp(-C.rollSlip*dt))*.4,sx=b.vx+b.wz*BR,sz=b.vz-b.wx*BR,f=1-C.rollRes*dt;
    b.vx-=sx*k;b.vz-=sz*k;b.wx+=2.5/BR*k*sz;b.wz-=2.5/BR*k*sx;b.vx*=f;b.vz*=f;b.wx*=f;b.wz*=f}
  else{const f=1-C.ballDrag*dt;b.vx*=f;b.vy*=f;b.vz*=f}
  const sp=Math.hypot(b.vx,b.vy,b.vz);if(sp>C.ballMax){const k=C.ballMax/sp;b.vx*=k;b.vy*=k;b.vz*=k}
}
const bad=o=>!Number.isFinite(o.x+o.y+o.z+o.vx+o.vy+o.vz);
function step(r,dt){
  const A=r.A||(r.A=P.arena(r.size||2)),b=r.ball,Ps=r.players;if(b.wx===undefined)b.wx=b.wy=b.wz=0;
  for(const c of Ps){c.px=c.x;c.py=c.y;c.pz=c.z;stepCar(c,c.off?Z:c.bot?bot(r,c):nxt(c),dt,A);c.cx=c.x;c.cy=c.y;c.cz=c.z}
  A.pads.forEach((p,k)=>{if(r.pads[k]>0)r.pads[k]-=dt;else for(const c of Ps)if(c.y<2&&Math.abs(c.x-p[0])<2.5&&Math.abs(c.z-p[1])<2.5){c.boost=Math.min(100,c.boost+50);r.pads[k]=6;break}});
  const SUB=Math.hypot(b.vx,b.vy,b.vz)>30||Ps.some(c=>Math.hypot(c.vx,c.vy,c.vz)>30)?2:1; // subpassos só quando algo está rápido (evita tunneling sem custo fixo)
  for(let s=1;s<=SUB;s++){const f=s/SUB;for(const c of Ps){c.x=c.px+(c.cx-c.px)*f;c.y=c.py+(c.cy-c.py)*f;c.z=c.pz+(c.cz-c.pz)*f}
    ballStep(b,A,dt/SUB);for(const c of Ps)carBall(c,b,r)}
  for(const c of Ps){c.x=c.cx;c.y=c.cy;c.z=c.cz}
  for(let a=0;a<Ps.length;a++)for(let q=a+1;q<Ps.length;q++){ // carro x carro: separa metade para cada e troca impulso só se estiverem se aproximando
    const X=Ps[a],Y=Ps[q],dx=Y.x-X.x,dy=Y.y-X.y,dz=Y.z-X.z,d=Math.hypot(dx,dy,dz),R=2*C.CR;
    if(d<R&&d>1e-3){const nx=dx/d,ny=dy/d,nz=dz/d,p=(R-d)/2;
      X.x-=nx*p;X.y-=ny*p;X.z-=nz*p;Y.x+=nx*p;Y.y+=ny*p;Y.z+=nz*p;
      const rel=(Y.vx-X.vx)*nx+(Y.vy-X.vy)*ny+(Y.vz-X.vz)*nz;
      if(rel<0){const j=-(1+C.carE)*rel/2;X.vx-=nx*j;X.vy-=ny*j;X.vz-=nz*j;Y.vx+=nx*j;Y.vy+=ny*j;Y.vz+=nz*j}}
  }
  for(const c of Ps)if(bad(c)){r.resets=(r.resets||0)+1;Object.assign(c,{x:(c.team?1:-1)*(A.AX-12*A.k),y:.8,z:0,vx:0,vy:0,vz:0,fl:0,wx:0,wy:0,wz:0});P.setYaw(c,c.team?Math.PI:0);c.yaw=c.team?Math.PI:0} // proteção contra NaN/Infinity
  if(bad(b)||!Number.isFinite(b.wx+b.wy+b.wz)){r.resets=(r.resets||0)+1;Object.assign(b,{x:0,y:BR,z:0,vx:0,vy:0,vz:0,wx:0,wy:0,wz:0})}
  return Math.abs(b.x)>A.AX+BR&&Math.abs(b.z)<A.GW&&b.y<A.GH?(b.x>0?0:1):-1;
}
module.exports={step,spawn,carBall,ballStep};
