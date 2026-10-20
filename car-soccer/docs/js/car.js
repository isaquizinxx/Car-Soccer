// Carros: 3 modelos extrudados (perfil lateral com bisel), materiais PBR (tinta com verniz, vidro, borracha, cromo), rodas girando, suspensão, faróis, lanternas e boost
const CAR=(()=>{
 const MD=[{l:1,w:2.1,body:[[-2.1,-.25],[2.1,-.25],[2.25,.15],[1.7,.5],[.7,.62],[-.3,.66],[-1.7,.62],[-2.25,.25]],cab:[[-1,.6],[.8,.6],[.1,1.18],[-.8,1.18]]},
  {l:1.08,w:2.4,body:[[-2.3,-.25],[2.3,-.25],[2.4,.2],[1.9,.6],[.5,.7],[-.4,.72],[-1.9,.7],[-2.4,.3]],cab:[[-.9,.7],[.5,.7],[.1,1.2],[-.8,1.2]]},
  {l:.88,w:2,body:[[-1.9,-.25],[1.9,-.25],[2.05,.2],[1.5,.55],[.8,.62],[-.2,.7],[-1.8,.7],[-2,.3]],cab:[[-1.5,.68],[.9,.68],[.3,1.32],[-1.4,1.32]]}];
 const mat={rub:new T.MeshStandardMaterial({color:0x101010,roughness:.9}),chr:new T.MeshStandardMaterial({color:0xdde3ee,metalness:1,roughness:.18}),dk:new T.MeshStandardMaterial({color:0x14171e,roughness:.6,metalness:.3}),
  gl:new T.MeshPhysicalMaterial({color:0x0a1420,metalness:.9,roughness:.05,transparent:true,opacity:.78}),hl:new T.MeshBasicMaterial({color:0xfff6d0}),tl:new T.MeshBasicMaterial({color:0xff2030})};
 const TG=new T.CylinderGeometry(.52,.52,.42,20).rotateX(Math.PI/2),RG=new T.CylinderGeometry(.36,.36,.44,16).rotateX(Math.PI/2),SG=new T.BoxGeometry(.7,.07,.46);
 const FIN=[{m:.5,r:.25,c:1},{m:.05,r:.85,c:0},{m:.9,r:.3,c:.5},{m:.6,r:.18,c:1,p:1},{m:1,r:.07,c:0}];
 function finish(cfg){const f=FIN[cfg.finish]||FIN[0],p=new T.MeshPhysicalMaterial({color:cfg.color,metalness:S.environment?f.m:Math.min(f.m,.45),roughness:f.r,clearcoat:f.c,clearcoatRoughness:.08});if(f.p){p.emissive=new T.Color(cfg.color2);p.emissiveIntensity=.12}return p} // sem mapa de reflexo (LOW/MEDIUM) limita o metal para não ficar escuro
 const ex=(pts,w,m,bv)=>{const s=new T.Shape();pts.forEach((p,i)=>i?s.lineTo(p[0],p[1]):s.moveTo(p[0],p[1]));const d=w-bv*2,g=new T.ExtrudeGeometry(s,{depth:d,bevelEnabled:true,bevelThickness:bv,bevelSize:bv,bevelSegments:2,curveSegments:3});g.translate(0,0,-d/2);return new T.Mesh(g,m)};
 function make(cfg,team){
  const m=MD[cfg.model]||MD[0],g=new T.Group(),bd=new T.Group(),paint=finish(cfg),c2=new T.MeshStandardMaterial({color:cfg.color2,roughness:.4,metalness:.3}),wm=new T.MeshStandardMaterial({color:cfg.wcolor||'#dde3ee',metalness:.9,roughness:.25});
  g.add(bd);const add=(o,x,y,z)=>{o.position.set(x||0,y||0,z||0);o.castShadow=true;bd.add(o);return o},bx=(w,h,d,mt)=>new T.Mesh(new T.BoxGeometry(w,h,d),mt);
  const B=m.body,C=m.cab,fx=B[2][0],rx=B[7][0],cl=C[2][0]-C[3][0];
  add(ex(B,m.w,paint,.1));add(ex(C,m.w*.86,mat.gl,.06));add(bx(cl+.15,.07,m.w*.84,paint),(C[2][0]+C[3][0])/2,C[2][1]+.03,0);
  for(const z of [-1,1]){add(bx(.14,.17,.42,mat.hl),fx-.02,.1,z*m.w*.3);add(bx(.12,.14,.5,mat.tl),rx+.02,.28,z*m.w*.28);add(bx(2.4,.12,.1,mat.dk),0,-.22,z*m.w/2);add(new T.Mesh(new T.CylinderGeometry(.08,.08,.3,8).rotateZ(Math.PI/2),mat.chr),rx-.1,-.1,z*m.w*.25)}
  add(bx(.3,.22,m.w*.95,mat.dk),B[1][0]+.05,-.12,0);add(bx(.3,.22,m.w*.95,mat.dk),B[0][0]-.05,-.12,0);
  if(cfg.acc===1||cfg.acc===2){const hy=cfg.acc===2?1.15:.85,w=m.w*(cfg.acc===2?1:.85);add(bx(.6,.07,w,paint),rx+.3,hy,0);for(const z of [-1,1])add(bx(.1,hy-.35,.1,mat.dk),rx+.35,(hy+.35)/2,z*w*.3);if(cfg.acc===2)for(const z of [-1,1])add(bx(.7,.35,.05,paint),rx+.3,hy,z*w/2)}
  if(cfg.acc===3){add(new T.Mesh(new T.CylinderGeometry(.03,.03,1.4,6),mat.dk),rx+.4,1,m.w*.3);add(new T.Mesh(new T.SphereGeometry(.1,8,8),new T.MeshBasicMaterial({color:cfg.color2})),rx+.4,1.7,m.w*.3)}
  if(cfg.decal===1){add(bx(2,.02,.34,c2),(fx+C[2][0])/2+.1,B[3][1]-.03,0);add(bx(1.3,.02,.34,c2),(C[3][0]+rx)/2-.1,B[5][1]+.02,0);add(bx(cl,.02,.34,c2),(C[2][0]+C[3][0])/2,C[2][1]+.07,0)}
  if(cfg.decal===2)for(const z of [-1,1])add(bx(3.6,.1,.03,c2),0,.12,z*(m.w/2+.04));
  const wh=[];for(const sx of [1,-1])for(const sz of [1,-1]){const pv=new T.Group(),sp=new T.Group();pv.position.set(sx*1.35*m.l,-.2,sz*(m.w/2-.02));pv.add(sp);g.add(pv);
   const t=new T.Mesh(TG,mat.rub);t.castShadow=true;sp.add(t);sp.add(new T.Mesh(RG,cfg.wheel?mat.dk:wm));const ns=[0,5,6][cfg.wheel]||0;for(let i=0;i<ns;i++){const s=new T.Mesh(SG,cfg.wheel===2&&i%2?c2:wm);s.rotation.z=i*6.283/ns;sp.add(s)}wh.push({pv,sp,front:sx>0})}
  const fl=new T.Mesh(new T.ConeGeometry(.4,2.6,10,1,true),new T.MeshBasicMaterial({color:cfg.boost,transparent:true,opacity:.75,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}));fl.rotation.z=Math.PI/2;fl.position.set(rx-1.3,.15,0);fl.scale.set(.001,.001,.001);g.add(fl);
  const gw=new T.Sprite(new T.SpriteMaterial({map:SC.glowTex,color:team?0xff8a1f:0x2d8cff,blending:T.AdditiveBlending,transparent:true,opacity:.55,depthWrite:false}));gw.scale.set(6,6,1);gw.position.y=-.7;g.add(gw);
  g.rotation.order='YZX';S.add(g);return{g,bd,wh,fl,rx,spin:0,steer:0,sy:0,svy:0,pyaw:0,pfv:0,pit:0,rol:0,pvy:0,flp:0}}
 // anima carro a partir do estado s={x,y,z,yaw,vx,vy,vz,pt,fl,boosting}; devolve velocidade lateral (derrapagem)
 function anim(o,s,dt){
  const fx=Math.cos(s.yaw),fz=Math.sin(s.yaw),fv=s.vx*fx+s.vz*fz,lv=-s.vx*fz+s.vz*fx,dy=Phys.wrap(s.yaw-o.pyaw),k=Math.min(1,dt*10),gr=s.y<1;o.pyaw=s.yaw;
  o.spin+=fv*dt/.52;o.steer+=(Phys.clamp(dy/dt*.22,-.5,.5)-o.steer)*k;
  o.pit+=(Phys.clamp(-(fv-o.pfv)/dt*.0025,-.08,.08)-o.pit)*k;o.pfv=fv;o.rol+=(Phys.clamp(-dy/dt*fv*.0022,-.12,.12)-o.rol)*k;
  if(o.pvy<-4&&s.vy>-1)o.svy-=o.pvy*.6;o.pvy=s.vy;o.svy+=(-o.sy*220-o.svy*16)*dt;o.sy=Phys.clamp(o.sy+o.svy*dt,-.25,.25);o.bd.position.y=o.sy; // suspensão
    o.g.position.set(s.x,s.y,s.z);o.g.quaternion.set(s.qx,s.qy,s.qz,s.qw);o.bd.rotation.set(o.rol,0,o.pit);
  for(const w of o.wh){w.sp.rotation.z=-o.spin;w.pv.rotation.y=w.front?-o.steer:0}
  const f=s.boosting?1+Math.random()*.25:.001;o.fl.scale.set(f,f,f);return gr?lv:0}
 return{make,anim,dispose(o){S.remove(o.g)}}})();
