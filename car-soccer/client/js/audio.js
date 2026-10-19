// Áudio 100% procedural (WebAudio): motor, boost, derrapagem, impactos, gol, torcida, contagem, vitória/derrota
const A=(()=>{let c,mg,nb,cr,bn,sk;const en={};
 function init(){if(c)return;c=new(window.AudioContext||window.webkitAudioContext)();mg=c.createGain();mg.gain.value=ST.vol;mg.connect(c.destination);
  const n=c.sampleRate*2;nb=c.createBuffer(1,n,c.sampleRate);const d=nb.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
  const ns=(f,g,t)=>{const s=c.createBufferSource();s.buffer=nb;s.loop=true;const fl=c.createBiquadFilter();fl.type=t||'lowpass';fl.frequency.value=f;const gn=c.createGain();gn.gain.value=g;s.connect(fl);fl.connect(gn);gn.connect(mg);s.start();return gn};
  cr=ns(600,.04);bn=ns(1200,0);sk=ns(2800,0,'bandpass')}
 const tone=(f0,f1,d,type,v,t0)=>{if(!c)return;const o=c.createOscillator(),g=c.createGain(),t=c.currentTime+(t0||0);o.type=type||'sine';o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+d);g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);o.connect(g);g.connect(mg);o.start(t);o.stop(t+d)};
 const burst=(f,d,v)=>{if(!c)return;const s=c.createBufferSource(),fl=c.createBiquadFilter(),g=c.createGain(),t=c.currentTime;s.buffer=nb;fl.frequency.value=f;g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.001,t+d);s.connect(fl);fl.connect(g);g.connect(mg);s.start(t,Math.random());s.stop(t+d)};
 return{resume(){init();c.resume()},vol(v){if(mg)mg.gain.value=v},
  hit(p,d){const v=p/(1+d*.05);tone(180,60,.18,'triangle',v*.9);burst(1500,.12,v*.8)},wall(p,d){burst(600,.15,p*.6/(1+d*.06))},
  jump(){tone(300,600,.12,'square',.06)},land(){tone(120,50,.15,'sine',.2)},ui(){tone(700,1000,.06,'sine',.1)},count(n){tone(n?520:900,n?520:900,.25,'square',.1)},
  goal(){tone(220,880,1.2,'sawtooth',.2);tone(330,1320,1,'square',.08,.1);burst(900,2,.5)},
  win(){[523,659,784,1047].forEach((f,i)=>tone(f,f,.4,'triangle',.25,i*.15))},lose(){[392,330,262].forEach((f,i)=>tone(f,f*.9,.5,'sawtooth',.15,i*.25))},
  crowd(l){if(cr)cr.gain.value=.04+l*.25},
  frame(bo,skid){if(bn)bn.gain.value+=((bo?.18:0)-bn.gain.value)*.2;if(sk)sk.gain.value+=((skid?.08:0)-sk.gain.value)*.2},
  engine(id,spd,dist,bo){if(!c)return;let e=en[id];if(!e){const o=c.createOscillator(),f=c.createBiquadFilter(),g=c.createGain();o.type='sawtooth';f.type='lowpass';f.frequency.value=500;o.connect(f);f.connect(g);g.connect(mg);o.start();e=en[id]={o,g}}
   e.o.frequency.value=45+spd*3.2+(bo?25:0);e.g.gain.value=.04/(1+dist*.08)},
  stop(id){const e=en[id];if(e){e.g.gain.value=0;e.o.stop();delete en[id]}}}})();
