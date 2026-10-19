// Inicialização: loading, preview do carro, menu ou reconexão automática à sala anterior
window.onerror=(m,s,l)=>{$('lt').textContent='Erro: '+m+' ('+(s||'').split('/').pop()+':'+l+')'};
(function boot(){const steps=['Montando arena...','Criando carros...','Ligando os holofotes...','Pronto!'];let i=0;
 UI.init();GAME.preview();GAME.resize();requestAnimationFrame(GAME.frame);
 const t=setInterval(()=>{$('lb').style.width=(++i/steps.length*100)+'%';$('lt').textContent=steps[i-1];if(i===steps.length){clearInterval(t);setTimeout(()=>{UI.go('menu');if(NET.session())NET.rejoin()},300)}},250)})();
