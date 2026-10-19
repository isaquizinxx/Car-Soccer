// IA dos bots: easy / normal / hard / expert (expert prevê a bola, mira o gol e faz aerials simples)
const {AX,clamp,wrap,rot}=require('../shared/physics');
const K={easy:.55,normal:.8,hard:1,expert:1},LEAD={easy:0,normal:0,hard:.25,expert:.5};
module.exports=function(r,c){
  const b=r.ball,dir=c.team?-1:1,lead=LEAD[r.diff]||0,d2=p=>(p.x-b.x)**2+(p.z-b.z)**2,
    near=r.players.filter(p=>p.team===c.team).reduce((a,p)=>d2(p)<d2(a)?p:a),
    bx=b.x+b.vx*lead,bz=b.z+b.vz*lead,hd=Math.hypot(b.x-c.x,b.z-c.z),air=c.y>1.2,adv=r.diff==='hard'||r.diff==='expert';
  let tx,tz;
  if(near===c){const ax=dir*AX-bx,az=-bz,l=Math.hypot(ax,az)||1;
    if((c.x-bx)*dir>0&&Math.abs(c.x-bx)>2){tx=bx-dir*9;tz=bz+(c.z>bz?8:-8)}else{tx=bx-ax/l*2.5;tz=bz-az/l*2.5}} // chega por trás da bola, mirando o gol
  else{tx=-dir*(AX-8)+(bx+dir*AX)*.25;tz=bz*.4}
  const ang=wrap(Math.atan2(tz-c.z,tx-c.x)-c.yaw),dist=Math.hypot(tx-c.x,tz-c.z),i={t:0,s:clamp(ang*2.5,-1,1),j:false,b:false,h:false};
  if(r.diff==='easy')i.s+=(Math.random()-.5)*.4;
  if(adv&&near===c&&air&&c.jc>=1&&b.y>c.y+1.5&&hd<30){ // aerial: inclina o nariz para a bola e usa boost
    i.t=clamp((Math.atan2(b.y-c.y,Math.max(hd,1))-Math.asin(rot(c,1,0,0)[1]))*4,-1,1);i.b=Math.abs(ang)<.5;i.j=hd<5&&c.jc===1&&!c.jp}
  else{
    i.t=(Math.abs(ang)<1.4?1:.2)*K[r.diff]*(dist<2?.3:1);
    i.b=r.diff!=='easy'&&near===c&&Math.abs(ang)<.3&&dist>14;
    i.j=adv&&near===c&&((b.y>5&&hd<18&&!air)||(hd<5&&b.y>2.5&&!air))&&!c.jp;
  }
  return i;
};
