// Simulação autoritativa: carros (shared/physics), bola, colisões, boost pads e gols.
const P=require('../shared/physics'),bot=require('./bot'),{AX,GW,GH,BR,CR,G,PADS,Z,bound,stepCar}=P;
function spawn(r){
  r.ball={x:0,y:BR,z:0,vx:0,vy:0,vz:0};r.pads=PADS.map(()=>0);
  for(const tm of [0,1]){const l=r.players.filter(p=>p.team===tm);
    l.forEach((c,i)=>{Object.assign(c,{x:(tm?1:-1)*(AX-12),y:.8,z:(i-(l.length-1)/2)*10,vx:0,vy:0,vz:0,yaw:tm?Math.PI:0,boost:50,jp:false,jc:0,fl:0,wx:0,wy:0,wz:0,fdt:0,fds:0,q:[],last:null,ack:0});P.setYaw(c,c.yaw)})}
}
const nxt=c=>{if(c.q&&c.q.length){c.last=c.q.shift();c.ack=c.last.q}return c.last||Z};
// Esfera (bola) x caixa orientada (carro): a velocidade da superfície inclui a rotação do carro, então flips/flicks vêm da física.
const HX=2,HZ=1,Y0=-.4,Y1=.7,inv={};
function carBall(c,b,r){
  inv.qw=c.qw;inv.qx=-c.qx;inv.qy=-c.qy;inv.qz=-c.qz;const l=P.rot(inv,b.x-c.x,b.y-c.y,b.z-c.z),
    cx=Math.max(-HX,Math.min(HX,l[0])),cy=Math.max(Y0,Math.min(Y1,l[1])),cz=Math.max(-HZ,Math.min(HZ,l[2])),dx=l[0]-cx,dy=l[1]-cy,dz=l[2]-cz,d=Math.hypot(dx,dy,dz);
  if(d>=BR||d<1e-4)return;
  const n=P.rot(c,dx/d,dy/d,dz/d),p=P.rot(c,cx,cy,cz),w=P.rot(c,c.wx||0,c.wy||0,c.wz||0),pen=BR-d;b.x+=n[0]*pen;b.y+=n[1]*pen;b.z+=n[2]*pen;
  const sx=c.vx+w[1]*p[2]-w[2]*p[1],sy=c.vy+w[2]*p[0]-w[0]*p[2],sz=c.vz+w[0]*p[1]-w[1]*p[0],rel=(b.vx-sx)*n[0]+(b.vy-sy)*n[1]+(b.vz-sz)*n[2];
  if(rel<0){const j=-(1+(rel>-3?0:.8))*rel;b.vx+=n[0]*j;b.vy+=n[1]*j;b.vz+=n[2]*j; // apoio no capô sem quicar; impacto forte quica
    const tx=b.vx-sx-n[0]*(rel+j),ty=b.vy-sy-n[1]*(rel+j),tz=b.vz-sz-n[2]*(rel+j);b.vx-=tx*.03;b.vy-=ty*.03;b.vz-=tz*.03} // atrito leve: permite conduzir
  r.lastTouch=c.id;
}
function step(r,dt){
  const b=r.ball,Ps=r.players;
  for(const c of Ps)stepCar(c,c.off?Z:c.bot?bot(r,c):nxt(c),dt);
  PADS.forEach((p,k)=>{if(r.pads[k]>0)r.pads[k]-=dt;else for(const c of Ps)if(c.y<2&&Math.abs(c.x-p[0])<2.5&&Math.abs(c.z-p[1])<2.5){c.boost=Math.min(100,c.boost+50);r.pads[k]=6;break}});
  b.vy+=G*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;b.z+=b.vz*dt;bound(b,BR,.7);
  const f=1-(b.y<=BR+.01?.5:.05)*dt;b.vx*=f;b.vz*=f;
  const sp=Math.hypot(b.vx,b.vy,b.vz);if(sp>55){const k=55/sp;b.vx*=k;b.vy*=k;b.vz*=k}
  for(const c of Ps)carBall(c,b,r);
  for(let a=0;a<Ps.length;a++)for(let q=a+1;q<Ps.length;q++){
    const A=Ps[a],B=Ps[q],dx=B.x-A.x,dy=B.y-A.y,dz=B.z-A.z,d=Math.hypot(dx,dy,dz);
    if(d<2*CR&&d>1e-3){const nx=dx/d,ny=dy/d,nz=dz/d,p=(2*CR-d)/2;
      A.x-=nx*p;A.y-=ny*p;A.z-=nz*p;B.x+=nx*p;B.y+=ny*p;B.z+=nz*p;
      const rel=(B.vx-A.vx)*nx+(B.vy-A.vy)*ny+(B.vz-A.vz)*nz;
      if(rel<0){const j=-rel*.8;A.vx-=nx*j;A.vy-=ny*j;A.vz-=nz*j;B.vx+=nx*j;B.vy+=ny*j;B.vz+=nz*j}}
  }
  return Math.abs(b.x)>AX+BR&&Math.abs(b.z)<GW&&b.y<GH?(b.x>0?0:1):-1;
}
module.exports={step,spawn};
