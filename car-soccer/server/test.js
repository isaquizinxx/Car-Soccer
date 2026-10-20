// Teste de integração: node server/test.js  (sobe o servidor, usa clientes WebSocket reais)
const {spawn}=require('child_process'),WS=require('ws'),Phys=require('../shared/physics'),PORT=3999;
const srv=spawn('node',[__dirname+'/server.js'],{env:{...process.env,PORT}});let err='';srv.stderr.on('data',d=>err+=d);
const sleep=ms=>new Promise(r=>setTimeout(r,ms)),open=()=>new Promise(r=>{const w=new WS('ws://localhost:'+PORT);w.on('open',()=>r(w))});
const send=(w,m)=>w.send(JSON.stringify(m));
async function room(diff,size){const w=await open(),o={w,snaps:[],id:0,goals:0,end:0};
  w.on('message',d=>{const m=JSON.parse(d);if(m.type==='joined')o.id=m.id;if(m.type==='s')o.snaps.push(m);if(m.type==='goal')o.goals++;if(m.type==='end')o.end=1;if(m.type==='pong')o.ping=1});
  send(w,{type:'create',name:'T',size,diff});await sleep(150);send(w,{type:'ready',v:true});return o}
(async()=>{
  await sleep(600);let fail=0;const ok=(c,t)=>{console.log((c?'OK   ':'FALHA ')+t);if(!c)fail=1};
  // 1) predição: cliente simula com shared/physics e compara com o servidor pelo ack
  const a=await room('normal',1);await sleep(3800);
  const me=s=>s.c.find(c=>c[0]===a.id),first=a.snaps.find(s=>s.st==='play');ok(!!first,'partida iniciou (cd -> play)');
  const c0=me(first),L={x:c0[1],y:c0[2],z:c0[3],yaw:c0[4],boost:c0[5],vx:c0[7],vy:c0[8],vz:c0[9],jc:c0[10],fdt:c0[11],fds:c0[19],fl:c0[12],qw:c0[15],qx:c0[16],qy:c0[17],qz:c0[18],wx:0,wy:0,wz:0,jp:!!c0[14]},pred={};let seq=0,maxErr=0,maxJc=0;
  const t0=Date.now();a.snaps.length=0;let nextT=t0; /* ritmo exato de 60 Hz médios (como o acumulador do cliente), sem deriva do setTimeout */
  while(Date.now()-t0<2500){const jj=seq%90===9||seq%90===19?1:0,i={q:++seq,t:jj?0:-1,s:jj?0:.4,j:jj,b:0,h:0}; /* pulo + pulo duplo sem flip; o flip é validado em test-physics */Phys.stepCar(L,i,Phys.DT,Phys.arena(1));pred[seq]={x:L.x,y:L.y,z:L.z};send(a.w,{type:'input',...i});nextT+=1000/60;await sleep(Math.max(0,nextT-Date.now()))}
  for(const s of a.snaps){const c=me(s),p=pred[c[13]];if(p&&c[13]>20){maxErr=Math.max(maxErr,Math.hypot(c[1]-p.x,c[2]-p.y,c[3]-p.z));maxJc=Math.max(maxJc,c[10])}}
  ok(a.snaps.length>40,'snapshots recebidos: '+a.snaps.length);ok(maxJc===2,'pulo duplo/flip funcionando (jc max='+maxJc+')');
  console.log('     erro máx. predição vs servidor: '+maxErr.toFixed(2)+' m (jitter de relógio local/servidor)');ok(maxErr<4,'predição coerente com o servidor');
  ok(a.snaps.some(s=>s.pd&&s.pd.length===6)&&a.snaps.some(s=>s.b.length===9),'snapshot com pads e velocidade da bola');
  send(a.w,{type:'ping',t:1});await sleep(100);ok(a.ping,'ping/pong');
  // 2) todos os níveis de bot, 3v3 só com bots
  for(const d of ['easy','normal','hard','expert']){const r=await room(d,3);await sleep(3400+4000);const l=r.snaps[r.snaps.length-1],mv=r.snaps.some(s=>Math.hypot(s.b[3],s.b[5])>3);
    ok(l&&l.c.length===6&&mv,'3v3 bots '+d+': 6 carros, bola em movimento, placar '+(l&&l.sc));r.w.close()}
  {const r4=await room('hard',4);await sleep(5400);const l=r4.snaps[r4.snaps.length-1];ok(l&&l.c.length===8&&l.b.length===9&&Math.abs(l.c[0][1])<=140/2+10,'4v4: 8 carros, snapshot com spin da bola');r4.w.close()}
  console.log(err?'ERROS NO SERVIDOR:\n'+err:'servidor sem erros');process.exit(fail||err?1:0)})();
setTimeout(()=>{srv.kill()},40000).unref();process.on('exit',()=>srv.kill());
