# Car Soccer v0.3
    npm install && npm start        # http://localhost:3000  (PORT=xxxx para trocar; no Replit a porta vem de PORT)
    npm test                        # física (aerial, air roll, flip, drible, flick) + servidor (partidas reais, predição, bots)
    npm i three@0.128.0 --no-save && node server/test-client.js node_modules/three/build/three.min.js   # cliente sem navegador

## Controles
W/S acelerar/ré (no ar: inclinar nariz) · A/D direção (no ar: girar) · Espaço pular; 2x no ar = flip na direção do input (sem direção = pulo duplo)
Shift boost (no ar empurra na direção do nariz) · Q/E air roll · F freio de mão (derrapagem) · C câmera da bola · Esc menu

## Arquitetura
shared/physics.js  física do carro (quaternion 3D) usada pelo servidor E pela predição do cliente
server/            server.js (rede/salas) · physics.js (bola, hitbox orientada, pads, gols) · bot.js
client/js/         renderer (arena) · car · particles · camera · audio · network · ui · game (predição/reconciliação) · settings

## Qualidade gráfica
LOW/MEDIUM/HIGH/ULTRA só mudam resolução, sombras, holofotes, partículas, torcida e reflexos. Iluminação e tone mapping são idênticos
em todos. A resolução tem teto de ~2,6 MPixels e, se o contexto WebGL for perdido, o jogo reduz um nível sozinho e recarrega.
