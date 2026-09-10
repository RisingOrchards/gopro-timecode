'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const publicDir = path.join(root, 'public');
for (const name of ['index.html','guide.html']) {
  const html = fs.readFileSync(path.join(publicDir,name),'utf8');
  assert.ok(html.includes('lang="en"') && html.includes('name="viewport"'));
  for (const [, link] of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
    if (/^(https?:|data:)/.test(link)) continue;
    const file = path.resolve(publicDir, link.split('#')[0]);
    assert.ok(fs.existsSync(file),`${name}: missing ${link}`);
  }
}
for (const name of ['app.js','core.js','qr.js','vendor/qrcode.js']) new vm.Script(fs.readFileSync(path.join(publicDir,name),'utf8'),{filename:name});
const checksum = crypto.createHash('sha256').update(fs.readFileSync(path.join(publicDir,'vendor/qrcode.js'))).digest('hex');
assert.equal(checksum,'18ae399f81182bc9de916e9c77b195df20cc58d6f2d55a62b085a299f1bf1780','Vendored QR encoder changed');
for (const name of ['LICENSE','THIRD_PARTY_NOTICES.md','public/vendor/qrcode.LICENSE']) assert.ok(fs.readFileSync(path.join(root,name),'utf8').includes('MIT'));
console.log('Static site verified: links, syntax, encoder checksum and license notices. Deploy public/.');
