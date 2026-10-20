// Gera a pasta docs/ para o GitHub Pages: node scripts/build-pages.js wss://SEU-APP.onrender.com
const fs=require('fs'),path=require('path'),R=path.join(__dirname,'..'),url=process.argv[2]||'wss://SEU-APP.onrender.com',out=path.join(R,'docs');
fs.rmSync(out,{recursive:true,force:true});fs.cpSync(path.join(R,'client'),out,{recursive:true});fs.mkdirSync(path.join(out,'shared'));
fs.copyFileSync(path.join(R,'shared/physics.js'),path.join(out,'shared/physics.js'));
const f=path.join(out,'index.html');fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('src="/shared/physics.js"','src="shared/physics.js"'));
fs.writeFileSync(path.join(out,'config.js'),"// Endereço do servidor multiplayer (Render). Edite se mudar.\nwindow.SERVER_URL='"+url+"';\n");fs.writeFileSync(path.join(out,'.nojekyll'),'');console.log('docs/ gerado para',url)
