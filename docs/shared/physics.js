// Física de carro compartilhada (servidor autoritativo + predição do cliente). TODOS os parâmetros ficam em PHYS e arena().
(function(g){
const PHYS={G:-22,DT:1/60,BR:1.5,CR:1.8,
 acc:30,accFall:.6,vmax:26,vboost:46,brake:55,coast:6,rev:14,          // aceleração cai com a velocidade; frenagem; ré
 steerLow:3.1,steerHigh:1.4,grip:14,slide:1.4,slideSteer:1.3,slideDrag:.25,overDecel:25, // direção por velocidade; aderência x powerslide
 jump:10,jump2:9,dodge:14,flipTime:.65,pitch:5,yaw:3.2,roll:5.5,           // salto, segundo salto, flip e controle aéreo
 boostAcc:42,boostAir:38,boostUse:33,boostRegen:3,airMax:50,               // boost
 ballE:.7,ballDrag:.05,rollSlip:6,rollRes:.35,magnus:.004,ballMax:55,      // bola: quique, arrasto, rolamento, spin
 hitE:.8,hitRest:3,hitFric:.03,carE:.5};                                    // colisões carro x bola / carro x carro
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),Z={t:0,s:0,j:0,b:0,h:0,r:0};
// arenas por modo (n = jogadores por time): física, gols, paredes, pads e spawns usam as MESMAS dimensões no cliente e no servidor
function arena(n){n=Math.max(1,Math.min(4,n|0||2));const k=[0,1,1.25,1.5,1.75][n],AX=40*k,AZ=26*k,
 pf=[[0,-.92],[0,.92],[-.6,-.5],[-.6,.5],[.6,-.5],[.6,.5]].concat(n>=3?[[-.3,-.75],[-.3,.75],[.3,-.75],[.3,.75]]:[]);
 return{n,k,AX,AZ,GW:7+(k-1)*4,GH:7+(k-1)*2,GD:6,H:22+(k-1)*6,pads:pf.map(p=>[p[0]*AX,p[1]*AZ])}}
const DEF=arena(2);
function bound(o,m,e,A){A=A||DEF;const {AX,AZ,GW,GH,GD,H}=A,
  ing=Math.abs(o.x)>AX,xl=(Math.abs(o.z)<GW-m&&o.y<GH-m)||ing?AX+GD-m:AX-m,zl=ing?GW-m:AZ-m,yl=ing?GH-m:H-m;
  if(Math.abs(o.x)>xl){o.x=Math.sign(o.x)*xl;o.vx*=-e}
  if(Math.abs(o.z)>zl){o.z=Math.sign(o.z)*zl;o.vz*=-e}
  if(o.y<m){o.y=m;o.vy=Math.abs(o.vy)>3?-o.vy*e:0}
  if(o.y>yl){o.y=yl;o.vy=-Math.abs(o.vy)*e}
}
// Orientação 3D por quaternion (qw,qx,qy,qz). Eixos do carro: +x frente, +y teto, +z direita.
function rot(c,x,y,z){const tx=2*(c.qy*z-c.qz*y),ty=2*(c.qz*x-c.qx*z),tz=2*(c.qx*y-c.qy*x);return[x+c.qw*tx+(c.qy*tz-c.qz*ty),y+c.qw*ty+(c.qz*tx-c.qx*tz),z+c.qw*tz+(c.qx*ty-c.qy*tx)]}
function setYaw(c,y){c.qw=Math.cos(y/2);c.qx=0;c.qy=-Math.sin(y/2);c.qz=0}
function spin(c,wx,wy,wz,dt){const n=Math.hypot(wx,wy,wz);if(n<1e-6)return;const h=n*dt/2,k=Math.sin(h)/n,dw=Math.cos(h),dx=wx*k,dy=wy*k,dz=wz*k,w=c.qw,x=c.qx,y=c.qy,z=c.qz;
  c.qw=w*dw-x*dx-y*dy-z*dz;c.qx=w*dx+x*dw+y*dz-z*dy;c.qy=w*dy-x*dz+y*dw+z*dx;c.qz=w*dz+x*dy-y*dx+z*dw;const m=Math.hypot(c.qw,c.qx,c.qy,c.qz);c.qw/=m;c.qx/=m;c.qy/=m;c.qz/=m}
// i = {t,s,j,b,h,r}: aceleração/pitch, direção/yaw, pulo, boost, freio de mão/powerslide, air roll
function stepCar(c,i,dt,A){
  const P=PHYS,gr=c.y<=.81,bo=!!i.b&&c.boost>0,f=rot(c,1,0,0);
  c.boost=bo?Math.max(0,c.boost-P.boostUse*dt):Math.min(100,c.boost+P.boostRegen*dt);
  if(gr){
    if(Math.hypot(f[0],f[2])>.3)c.yaw=Math.atan2(f[2],f[0]); // pousou: endireita o carro mantendo o rumo e a velocidade
    c.fl=0;c.wx=c.wy=c.wz=0;c.jc=0;
    const top=bo?P.vboost:P.vmax,it=i.t||0,is=i.s||0,fx=Math.cos(c.yaw),fz=Math.sin(c.yaw),fv0=c.vx*fx+c.vz*fz;
    const rate=Math.max(.9,P.steerLow+(P.steerHigh-P.steerLow)*Math.min(1.6,Math.abs(fv0)/P.vmax)); // curva fecha em baixa velocidade, exige controle em alta
    c.yaw+=is*rate*(i.h?P.slideSteer:1)*clamp(fv0/6,-1,1)*dt;
    const nx=Math.cos(c.yaw),nz=Math.sin(c.yaw);let fv=c.vx*nx+c.vz*nz,lv=-c.vx*nz+c.vz*nx; // a velocidade mundial NÃO gira com o carro: o que sobra de lado é derrapagem
    if(it){if(it*fv<0)fv+=it*P.brake*dt;else fv+=it*P.acc*Math.max(.12,1-Math.abs(fv)/top*P.accFall)*dt}else if(!bo){const d=P.coast*dt;fv=Math.abs(fv)<=d?0:fv-Math.sign(fv)*d} // solta o acelerador: desaceleração constante
    if(bo)fv+=P.boostAcc*dt;if(i.h)fv*=1-P.slideDrag*dt;
    fv=Math.max(-P.rev,Math.min(P.vboost,fv));if(fv>top)fv=Math.max(top,fv-P.overDecel*dt); // fim do boost: desacelera suave, sem cortar a velocidade
    lv*=Math.exp(-(i.h?P.slide:P.grip)*dt); // aderência normal x powerslide (solta a traseira e recupera ao soltar o freio)
    c.vx=nx*fv-nz*lv;c.vz=nz*fv+nx*lv;setYaw(c,c.yaw);
    if(i.j&&!c.jp){c.vy=P.jump;c.jc=1}
  }else{
    c.vy+=P.G*dt;
    if(i.j&&!c.jp&&c.jc<2){c.jc=2; // segundo pulo, ou flip direcional se houver input
      if(i.t||i.s){const d=Math.hypot(i.t,i.s),rr=rot(c,0,0,1),hl=Math.hypot(f[0],f[2])||1,rl=Math.hypot(rr[0],rr[2])||1;
        c.vx+=(f[0]/hl*i.t+rr[0]/rl*i.s)/d*P.dodge;c.vz+=(f[2]/hl*i.t+rr[2]/rl*i.s)/d*P.dodge;c.vy=Math.max(c.vy,4);c.fl=P.flipTime;c.fdt=i.t/d;c.fds=i.s/d}else c.vy=P.jump2}
    let wx=0,wy=0,wz=0;const fr=6.2832/P.flipTime;
    if(c.fl>0){c.fl-=dt;wz=-c.fdt*fr;wx=c.fds*fr}else{c.fl=0;wz=(i.t||0)*P.pitch;wy=-(i.s||0)*P.yaw;wx=(i.r||0)*P.roll}
    if(bo){c.vx+=f[0]*P.boostAir*dt;c.vy+=f[1]*P.boostAir*dt;c.vz+=f[2]*P.boostAir*dt}
    c.wx=wx;c.wy=wy;c.wz=wz;spin(c,wx,wy,wz,dt);
    const f2=rot(c,1,0,0);if(Math.hypot(f2[0],f2[2])>.3)c.yaw=Math.atan2(f2[2],f2[0]);
  }
  const hs=Math.hypot(c.vx,c.vz);if(hs>P.airMax&&!gr){c.vx*=P.airMax/hs;c.vz*=P.airMax/hs}else if(hs>P.vboost+.5){c.vx*=(P.vboost+.5)/hs;c.vz*=(P.vboost+.5)/hs}
  c.jp=!!i.j;c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;bound(c,.8,0,A);
}
const api={PHYS,arena,rot,setYaw,clamp,wrap,bound,stepCar,Z,DT:PHYS.DT,BR:PHYS.BR,CR:PHYS.CR,G:PHYS.G};
if(typeof module!=='undefined')module.exports=api;else g.Phys=api;
})(this);
