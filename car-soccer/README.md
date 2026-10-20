# Car Soccer v0.4
    npm install && npm start        # http://localhost:3000  (PORT=xxxx para trocar; no Render a porta vem de PORT)
    npm test                        # física (carros, bola, colisões, arenas 1v1-4v4) + servidor (partidas reais, predição, bots)
    npm i three@0.128.0 --no-save && node server/test-client.js node_modules/three/build/three.min.js   # cliente sem navegador
    npm run pages                   # gera docs/ para o GitHub Pages (opcional: node scripts/build-pages.js wss://SEU-APP.onrender.com)

## Controles
W/S acelerar/ré (no ar: inclinar o nariz) · A/D direção (no ar: girar) · Espaço pular; 2x no ar = flip na direção do input (sem direção = pulo duplo)
Shift boost (no ar empurra na direção do nariz) · Q/E air roll · F freio de mão (powerslide) · C câmera da bola · Esc menu

## Física (ajustável)
Todos os parâmetros ficam em `shared/physics.js` (objeto PHYS) e as dimensões das arenas em `arena(n)`. Servidor e cliente usam o MESMO arquivo.
Arenas por modo: 1v1 80x52 · 2v2 100x65 · 3v3 120x78 · 4v4 140x91 (comprimento x largura; gols, pads, spawns e limites acompanham).
Servidor: passo fixo de 1/60 s com acumulador (máx. 5 passos por volta), snapshots a 30 Hz, bola com subpassos quando algo passa de 30 m/s.
Modo de depuração: abra o jogo com `?debug` no endereço (fps, ping, velocidade, saltos, flip, spin da bola).

## Publicação
- Servidor (Render): Root Directory `car-soccer` se o repositório tiver a pasta; Build `npm install`; Start `npm start`.
- Cliente (GitHub Pages): suba a pasta `docs/` na RAIZ do repositório e configure Pages em /docs. **Edite `docs/config.js`**
  com o endereço do servidor (`wss://...onrender.com`). Se você re-enviar a pasta `docs`, o config.js volta ao exemplo: edite de novo.

## Arquitetura
shared/physics.js  física do carro (quaternion 3D), parâmetros e arenas, usada pelo servidor E pela predição do cliente
server/            server.js (rede/salas/loop) · physics.js (bola com spin, hitbox, subpassos, pads, gols) · bot.js
client/js/         renderer (arena reconstruída por modo) · car · particles · camera · audio · network · ui · game (predição) · debug
