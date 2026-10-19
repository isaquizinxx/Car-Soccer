// Renderer, céu, arena futurista (gramado procedural, paredes, arquibancadas, torcida, telão, holofotes, gols), bola e ambiente
const {AX,AZ,GW,GH,GD,BR,PADS}=Phys,Q_=QS();
const R=new T.WebGLRenderer({canvas:$('c'),antialias:ST.q!=='low',powerPreference:'high-performance'});
R.outputEncoding=T.sRGBEncoding;R.toneMapping=T.ACESFilmicToneMapping;R.toneMappingExposure=1.15;R.setPixelRatio(Math.min(devicePixelRatio,Q_.pr,Math.sqrt(2.6e6/(innerWidth*innerHeight)))); // teto de ~2,6 MPixels: evita GPU integrada estourar a memória (tela preta)
$('c').addEventListener('webglcontextlost',e=>{e.preventDefault();const o=['low','medium','high','ultra'],i=o.indexOf(ST.q);if(i>0){ST.q=o[i-1];saveST()}location.reload()});
R.shadowMap.enabled=Q_.sh>0;R.shadowMap.type=T.PCFSoftShadowMap;
const S=new T.Scene(),cam=new T.PerspectiveCamera(72,1,.1,700);S.fog=new T.FogExp2(0x2a2048,.0045);S.add(FX.pts);
const SC=(()=>{
 const mk=(w,h,d,m,x,y,z,sh)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(sh){o.castShadow=o.receiveShadow=true}S.add(o);return o};
 const M={conc:new T.MeshStandardMaterial({color:0x474c5a,roughness:.95}),met:new T.MeshStandardMaterial({color:0x9aa4b5,metalness:.9,roughness:.3}),dark:new T.MeshStandardMaterial({color:0x1a1e2a,metalness:.7,roughness:.4}),
  glass:new T.MeshStandardMaterial({color:0x88b8ff,transparent:true,opacity:.12,roughness:.05,metalness:.6,depthWrite:false})};
 const led=(c)=>new T.MeshBasicMaterial({color:c});
 // céu: gradiente de pôr do sol + estrelas + skyline distante
 const skyM=new T.ShaderMaterial({side:T.BackSide,depthWrite:false,fog:false,vertexShader:'varying vec3 p;void main(){p=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'varying vec3 p;void main(){float h=normalize(p).y;vec3 c=mix(vec3(.95,.42,.22),vec3(.4,.2,.5),smoothstep(0.,.16,h));c=mix(c,vec3(.02,.04,.15),smoothstep(.1,.65,h));gl_FragColor=vec4(c,1.);}'});
 S.add(new T.Mesh(new T.SphereGeometry(500,24,16),skyM));
 const sp=new Float32Array(900);for(let i=0;i<300;i++){const a=Math.random()*6.28,b=.25+Math.random()*1.2,r=450;sp[i*3]=Math.cos(a)*Math.sin(b)*r;sp[i*3+1]=Math.cos(b)*r;sp[i*3+2]=Math.sin(a)*Math.sin(b)*r}
 const sg=new T.BufferGeometry();sg.setAttribute('position',new T.BufferAttribute(sp,3));S.add(new T.Points(sg,new T.PointsMaterial({size:2,color:0xffffff,fog:false})));
 const sk=new T.InstancedMesh(new T.BoxGeometry(1,1,1),new T.MeshBasicMaterial({color:0x111a36}),140),d=new T.Object3D();
 for(let i=0;i<140;i++){const a=i/140*6.283,r=230+Math.random()*60,h=20+Math.random()*80;d.position.set(Math.cos(a)*r,h/2,Math.sin(a)*r);d.scale.set(10+Math.random()*16,h,10+Math.random()*16);d.updateMatrix();sk.setMatrixAt(i,d.matrix)}S.add(sk);
 if(Q_.env){const e=new T.Scene();e.add(new T.Mesh(new T.SphereGeometry(50,16,8),skyM));S.environment=new T.PMREMGenerator(R).fromScene(e,0).texture}
 // luzes
 S.add(new T.HemisphereLight(0x8aa0ff,0x1b2a1c,.55));
 const sun=new T.DirectionalLight(0xfff0dd,.9);sun.position.set(30,55,20);sun.castShadow=Q_.sh>0;sun.shadow.mapSize.set(Q_.sh||1,Q_.sh||1);const sc=sun.shadow.camera;sc.left=-62;sc.right=62;sc.top=36;sc.bottom=-36;sc.near=1;sc.far=140;sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;sun.shadow.radius=Q_.sh>1024?3:1;S.add(sun);
 const rb=new T.DirectionalLight(0x2d8cff,.35);rb.position.set(-60,20,0);S.add(rb);const ro=new T.DirectionalLight(0xff8a1f,.35);ro.position.set(60,20,0);S.add(ro);
 // gramado procedural: faixas de corte, ruído, desgaste, linhas e zonas dos gols
 const W=2048,H=1158,cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d'),k=W/92,X=v=>(v+46)*k,Y=v=>(v+26)*k;
 for(let i=0;i<23;i++){x.fillStyle=i%2?'#2a7a3a':'#318c45';x.fillRect(i*W/23,0,W/23+1,H)}
 for(let i=0;i<16000;i++){x.fillStyle=Math.random()<.5?'rgba(15,55,20,.14)':'rgba(110,180,80,.12)';x.fillRect(Math.random()*W,Math.random()*H,2,7)}
 for(const [px,pz,r] of [[0,0,13],[-33,0,10],[33,0,10],[-18,11,6],[17,-12,7],[-8,-14,5]]){const g=x.createRadialGradient(X(px),Y(pz),0,X(px),Y(pz),r*k);g.addColorStop(0,'rgba(95,70,35,.5)');g.addColorStop(1,'rgba(95,70,35,0)');x.fillStyle=g;x.fillRect(0,0,W,H)}
 x.fillStyle='rgba(45,140,255,.4)';x.fillRect(X(-46),Y(-GW),6*k,2*GW*k);x.fillStyle='rgba(255,138,31,.4)';x.fillRect(X(40),Y(-GW),6*k,2*GW*k);
 x.strokeStyle='rgba(255,255,255,.88)';x.lineWidth=5;x.strokeRect(X(-AX),Y(-AZ),2*AX*k,2*AZ*k);x.beginPath();x.moveTo(X(0),Y(-AZ));x.lineTo(X(0),Y(AZ));x.stroke();
 x.beginPath();x.arc(X(0),Y(0),7*k,0,6.283);x.stroke();x.fillStyle='#fff';x.beginPath();x.arc(X(0),Y(0),.5*k,0,6.283);x.fill();x.strokeRect(X(-AX),Y(-12),10*k,24*k);x.strokeRect(X(AX-10),Y(-12),10*k,24*k);
 const gt=new T.CanvasTexture(cv);gt.encoding=T.sRGBEncoding;gt.anisotropy=R.capabilities.getMaxAnisotropy();
 const floor=new T.Mesh(new T.PlaneGeometry(92,52),new T.MeshStandardMaterial({map:gt,roughness:.88}));floor.rotation.x=-Math.PI/2;floor.receiveShadow=true;S.add(floor);
 mk(200,.2,200,new T.MeshStandardMaterial({color:0x1a1f2c,roughness:1}),0,-.2,0);
 // paredes (concreto + LED + vidro), e gols (estrutura metálica, rede, luz)
 const wall=(w,d,px,pz)=>{mk(w,2.4,d,M.conc,px,1.2,pz,1);mk(w,.14,d+.05,led(0x35c8ff),px,2.45,pz);mk(w,5,d*.5,M.glass,px,5,pz)};
 wall(2*AX,.6,0,AZ+.3);wall(2*AX,.6,0,-AZ-.3);const e=(AZ-GW)/2;for(const s of [-1,1])for(const z of [-1,1])wall(.6,AZ-GW,s*(AX+.3),z*(GW+e));
 const gl=[];for(const s of [-1,1]){const c=s<0?0x2d8cff:0xff8a1f,gm=led(c);
  mk(.5,GH,2*GW,M.dark,s*(AX+GD),GH/2,0,1);mk(GD,.4,2*GW,M.dark,s*(AX+GD/2),GH,0);mk(GD,GH,.4,M.dark,s*(AX+GD/2),GH/2,GW);mk(GD,GH,.4,M.dark,s*(AX+GD/2),GH/2,-GW);
  for(const z of [-GW,GW]){const p=new T.Mesh(new T.CylinderGeometry(.3,.3,GH,12),M.met);p.position.set(s*AX,GH/2,z);p.castShadow=true;S.add(p)}
  const bar=new T.Mesh(new T.CylinderGeometry(.3,.3,2*GW,12),M.met);bar.rotation.x=Math.PI/2;bar.position.set(s*AX,GH,0);S.add(bar);mk(.2,.2,2*GW,gm,s*AX,GH+.35,0);
  const net=new T.Mesh(new T.BoxGeometry(GD,GH,2*GW,6,4,12),new T.MeshBasicMaterial({color:0xffffff,wireframe:true,transparent:true,opacity:.22}));net.position.set(s*(AX+GD/2),GH/2,0);S.add(net);
  const l=new T.PointLight(c,.8,40);l.position.set(s*(AX+3),4,0);l.visible=Q_.sp>0;S.add(l);gl.push(l);
  mk(.3,10,.3,M.met,s*(AX+GD+2),5,GW+4);mk(6,2.5,.3,led(c),s*(AX+GD+2),11,GW+4)}
 // arquibancadas + torcida instanciada
 const seats=[];function stand(ax,sg){const len=ax?2*AZ+14:2*(AX+GD)+14,base=ax?AX+GD+4:AZ+4;
  for(let i=0;i<6;i++){const off=base+i*2.4,h=1.2+i*1.3;mk(ax?2.4:len,h,ax?len:2.4,M.conc,ax?sg*off:0,h/2,ax?0:sg*off);for(let j=-len/2+1;j<len/2;j+=1.6)seats.push(ax?[sg*off,h+.55,j]:[j,h+.55,sg*off])}}
 stand(0,1);stand(0,-1);stand(1,1);stand(1,-1);
 for(let i=seats.length-1;i>0;i--){const j=Math.random()*(i+1)|0;[seats[i],seats[j]]=[seats[j],seats[i]]}
 const cn=Math.min(Q_.crowd,seats.length),crowd=new T.InstancedMesh(new T.BoxGeometry(.7,1.1,.7),new T.MeshLambertMaterial({color:0xffffff}),cn),cc=[0x2d8cff,0xff8a1f,0xffffff,0xffd23f,0x8a8fa0,0xd84a6a],tmp=new T.Color();
 for(let i=0;i<cn;i++)crowd.setColorAt(i,tmp.set(cc[Math.random()*cc.length|0]));S.add(crowd);let amp=0;const dm=new T.Object3D();
 // telão gigante central
 const bc=document.createElement('canvas');bc.width=512;bc.height=256;const bx=bc.getContext('2d'),bt=new T.CanvasTexture(bc),bm=new T.MeshBasicMaterial({map:bt});
 const board=new T.Mesh(new T.BoxGeometry(24,10,24),[bm,bm,M.dark,M.dark,bm,bm]);board.position.set(0,27,0);S.add(board);for(const [a,b] of [[-11,-11],[11,-11],[-11,11],[11,11]])mk(.15,30,.15,M.met,a,42,b);
 function drawBoard(sc,time){bx.fillStyle='#050a1a';bx.fillRect(0,0,512,256);bx.textAlign='center';bx.font='bold 130px sans-serif';bx.fillStyle='#4da3ff';bx.fillText(sc[0],105,160);bx.fillStyle='#ff9d45';bx.fillText(sc[1],407,160);
  bx.fillStyle='#fff';bx.font='bold 64px sans-serif';bx.fillText(time,256,150);bx.font='bold 28px sans-serif';bx.fillStyle='#8aa0c8';bx.fillText('CAR SOCCER',256,230);bt.needsUpdate=true}drawBoard([0,0],'2:00');
 // holofotes (torres + SpotLights conforme qualidade), bandeiras
 const spots=[];for(const [a,b] of [[1,1],[1,-1],[-1,1],[-1,-1]]){const px=a*(AX+14),pz=b*(AZ+16);mk(.8,34,.8,M.met,px,17,pz);mk(7,3,1,led(0xfff2d0),px-a*.8,34,pz);
  const l=new T.SpotLight(0xfff2e0,1.1,160,.7,.5);l.position.set(px,34,pz);l.target.position.set(0,0,0);S.add(l,l.target);l.visible=false;spots.push(l)}
 spots.forEach((l,i)=>l.visible=i<Q_.sp);
 const flags=[];for(const [px,pz,c] of [[AX+GD+12,AZ+14,0xff8a1f],[-AX-GD-12,AZ+14,0x2d8cff],[AX+GD+12,-AZ-14,0xff8a1f],[-AX-GD-12,-AZ-14,0x2d8cff]]){mk(.25,16,.25,M.met,px,8,pz);
  const f=new T.Mesh(new T.PlaneGeometry(7,3.5,10,1),new T.MeshBasicMaterial({color:c,side:T.DoubleSide}));f.position.set(px+3.5,14,pz);S.add(f);flags.push(f)}
 // boost pads
 const pads=PADS.map(p=>{const m=new T.Mesh(new T.RingGeometry(.9,1.8,6),new T.MeshBasicMaterial({color:0xffd23f,transparent:true,blending:T.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(p[0],.06,p[1]);S.add(m);return m});
 // poeira ambiente
 const dp=new Float32Array(240*3);for(let i=0;i<240;i++){dp[i*3]=(Math.random()-.5)*100;dp[i*3+1]=Math.random()*20;dp[i*3+2]=(Math.random()-.5)*60}
 const dg=new T.BufferGeometry();dg.setAttribute('position',new T.BufferAttribute(dp,3));S.add(new T.Points(dg,new T.PointsMaterial({size:.25,color:0xffe9c0,transparent:true,opacity:.45,blending:T.AdditiveBlending,depthWrite:false})));
 // bola (textura procedural, brilho de velocidade, sombra-blob)
 const bcv=document.createElement('canvas');bcv.width=512;bcv.height=256;const b2=bcv.getContext('2d');b2.fillStyle='#f2f5fa';b2.fillRect(0,0,512,256);b2.fillStyle='#1b2440';
 for(let i=0;i<8;i++)for(let j=0;j<3;j++){const cx=i*64+(j%2)*32+32,cy=j*86+40;b2.beginPath();for(let a=0;a<6;a++)b2.lineTo(cx+Math.cos(a*1.047)*20,cy+Math.sin(a*1.047)*20);b2.fill()}
 const bt2=new T.CanvasTexture(bcv);bt2.encoding=T.sRGBEncoding;const ball=new T.Mesh(new T.SphereGeometry(BR,32,24),new T.MeshStandardMaterial({map:bt2,roughness:.3,metalness:.15,emissive:0x0a1020}));ball.castShadow=true;S.add(ball);
 const gc=document.createElement('canvas');gc.width=gc.height=64;const g2=gc.getContext('2d'),gg=g2.createRadialGradient(32,32,0,32,32,32);gg.addColorStop(0,'rgba(255,255,255,1)');gg.addColorStop(1,'rgba(255,255,255,0)');g2.fillStyle=gg;g2.fillRect(0,0,64,64);
 const glowTex=new T.CanvasTexture(gc),bglow=new T.Sprite(new T.SpriteMaterial({map:glowTex,color:0x66ccff,blending:T.AdditiveBlending,transparent:true,opacity:0,depthWrite:false}));bglow.scale.set(7,7,1);ball.add(bglow);
 const blob=new T.Mesh(new T.CircleGeometry(1.6,16),new T.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false}));blob.rotation.x=-Math.PI/2;blob.position.y=.05;S.add(blob);
 let t=0;
 function update(dt,ballPos){t+=dt;
  if(amp>.01||((t*10|0)%3===0)){for(let i=0;i<cn;i++){const s=seats[i];dm.position.set(s[0],s[1]+Math.abs(Math.sin(t*(7+i%5)+i))*amp+Math.sin(t*1.5+i)*.04,s[2]);dm.updateMatrix();crowd.setMatrixAt(i,dm.matrix)}crowd.instanceMatrix.needsUpdate=true}
  amp*=Math.exp(-dt*.5);for(const f of flags){const p=f.geometry.attributes.position;for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(t*4+p.getX(i)*1.2)*.4*(p.getX(i)+3.5)/7);p.needsUpdate=true}
  const dpa=dg.attributes.position;for(let i=0;i<240;i++){let y=dpa.getY(i)+dt*.6;if(y>20)y=0;dpa.setY(i,y)}dpa.needsUpdate=true;
  gl.forEach(l=>l.intensity+=((Q_.sp>0?.8:0)-l.intensity)*Math.min(1,dt*2));blob.position.x=ballPos.x;blob.position.z=ballPos.z;blob.scale.setScalar(Math.max(.4,1-ballPos.y*.04))}
 return{ball,bglow,glowTex,pads,gl,board:drawBoard,update,cheer:v=>amp=Math.max(amp,v),offset(v){const w=innerWidth,h=innerHeight;if(v)cam.setViewOffset(w,h,w*v,0,w,h);else cam.clearViewOffset()}}
})();
