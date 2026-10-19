// Sistema de partículas em UM draw call (Points + shader aditivo), pool circular fixo: sem alocação por frame (sem GC)
const FX=(()=>{const N=3000,P=new Float32Array(N*3),C=new Float32Array(N*3),B=new Float32Array(N*3),Sz=new Float32Array(N),V=new Float32Array(N*3),L=new Float32Array(N),M=new Float32Array(N).fill(1),S0=new Float32Array(N),Gv=new Float32Array(N);let h=0;
 const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('color',new T.BufferAttribute(C,3));g.setAttribute('size',new T.BufferAttribute(Sz,1));
 const pts=new T.Points(g,new T.ShaderMaterial({transparent:true,depthWrite:false,blending:T.AdditiveBlending,
  vertexShader:'attribute float size;attribute vec3 color;varying vec3 vc;void main(){vc=color;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=size*420./-mv.z;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'varying vec3 vc;void main(){float d=length(gl_PointCoord-.5)*2.;if(d>1.)discard;gl_FragColor=vec4(vc*(1.-d*d),1.);}'}));pts.frustumCulled=false;
 const col=new T.Color();
 function emit(x,y,z,vx,vy,vz,life,size,hex,gr){const i=h,k=i*3;h=(h+1)%N;col.set(hex);P[k]=x;P[k+1]=y;P[k+2]=z;V[k]=vx;V[k+1]=vy;V[k+2]=vz;B[k]=col.r;B[k+1]=col.g;B[k+2]=col.b;L[i]=M[i]=life;S0[i]=size;Gv[i]=gr||0}
 function burst(x,y,z,n,sp,life,size,hex,gr,up){n=Math.round(n*QS().pf);for(let i=0;i<n;i++){const a=Math.random()*6.283,b=Math.acos(Math.random()*2-1),s=sp*(.3+Math.random()*.7);
  emit(x,y,z,Math.sin(b)*Math.cos(a)*s,Math.cos(b)*s+(up||0),Math.sin(b)*Math.sin(a)*s,life*(.6+Math.random()*.6),size,hex,gr===undefined?-8:gr)}}
 function update(dt){for(let i=0;i<N;i++){if(L[i]<=0)continue;L[i]-=dt;const k=i*3;if(L[i]<=0){Sz[i]=0;C[k]=C[k+1]=C[k+2]=0;continue}
  V[k+1]+=Gv[i]*dt;const dr=1-1.5*dt;V[k]*=dr;V[k+1]*=dr;V[k+2]*=dr;P[k]+=V[k]*dt;P[k+1]+=V[k+1]*dt;P[k+2]+=V[k+2]*dt;
  const f=L[i]/M[i];C[k]=B[k]*f;C[k+1]=B[k+1]*f;C[k+2]=B[k+2]*f;Sz[i]=S0[i]*(.4+.6*f)}
  g.attributes.position.needsUpdate=g.attributes.color.needsUpdate=g.attributes.size.needsUpdate=true}
 return{pts,emit,burst,update}})();
