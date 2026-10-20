// Interface: menu, jogar, garagem (preview 3D ao vivo), configurações, lobby, HUD, fim de partida
const UI=(()=>{const scr=['load','menu','play','garage','settings','lobby','hud','end'],OFF={menu:-.2,play:.2,garage:.2,settings:.2};
 const GOPT=[['color','Pintura','c'],['color2','Detalhe/decalque','c'],['boost','Cor do boost','c'],['bstyle','Estilo do boost','s',['Fogo','Plasma','Cometa']],['model','Carro','s',['Apex','Brute','Pixel']],
  ['wheel','Rodas','s',['Disco','5 Raios','Turbina']],['acc','Acessório','s',['Nenhum','Aerofólio','Asa GT','Antena']],['decal','Decalque','s',['Nenhum','Faixa central','Faixas laterais']],['finish','Acabamento','s',['Brilhante','Fosco','Metálico','Perolizado','Cromado']],['wcolor','Cor das rodas','c'],['gfx','Efeito de gol','s',['Explosão de energia','Onda de choque','Fragmentos de luz']]];
 const go=v=>{vw=v;scr.forEach(i=>$(i).classList.toggle('on',i===v));SC.offset(OFF[v]||0)};
 const name=()=>{const n=$('name').value.trim()||'Player';localStorage.nm=n;return n};
 function init(){
  $('name').value=localStorage.nm||'';$('qs').value=ST.q;$('vol').value=ST.vol;$('cd').value=ST.cd||1;$('cd').oninput=()=>{ST.cd=+$('cd').value;saveST()};
  $('qs').onchange=()=>{ST.q=$('qs').value;saveST();location.reload()};$('vol').oninput=()=>{ST.vol=+$('vol').value;saveST();A.vol(ST.vol)};
  const g=$('gopts');GOPT.forEach(([k,l,t,o])=>{const r=document.createElement('div');r.className='row';r.innerHTML='<label>'+l+'</label>'+(t==='c'?'<input type="color" id="g_'+k+'">':'<select id="g_'+k+'">'+o.map((x,i)=>'<option value="'+i+'">'+x+'</option>').join('')+'</select>');g.appendChild(r);
   const el=r.lastChild;el.value=CFG[k];el.oninput=el.onchange=()=>{CFG[k]=t==='c'?el.value:+el.value;localStorage.cfg=JSON.stringify(CFG);GAME.preview();A.ui()}});
  document.addEventListener('click',e=>{A.resume();if(e.target.closest('button'))A.ui()});
 }
 const sync=()=>GOPT.forEach(([k])=>$('g_'+k).value=CFG[k]);
 function lobby(r,me){$('code').textContent=r.code;$('lsize').value=r.size;$('ldiff').value=r.diff;const host=r.host===me;$('lsize').disabled=$('ldiff').disabled=!host;
  for(const tm of [0,1]){const l=r.players.filter(p=>p.team===tm);let h=l.map(p=>'<li><span class="dot" style="background:'+p.cfg.color+'"></span>'+p.name+(p.id===me?' (você)':'')+(p.id===r.host?' ★':'')+(p.ready?' ✔':'')+(p.off?' (desconectado)':'')+'</li>').join('');
   for(let i=l.length;i<r.size;i++)h+='<li class="dim">🤖 BOT (automático)</li>';$('t'+tm).innerHTML=h}
  const mine=r.players.find(p=>p.id===me);$('rdy').textContent=mine&&mine.ready?'CANCELAR':'PRONTO'}
 let bt='';
 return{go,name,init,lobby,presetSave(){PRE[+$('pre').value]=Object.assign({},CFG);localStorage.pre=JSON.stringify(PRE)},presetLoad(){const p=PRE[+$('pre').value];if(p){Object.assign(CFG,p);localStorage.cfg=JSON.stringify(CFG);sync();GAME.preview()}},
  create:()=>NET.create({size:+$('size').value,diff:$('diff').value}),join:()=>NET.join($('jc').value.toUpperCase()),training:()=>NET.create({size:1,diff:'normal',training:true}),
  leave(){NET.leave();GAME.reset();$('pause').classList.remove('on');go('menu')},settings:()=>NET.send({type:'settings',size:+$('lsize').value,diff:$('ldiff').value}),
  ready:()=>NET.send({type:'ready',v:!GAME.mine().ready}),pause(v){$('pause').classList.toggle('on',v===undefined?!$('pause').classList.contains('on'):!!v)},
  paused:()=>$('pause').classList.contains('on'),error(m){alert(m);go('menu')},
  banner(h){if(h!==bt){bt=h;const b=$('bn');b.innerHTML=h;b.style.transform='scale(1.25)';requestAnimationFrame(()=>b.style.transform='scale(1)')}},
  score(m){$('sa').textContent=m.sc[0];$('sb').textContent=m.sc[1];$('tm').textContent=m.time>0?Math.floor(m.time/60)+':'+String(m.time%60).padStart(2,'0'):'OT'},
  hud(boost,spd,ping,boosting){$('ring').style.strokeDashoffset=276.5*(1-boost/100);$('bo').textContent=boost|0;$('spd').textContent=(spd*3.6|0)+' km/h';$('png').textContent=ping+' ms';$('fxo').style.opacity=boosting?1:0},
  disc(t){$('dc').textContent=t},
  end(win,sc){go('end');$('res').textContent=win?'VITÓRIA!':'DERROTA';$('res').style.color=win?'#ffd23f':'#8a96b8';$('fin').textContent=sc[0]+' x '+sc[1]}}})();
