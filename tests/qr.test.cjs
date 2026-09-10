'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const QR = require('../public/qr.js');
const encoder = require('../public/vendor/qrcode.js');
const T = require('../public/core.js');
test('actual QR renderer reserves four white modules and accepts all timezone lengths', () => {
  for (let zone = -720; zone <= 840; zone += 15) {
    const rectangles = [];
    const ctx = { fillStyle: '', fillRect(x,y,w,h) { rectangles.push({ color: this.fillStyle, x,y,w,h }); } };
    const canvas = { width: 0, height: 0, getContext: () => ctx };
    QR.render(canvas,T.payload(Date.UTC(2026,8,9,13,0,0,125),zone),encoder);
    assert.equal(canvas.width,592);
    assert.deepEqual(rectangles[0],{color:'#fff',x:0,y:0,w:592,h:592});
    assert.ok(rectangles.length > 300);
    for (const r of rectangles.slice(1)) {
      assert.equal(r.color,'#000');
      assert.ok(r.x >= 64 && r.y >= 64 && r.x + r.w <= 528 && r.y + r.h <= 528);
    }
  }
});
