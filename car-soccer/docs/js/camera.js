// Câmera: follow suave, FOV dinâmico por velocidade/boost, shake, câmera da bola, câmera de gol (orbital)
const CAMX={shake:0,ball:false,p:new T.Vector3(),l:new T.Vector3(),a:0,
 follow(dt,c,b,spd,boosting){
  let dx=Math.cos(c.yaw),dz=Math.sin(c.yaw);if(this.ball){dx=b.x-c.x;dz=b.z-c.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l}
  const k=1-Math.exp(-dt*(this.ball?5:8)),d=(11+spd*.07)*(ST.cd||1);this.p.lerp(new T.Vector3(c.x-dx*d,c.y+4.6+spd*.02,c.z-dz*d),k);
  this.l.lerp(this.ball?new T.Vector3(b.x*.7+c.x*.3,Math.max(b.y,1.5),b.z*.7+c.z*.3):new T.Vector3(c.x+dx*10,2,c.z+dz*10),k);this.apply(dt,72+spd*.4+(boosting?9:0))},
 goal(dt,b){this.a+=dt*.9;const k=1-Math.exp(-dt*4);this.p.lerp(new T.Vector3(b.x+Math.cos(this.a)*20,9,b.z+Math.sin(this.a)*20),k);this.l.lerp(new T.Vector3(b.x,b.y+1,b.z),k);this.apply(dt,65)},
 orbit(dt,ang,dist,h){this.p.set(Math.cos(ang)*dist,h,Math.sin(ang)*dist);this.l.set(0,1,0);this.apply(dt,50)},
 apply(dt,fov){cam.position.copy(this.p);cam.lookAt(this.l);const s=this.shake;if(s>.01){cam.position.x+=(Math.random()-.5)*s*.9;cam.position.y+=(Math.random()-.5)*s*.9;cam.position.z+=(Math.random()-.5)*s*.9}
  this.shake*=Math.exp(-dt*5);if(Math.abs(cam.fov-fov)>.05){cam.fov+=(fov-cam.fov)*Math.min(1,dt*5);cam.updateProjectionMatrix()}}};
