'use strict';
// Deterministic event/clock tests without adding a DOM or browser dependency.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const T = require('../public/core.js');
function fixture() {
  const items = new Map(), handlers = {}, docHandlers = {}, frames = [];
  let mono = 1000, wall = Date.UTC(2026,8,9,12), lastPayload = '', renders = 0, failRender = false;
  function element(id) {
    if (!items.has(id)) {
      const classes = new Set(), listeners = {};
      items.set(id, { id, value: '', textContent: '', hidden: false, disabled: false,
        width: 592, height: 592, listeners,
        classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x), toggle: (x,on) => on ? classes.add(x) : classes.delete(x) },
        append() {}, addEventListener: (key, fn) => { listeners[key] = fn; },
        getContext: () => ({ clearRect() {} }) });
    }
    return items.get(id);
  }
  element('rate').value = '30'; element('capture-rate').value = '30'; element('source').value = 'device'; element('offset').value = '0';
  element('qr').hidden = true;
  const doc = { hidden: false, getElementById: element, createElement: () => ({ value: '', textContent: '' }), addEventListener: (k,fn) => { docHandlers[k] = fn; } };
  class FakeDate extends Date { constructor(...args) { super(...(args.length ? args : [wall])); } static now() { return wall; } }
  const win = { IgorTime: T, qrcode() {}, IgorQR: { render(canvas, payload) { if (failRender) throw new Error('Encoder failed'); lastPayload = payload; renders++; } }, addEventListener: (k,fn) => { handlers[k] = fn; } };
  const context = vm.createContext({ window: win, document: doc, navigator: {}, Date: FakeDate,
    performance: { now: () => mono }, requestAnimationFrame: fn => frames.push(fn) });
  vm.runInContext(fs.readFileSync(require.resolve('../public/app.js'), 'utf8'), context);
  return { el: element, doc, context,
    event(id, key = 'click') { element(id).listeners[key]?.({ preventDefault() {} }); },
    windowEvent(key, value = {}) { handlers[key]?.(value); },
    hide() { doc.hidden = true; docHandlers.visibilitychange(); },
    show() { doc.hidden = false; docHandlers.visibilitychange(); },
    step(ms = 17, wallMs = ms) { mono += ms; wall += wallMs; frames.shift()(); },
    live() { element('toggle').listeners.click(); for (let i = 0; i < 4; i++) this.step(); },
    fail() { failRender = true; }, get payload() { return lastPayload; }, get renders() { return renders; }, get wallTime() { return wall; }
  };
}
test('QR starts hidden, animates fresh timestamps, and disappears on pause', () => {
  const f = fixture(); assert.equal(f.el('qr').hidden, true);
  f.live(); assert.equal(f.el('qr').hidden, false);
  const first = f.payload; f.step(); assert.notEqual(f.payload, first);
  f.event('toggle'); assert.equal(f.el('qr').hidden, true);
  assert.match(f.el('payload').textContent, /QR off/);
  const count = f.renders; f.step(); assert.equal(f.renders, count);
});
test('editing a rate hides QR and requires an explicit new reference', () => {
  const f = fixture(); f.el('source').value = 'manual'; f.el('reference-tc').value = '12:00:00:00';
  f.event('source','input'); f.event('reference-form','submit'); f.live();
  f.el('rate').value = '25'; f.event('rate','input');
  assert.equal(f.el('qr').hidden, true); assert.equal(f.el('toggle').disabled, true);
  f.event('reference-form','submit'); assert.equal(f.el('toggle').disabled, false);
  assert.equal(f.el('rate-label').textContent, '25');
});
test('backgrounding and returning cannot silently revive a stale QR', () => {
  const f = fixture(); f.live(); f.hide(); f.show(); f.step(5000);
  assert.equal(f.el('qr').hidden, true); assert.equal(f.el('toggle').disabled, true);
  f.event('toggle'); f.step(); assert.equal(f.el('qr').hidden, true);
  f.event('reference-form','submit'); f.live(); assert.equal(f.el('qr').hidden, false);
});
test('clock jumps, long stalls and back/forward restores require reference reset', () => {
  for (const mode of ['clock','stall','restore']) {
    const f = fixture(); f.live();
    if (mode === 'clock') f.step(17,1000);
    if (mode === 'stall') f.step(300);
    if (mode === 'restore') f.windowEvent('pageshow',{persisted:true});
    assert.equal(f.el('qr').hidden,true,mode); assert.equal(f.el('toggle').disabled,true,mode);
  }
});
test('invalid manual entry cannot preserve a live code', () => {
  const f = fixture(); f.live();
  f.el('source').value = 'manual'; f.event('source','input');
  f.el('reference-tc').value = '12:00:00;00'; f.event('reference-form','submit');
  assert.equal(f.el('qr').hidden,true); assert.equal(f.el('toggle').disabled,true);
  assert.match(f.el('reference-status').textContent,/colons/);
});
test('manual matching survives frame advancement but stops at QR date rollover', () => {
  const f = fixture(); f.el('source').value='manual'; f.el('rate').value='30'; f.event('source','input');
  f.el('reference-date').value='2026-09-09'; f.el('reference-tc').value='23:59:59:29';
  f.event('reference-form','submit');
  assert.equal(f.el('timecode').textContent,'23:59:59:29');
  f.step(50); assert.equal(f.el('toggle').disabled,true);
  assert.match(f.el('reference-status').textContent,/Midnight/);
});
test('encoder errors hide QR and print mode never leaves a scannable code', () => {
  const f = fixture(); f.live(); f.fail(); f.step();
  assert.equal(f.el('qr').hidden,true); assert.equal(f.el('toggle').disabled,true);
  const p = fixture(); p.live(); p.windowEvent('beforeprint'); assert.equal(p.el('qr').hidden,true);
});
test('240 fps capture keeps the independently selected 60 fps timecode reference', () => {
  const f = fixture(); f.el('source').value = 'manual'; f.el('rate').value = '60';
  f.el('reference-tc').value = '12:00:00:00'; f.event('source','input');
  f.el('capture-rate').value = '240'; f.event('capture-rate','input');
  f.event('reference-form','submit');
  assert.equal(f.el('rate').value,'60');
  assert.equal(f.el('rate-label').textContent,'60');
  assert.match(f.el('capture-note').textContent,/4 capture frames per timecode frame/);
  f.live(); assert.equal(f.el('qr').hidden,false);
});

test('Device Clock uses 30 fps and ignores the hidden Jam rate when switching back', () => {
  const f = fixture();
  assert.equal(f.el('manual-fields').hidden, true);
  assert.equal(f.el('rate').disabled, true);
  assert.equal(f.el('rate-label').textContent, '30');
  f.el('source').value = 'manual'; f.event('source','input');
  assert.equal(f.el('manual-fields').hidden, false);
  assert.equal(f.el('rate').disabled, false);
  f.el('rate').value = '59.94'; f.el('reference-tc').value = '01:00:00:00';
  f.event('reference-form','submit');
  assert.equal(f.el('rate-label').textContent, '59.94 NDF');
  assert.equal(f.el('timecode').textContent, '01:00:00:00');
  f.live();
  f.el('source').value = 'device'; f.event('source','input');
  assert.equal(f.el('manual-fields').hidden, true);
  assert.equal(f.el('rate').disabled, true);
  assert.equal(f.el('toggle').disabled, false);
  assert.equal(f.el('qr').hidden, true);
  assert.equal(f.el('rate-label').textContent, '30');
  assert.equal(f.el('timecode').textContent, T.timecode(f.wallTime, '30', Number(f.el('zone').value)));
  f.step(100);
  assert.equal(f.el('timecode').textContent, T.timecode(f.wallTime, '30', Number(f.el('zone').value)));
  f.event('plus-frame');
  assert.equal(f.el('offset').value, '33.333');
});

test('returning from an invalid Jam entry immediately restores Device Clock', () => {
  const f = fixture(); f.el('source').value = 'manual'; f.event('source','input');
  f.el('reference-tc').value = 'not timecode'; f.event('reference-form','submit');
  assert.equal(f.el('toggle').disabled, true);
  f.el('source').value = 'device'; f.event('source','input');
  assert.equal(f.el('toggle').disabled, false);
  assert.equal(f.el('reference-status').classList.contains('error'), false);
  assert.equal(f.el('timecode').textContent, T.timecode(f.wallTime, '30', Number(f.el('zone').value)));
});
