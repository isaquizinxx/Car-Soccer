// Física de carro compartilhada: o servidor (autoritativo) e o cliente (predição) rodam exatamente este código.
(function(g){
const AX=40,AZ=26,GW=7,GH=7,GD=6,H=22,BR=1.5,CR=1.8,G=-22,DT=1/60,Z={t:0,s:0,j:0,b:0,h:0,r:0},PADS=[[0,-24],[0,24],[-24,-13],[-24,13],[24,-13],[24,13]];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
function bound(o,m,e){
  const ing=Math.abs(o.x)>AX,xl=(Math.abs(o.z)<GW-m&&o.y<GH-m)||ing?AX+GD-m:AX-m,zl=ing?GW-m:AZ-m,yl=ing?GH-m:H-m;
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
// i = {t,s,j,b,h,r}: aceleração/pitch, direção/yaw, pulo, boost, freio de mão, air roll
function stepCar(c,i,dt){
  const gr=c.y<=.81,bo=!!i.b&&c.boost>0,f=rot(c,1,0,0);
  c.boost=bo?Math.max(0,c.boost-33*dt):Math.min(100,c.boost+3*dt);
  if(gr){
    if(Math.hypot(f[0],f[2])>.3)c.yaw=Math.atan2(f[2],f[0]); // pousou: endireita o carro mantendo o rumo
    c.fl=0;c.wx=c.wy=c.wz=0;c.jc=0;
    const fx=Math.cos(c.yaw),fz=Math.sin(c.yaw);let fv=c.vx*fx+c.vz*fz,lv=-c.vx*fz+c.vz*fx;
    fv+=(i.t*(i.t*fv<0?55:28)+(bo?42:0))*dt;if(!i.t&&!bo)fv*=1-1.5*dt;
    fv=clamp(fv,-14,bo?46:26);c.yaw+=i.s*(i.h?3.4:2.7)*clamp(fv/8,-1,1)*dt;
    lv*=Math.exp(-(i.h?1.2:14)*dt); // derrapagem: freio de mão solta a traseira
    const nx=Math.cos(c.yaw),nz=Math.sin(c.yaw);c.vx=nx*fv-nz*lv;c.vz=nz*fv+nx*lv;setYaw(c,c.yaw);
    if(i.j&&!c.jp){c.vy=10;c.jc=1}
  }else{
    c.vy+=G*dt;
    if(i.j&&!c.jp&&c.jc<2){c.jc=2; // segundo pulo, ou flip direcional se houver input
      if(i.t||i.s){const d=Math.hypot(i.t,i.s),rr=rot(c,0,0,1),hl=Math.hypot(f[0],f[2])||1,rl=Math.hypot(rr[0],rr[2])||1;
        c.vx+=(f[0]/hl*i.t+rr[0]/rl*i.s)/d*14;c.vz+=(f[2]/hl*i.t+rr[2]/rl*i.s)/d*14;c.vy=Math.max(c.vy,4);c.fl=.65;c.fdt=i.t/d;c.fds=i.s/d}else c.vy=9}
    let wx=0,wy=0,wz=0;
    if(c.fl>0){c.fl-=dt;wz=-c.fdt*9.66;wx=c.fds*9.66} // flip: ~360° em .65s (a rotação real é que transfere o impulso à bola)
    else{c.fl=0;wz=i.t*5;wy=-i.s*3.2;wx=(i.r||0)*5.5} // pitch (W/S), yaw (A/D), air roll (Q/E)
    if(bo){c.vx+=f[0]*38*dt;c.vy+=f[1]*38*dt;c.vz+=f[2]*38*dt} // boost empurra na direção do nariz
    c.wx=wx;c.wy=wy;c.wz=wz;spin(c,wx,wy,wz,dt);
    const f2=rot(c,1,0,0);if(Math.hypot(f2[0],f2[2])>.3)c.yaw=Math.atan2(f2[2],f2[0]);
  }
  const hs=Math.hypot(c.vx,c.vz);if(hs>50){c.vx*=50/hs;c.vz*=50/hs}
  c.jp=!!i.j;c.x+=c.vx*dt;c.y+=c.vy*dt;c.z+=c.vz*dt;bound(c,.8,0);
}
const api={rot,setYaw,AX,AZ,GW,GH,GD,H,BR,CR,G,DT,Z,PADS,clamp,wrap,bound,stepCar};
if(typeof module!=='undefined')module.exports=api;else g.Phys=api;
})(this);
