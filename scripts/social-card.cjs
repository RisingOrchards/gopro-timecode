'use strict';
// MIT. Editable artwork from the existing logo and vendored QR encoder.
// PNGs are checked in. SVG generation needs no dependencies; --png optionally uses sharp.
const fs = require('node:fs');
const path = require('node:path');
const qrcode = require('../public/vendor/qrcode.js');
const root = path.resolve(__dirname, '..');
const sourceDir = path.join(root, 'docs/social');
const assetDir = path.join(root, 'public/assets');
const logo = fs.readFileSync(path.join(assetDir, 'igorbox-logo.png')).toString('base64');
const url = 'https://timecode.igorbox.com/';
const qr = qrcode(0, 'M');
qr.addData(url); qr.make();
const C = { bg:'#12130c', panel:'#1b2115', line:'#38472b', white:'#f8f9fa', muted:'#bec6b4', accent:'#8ac65d', brand:'#388f09' };
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
function text(x,y,size,value,{fill=C.white,weight=400,anchor='start',spacing=0}={}) {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}" text-anchor="${anchor}" letter-spacing="${spacing}">${escape(value)}</text>`;
}
const rect = (x,y,w,h,fill,r=0,stroke='none') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}"/>`;
const brand = (x,y,w) => `<image x="${x}" y="${y}" width="${w}" height="${w*175/921}" href="data:image/png;base64,${logo}"/>`;
function qrGraphic(centerX,y,scale) {
  const n=qr.getModuleCount(), size=(n+8)*scale, x=Math.round(centerX-size/2);
  let d='';
  for(let row=0;row<n;row++) for(let col=0;col<n;col++) if(qr.isDark(row,col)) {
    d+=`M${x+(col+4)*scale} ${y+(row+4)*scale}h${scale}v${scale}h-${scale}z`;
  }
  return rect(x,y,size,size,'#fff',10)+`<path d="${d}" fill="#000" shape-rendering="crispEdges"/>`;
}
function svg(w,h,body) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" role="img" aria-labelledby="title desc">
<title id="title">IgorBox Timecode — One reference. Every camera.</title>
<desc id="desc">Open-source timecode sync for GoPro MISSION 1. The QR opens ${url}; it is not a camera time command.</desc>
${rect(0,0,w,h,C.bg)}${body}
</svg>\n`;
}
const wide = svg(1200,630,
  rect(0,0,1200,118,'#000')+brand(56,37,236)+text(326,73,27,'/ Timecode',{fill:C.muted})+
  rect(922,44,222,34,C.panel,17,C.line)+text(1033,66,12,'OPEN SOURCE · MIT',{anchor:'middle',spacing:1.2})+
  rect(0,117,1200,1,C.line)+
  text(56,185,15,'GOPRO MISSION 1',{fill:C.accent,weight:700,spacing:2})+
  text(52,270,67,'One reference.',{weight:700,spacing:-2.5})+
  text(52,347,67,'Every camera.',{weight:700,spacing:-2.5})+
  text(56,403,24,'Simple, open-source timecode sync.',{fill:C.muted})+
  rect(56,438,151,36,C.panel,18,C.line)+text(131,462,15,'Device Clock',{anchor:'middle'})+
  rect(218,438,151,36,C.panel,18,C.line)+text(293,462,15,'Manual Jam',{anchor:'middle'})+
  text(56,560,28,'timecode.igorbox.com',{fill:C.accent,weight:700})+
  `<path d="M373 550h22m-9-9 10 9-10 9" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`+
  rect(786,159,358,421,C.panel,22,C.line)+
  `<circle cx="823" cy="195" r="4" fill="${C.brand}"/>`+
  text(840,200,13,'SCAN TO OPEN THE APP',{fill:C.muted,weight:700,spacing:1})+
  qrGraphic(965,227,7)+text(965,550,14,'IN YOUR BROWSER · NO ACCOUNT',{anchor:'middle',fill:C.muted,spacing:.7})
);
const square = svg(1080,1080,
  rect(0,0,1080,147,'#000')+brand(270,47,280)+text(578,90,30,'/ Timecode',{fill:C.muted})+
  rect(0,146,1080,1,C.line)+
  text(540,215,18,'GOPRO MISSION 1',{fill:C.accent,weight:700,anchor:'middle',spacing:2.5})+
  text(540,315,82,'One reference.',{weight:700,anchor:'middle',spacing:-3})+
  text(540,410,82,'Every camera.',{weight:700,anchor:'middle',spacing:-3})+
  text(540,468,27,'Simple, open-source timecode sync.',{fill:C.muted,anchor:'middle'})+
  text(540,512,20,'Device Clock  /  Manual Jam',{fill:C.muted,anchor:'middle'})+
  rect(336,549,408,389,C.panel,24,C.line)+
  text(540,583,14,'SCAN TO OPEN THE APP',{fill:C.muted,weight:700,anchor:'middle',spacing:1.3})+
  qrGraphic(540,607,8)+
  text(540,996,31,'timecode.igorbox.com',{fill:C.accent,weight:700,anchor:'middle'})+
  text(540,1040,15,'OPEN SOURCE · MIT · NO ACCOUNT',{fill:C.muted,anchor:'middle',spacing:1.2})
);
async function main() {
  fs.mkdirSync(sourceDir,{recursive:true});
  for(const [name,art] of [['og-image',wide],['share-card',square]]) {
    fs.writeFileSync(path.join(sourceDir,`${name}.svg`),art);
    if(process.argv.includes('--png')) {
      const sharp=require('sharp');
      await sharp(Buffer.from(art)).png().toFile(path.join(assetDir,`${name}.png`));
    }
  }
  console.log('Social artwork generated. QR destination: '+url);
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
