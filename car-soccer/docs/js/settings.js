// Presets de qualidade (pr=resolução, sh=sombras, sp=holofotes, pf=fator de partículas, env=reflexos, crowd=torcida) e preferências salvas
const $=i=>document.getElementById(i),T=THREE;let vw='load';
const Q={low:{pr:1,sh:0,sp:0,pf:.3,env:0,crowd:350},medium:{pr:1,sh:0,sp:2,pf:.6,env:0,crowd:900},high:{pr:1.5,sh:1024,sp:4,pf:1,env:1,crowd:1800},ultra:{pr:2,sh:2048,sp:4,pf:1.4,env:1,crowd:3000}};
const ST=Object.assign({q:'high',vol:.7,cd:1},JSON.parse(localStorage.st||'{}')),QS=()=>Q[ST.q]||Q.high,saveST=()=>localStorage.st=JSON.stringify(ST);
let CFG=Object.assign({color:'#2d8cff',color2:'#ffffff',boost:'#ffb02e',bstyle:0,model:0,wheel:0,acc:1,decal:1,wcolor:'#dde3ee',finish:0,gfx:0},JSON.parse(localStorage.cfg||'{}'));
const PRE=JSON.parse(localStorage.pre||'[]');
