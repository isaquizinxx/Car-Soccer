// WebSocket: criar/entrar em sala, reconexão automática com token, ping
const NET=(()=>{let ws,sess=JSON.parse(localStorage.cs||'null'),training=false,ping=0;
 const send=m=>ws&&ws.readyState===1&&ws.send(JSON.stringify(m));
 const clear=()=>{sess=null;localStorage.removeItem('cs')};
 function connect(cb){const u=window.SERVER_URL||((location.protocol==='https:'?'wss://':'ws://')+location.host);if(/SEU-APP/.test(u)){UI.error('Edite o arquivo config.js com o endereço do seu servidor (Render).');return}ws=new WebSocket(u);ws.onopen=cb;ws.onmessage=e=>on(JSON.parse(e.data));
  ws.onclose=()=>{if(sess)setTimeout(()=>connect(rejoin),1500)}}
 const rejoin=()=>send({type:'join',code:sess.code,token:sess.token,name:UI.name(),cfg:CFG});
 function on(m){
  if(m.type==='joined'){GAME.setMe(m.id);sess={code:m.code,token:m.token};localStorage.cs=JSON.stringify(sess);if(training){training=false;send({type:'ready',v:true})}}
  else if(m.type==='err'){clear();if(ws){ws.onclose=null;ws.close()}UI.error(m.msg)}
  else if(m.type==='room')GAME.room(m);else if(m.type==='s')GAME.snap(m);else if(m.type==='goal')GAME.goal(m);else if(m.type==='end')GAME.end(m);
  else if(m.type==='pong')ping=Math.round(performance.now()-m.t)}
 setInterval(()=>send({type:'ping',t:performance.now()}),2000);
 return{send,session:()=>sess,rejoin:()=>connect(rejoin),ping:()=>ping,
  create(o){training=!!o.training;connect(()=>send({type:'create',name:UI.name(),cfg:CFG,size:o.size,diff:o.diff}))},
  join(code){connect(()=>send({type:'join',code,name:UI.name(),cfg:CFG}))},
  leave(){send({type:'leave'});clear();if(ws){ws.onclose=null;ws.close()}}}})();
