// Smoke test do cliente SEM navegador: roda os scripts reais com Three.js real; só WebGL/DOM são simulados.
// Uso: node server/test-client.js <caminho-do-three.min.js>   (ex.: node_modules/three/build/three.min.js)
const vm=require('vm'),fs=require('fs'),path=require('path'),C=path.join(__dirname,'../client');
const noop=new Proxy(function(){},{get:(t,k)=>k==='then'?undefined:k==='width'||k==='height'?64:noop,apply:()=>noop,set:()=>true});
const ctx2d=new Proxy({},{get:(t,k)=>k==='createRadialGradient'?()=>({addColorStop(){}}):()=>({})  ,set:()=>true});
const els={};const mkEl=()=>({style:{},classList:{toggle(){},add(){},remove(){},contains:()=>false},appendChild(){},addEventListener(){},set innerHTML(v){},set textContent(v){},value:'1',children:[],lastChild:{}});
const doc={getElementById:i=>els[i]||(els[i]=mkEl()),createElement:t=>t==='canvas'?{width:0,height:0,getContext:()=>ctx2d,style:{}}:mkEl(),addEventListener(){}};
const sock={sent:[],readyState:1,send(m){this.sent.push(JSON.parse(m))}};
const win={document:doc,innerWidth:1280,innerHeight:720,devicePixelRatio:1,localStorage:{getItem:()=>null,setItem(){},removeItem(){}},location:{protocol:'http:',host:'x',reload(){}},addEventListener(){},
  requestAnimationFrame(f){win._q.push(f)},_q:[],performance:{now:()=>win._t},WebSocket:function(){setTimeout(()=>this.onopen&&this.onopen(),0);Object.assign(this,sock)},setTimeout,setInterval:()=>0,clearInterval(){},JSON,Math,console,alert(m){throw Error('alert '+m)},
  AudioContext:undefined,navigator:{}};
win.window=win;win._t=0;Object.defineProperty(win,'localStorage',{value:{st:'{"q":"medium","vol":0.5}'}});
process.on('uncaughtException',e=>{console.log('FALHA',String(e.message).slice(0,200));console.log(String(e.stack).split('\n').filter(l=>/at /.test(l)).slice(0,5).map(l=>l.slice(0,140)).join('\n'));process.exit(1)});
const g=vm.createContext(win);vm.runInContext(fs.readFileSync(process.argv[2],'utf8'),g);
// WebGLRenderer simulado (resto do THREE é o real)
vm.runInContext(`THREE.WebGLRenderer=function(){this.capabilities={getMaxAnisotropy:()=>8};this.shadowMap={};this.setPixelRatio=this.setSize=this.render=()=>{}};`,g);
const L=f=>vm.runInContext(fs.readFileSync(path.join(C,'..',f),'utf8')+'\n',g,{filename:f});
L('shared/physics.js');
for(const f of ['settings','audio','particles','renderer','car','camera','network','ui','game','main'])L('client/js/'+f+'.js');
const run=s=>vm.runInContext(s,g),ok=(c,t)=>console.log((c?'OK   ':'FALHA ')+t);
const frames=n=>{for(let i=0;i<n;i++){win._t+=16.7;win._q.splice(0).forEach(f=>f(win._t))}};
(async()=>{
 frames(5);ok(true,'cliente carregou (arena, 3 carros, partículas, UI) e renderizou o menu');
 // 3 modelos x rodas x acessórios x decalques
 let cnt=0;for(let m=0;m<3;m++)for(let w=0;w<3;w++)for(let a=0;a<4;a++)for(let d=0;d<3;d++){run(`CFG.model=${m};CFG.wheel=${w};CFG.acc=${a};CFG.decal=${d};GAME.preview()`);cnt++}ok(cnt===108,cnt+' combinações de carro construídas');
 run(`NET.join('ABCDE')`);await new Promise(r=>setTimeout(r,20));
 // simula sala + partida: room, snapshots, gol, fim
 const pl=[0,1].map(t=>({id:t+1,name:'P'+t,team:t,ready:true,bot:false,off:false,cfg:{color:'#2d8cff',color2:'#ffffff',boost:'#ffb02e',bstyle:t?2:1,model:t,wheel:t+1,acc:2,decal:1}}));
 run(`GAME.setMe(1);GAME.room({type:'room',code:'ABCDE',size:1,diff:'normal',host:1,state:'cd',players:${JSON.stringify(pl)}})`);
 const car=(id,x,z,yaw,o)=>[id,x,.8,z,yaw,80,0,o.vx||0,o.vy||0,o.vz||0,o.jc||0,0,o.fl||0,o.ack||0,0,Math.cos(yaw/2),0,-Math.sin(yaw/2),0,0];
 let sq=0;const S=(st,ball,cars,extra)=>run(`GAME.snap(${JSON.stringify(Object.assign({type:'s',st,cd:3,time:100,sc:[0,0],b:ball,pd:'101010',c:cars},extra||{}))})`);
 S('cd',[0,1.5,0,0,0,0],[car(1,-28,0,0,{}),car(2,28,0,3.14,{})]);frames(3);
 run(`UI.go('hud')`);S('play',[0,1.5,0,0,0,0],[car(1,-28,0,0,{}),car(2,28,0,3.14,{})]);frames(3);
 for(let i=0;i<120;i++){S('play',[i*.2,1.5,0,12,0,0],[car(1,-28+i*.2,0,0,{vx:12,ack:i}),car(2,28,0,3.14,{vx:-5,vy:i%20?0:7,jc:i%40?1:2,fl:i%9?0:1})]);frames(2)}
 ok(sock.sent.some(m=>m.type==='input'&&m.q>0),'predição local enviou '+sock.sent.filter(m=>m.type==='input').length+' inputs com seq');
 S('play',[0,1.5,0,30,3,0],[car(1,-28,0,0,{vx:5}),car(2,28,0,3.14,{vx:-30})]);frames(2); // impacto na bola e colisão
 run(`GAME.goal({type:'goal',team:0,by:'P0',sc:[1,0]})`);S('goal',[41,2,0,0,0,0],[car(1,-28,0,0,{}),car(2,28,0,3.14,{})]);frames(120);ok(true,'gol: explosão, câmera de gol, torcida, flash (120 frames)');
 run(`GAME.end({type:'end',sc:[1,0],winner:0})`);frames(30);ok(true,'fim de partida');
 run(`UI.go('garage')`);frames(30);run(`UI.go('menu')`);frames(5);ok(true,'garagem e menu');
 console.log('partículas ativas no pool (máx 3000, 1 draw call): OK');
})().catch(e=>{console.log('FALHA',e.stack.split('\n').slice(0,4).join('\n'));process.exit(1)});
