'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../public/settings-capabilities.js');
const P = require('../public/settings-presets.js');
const G = require('../public/settings-core.js');
const QR = require('../public/qr.js');
const encoder = require('../public/vendor/qrcode.js');
const pro = 'mission-1-pro';
const blank = () => ({ ...P.resolve('custom', pro), resolution: null, frameRate: null });

test('starter commands match independently specified MISSION command fixtures', () => {
  const expected = {
    cinema: 'mVr8p24e0d1hH0cLbHw55i4s180sL',
    run: 'mVr8p24e1d1hH0cLbHwAi16s0sL',
    live: 'mVr4p24e0d1hH0cNbHw55i8s180sL',
    slow: 'mVr4p60e0d1hH0cLbHw55i8s180sL',
    high: 'mVr4p120e0d1hH0cLbHw55i16s180sL',
    custom: 'mVr8p24'
  };
  for (const [id, command] of Object.entries(expected)) assert.equal(G.buildGoProCommand(P.resolve(id, pro), pro), command);
});
test('documented tokens preserve case, EV decimal spelling and ISO range/fixed meanings', () => {
  // Official command language example: mVr4p60x-.5cFw55$BITR=150$LEVL=6.
  // This builder deliberately excludes the BITR/LEVL extensions and orders color before EV.
  assert.equal(G.buildGoProCommand({ ...blank(), resolution: '4k', frameRate: '60', ev: '-0.5', colorProfile: 'flat', whiteBalance: '5500' }, pro), 'mVr4p60hH0cFw55x-.5');
  assert.equal(G.buildGoProCommand({ ...blank(), isoMode: 'range', isoMax: '400' }, pro), 'mVi4');
  assert.equal(G.buildGoProCommand({ ...blank(), isoMode: 'fixed', isoMax: '400' }, pro), 'mVi4M4');
  assert.equal(G.buildGoProCommand({ ...blank(), denoise: 'low', sharpness: 'low' }, pro), 'mVsLdL');
});
test('every preset resolves without mutation for all three camera models', () => {
  for (const model of Object.keys(C.models)) for (const id of Object.keys(P.definitions)) {
    const first = P.resolve(id, model), second = P.resolve(id, model);
    assert.deepEqual(G.validate(first, model), []);
    assert.ok(['8k', '4k'].includes(first.resolution), id + ' must default to 16:9 on ' + model);
    assert.ok(G.buildGoProCommand(first, model).startsWith('mV'));
    first.whiteBalance = 'auto';
    assert.deepEqual(second, P.resolve(id, model));
  }
  assert.equal(P.resolve('cinema', 'mission-1').resolution, '8k');
  assert.equal(P.resolve('run', 'mission-1-pro-ils').stabilization, 'off');
});
test('documented resolution/rate boundaries differ between MISSION and PRO', () => {
  const fixture = (resolution, frameRate) => ({ ...blank(), resolution, frameRate });
  assert.throws(() => G.buildGoProCommand(fixture('8k-open', '60'), pro), /combination/);
  assert.throws(() => G.buildGoProCommand(fixture('8k-open', '24'), 'mission-1'), /combination/);
  assert.throws(() => G.buildGoProCommand(fixture('8k', '60'), 'mission-1'), /combination/);
  assert.throws(() => G.buildGoProCommand(fixture('4k', '240'), 'mission-1'), /combination/);
  assert.throws(() => G.buildGoProCommand(fixture('4k-open', '240'), pro), /combination/);
  assert.throws(() => G.buildGoProCommand(fixture('4k-vertical', '60'), pro), /combination/);
  assert.equal(G.buildGoProCommand(fixture('4k', '240'), pro), 'mVr4p240');
  assert.equal(G.buildGoProCommand(fixture('1080', '240'), 'mission-1'), 'mVr1p240');
  assert.equal(G.buildGoProCommand(fixture('8k', '60'), pro), 'mVr8p60');
});

test('Cinema, Run & Gun and Custom follow every supported target without changing it', () => {
  for (const [model, camera] of Object.entries(C.models)) {
    for (const [resolution, rates] of Object.entries(camera.modes)) for (const frameRate of rates) {
      const target = Object.freeze({ resolution, frameRate });
      for (const id of ['cinema', 'run', 'custom']) {
        const settings = P.resolve(id, model, target);
        assert.equal(settings.resolution, resolution);
        assert.equal(settings.frameRate, frameRate);
        assert.deepEqual(G.validate(settings, model), [], model + ' ' + id + ' ' + resolution + '/' + frameRate);
      }
    }
  }
  assert.equal(G.buildGoProCommand(P.resolve('run', pro, { resolution: '4k', frameRate: '30' }), pro), 'mVr4p30e1d1hH0cLbHwAi16s0sL');
  assert.equal(G.buildGoProCommand(P.resolve('cinema', pro, { resolution: '4k', frameRate: '30' }), pro), 'mVr4p30e0d1hH0cLbHw55i4s180sL');
  assert.equal(G.buildGoProCommand(P.resolve('custom', pro, { resolution: '4k', frameRate: '30' }), pro), 'mVr4p30');
});

test('special presets keep explicit capture overrides; unsupported normal targets are not downgraded', () => {
  const target = { resolution: '8k', frameRate: '60' };
  assert.equal(G.buildGoProCommand(P.resolve('slow', 'mission-1', target), 'mission-1'), 'mVr4p60e0d1hH0cLbHw55i8s180sL');
  assert.equal(G.buildGoProCommand(P.resolve('high', 'mission-1', target), 'mission-1'), 'mVr4p120e0d1hH0cLbHw55i16s180sL');
  assert.throws(() => G.buildGoProCommand(P.resolve('cinema', 'mission-1', target), 'mission-1'), /combination/);
  assert.equal(P.resolve('run', pro, { resolution: '4k', frameRate: '120' }).stabilization, 'off');
  assert.equal(P.resolve('run', pro, { resolution: '8k-open', frameRate: '24' }).stabilization, 'off');
  assert.deepEqual(target, { resolution: '8k', frameRate: '60' });
});

test('Streaming / Live keeps 4K, follows target rates through 60 and emits capture settings only', () => {
  for (const model of Object.keys(C.models)) for (const frameRate of ['24', '25', '30', '50', '60', '100', '120', '200', '240']) {
    const target = Object.freeze({ resolution: '8k', frameRate });
    const settings = P.resolve('live', model, target);
    const actualRate = Number(frameRate) > 60 ? '60' : frameRate;
    assert.equal(G.buildGoProCommand(settings, model), 'mVr4p' + actualRate + 'e0d1hH0cNbHw55i8s180sL');
    assert.deepEqual(G.decodeState(G.encodeState(settings, model, target, 'live')), { model, settings, target, preset: 'live' });
  }
  const live = P.resolve('live', pro, { resolution: '4k-open', frameRate: '30' });
  assert.equal(live.resolution, '4k');
  assert.equal(G.buildGoProCommand({ ...live, colorProfile: 'log2' }, pro), 'mVr4p30e0d1hH0cLbHw55i8s180sL');
  assert.equal(P.resolve('live', pro).colorProfile, 'natural');
});
test('incomplete selections, GP-Log2 in 8-bit and unverified features are rejected', () => {
  const invalid = [
    { resolution: '8k' }, { frameRate: '60' }, { colorProfile: 'log2' },
    { colorProfile: 'log2', bitDepth: '8' }, { whiteBalance: '5600' },
    { bitrate: 'max' }, { frameRate: '480', resolution: '1080' },
    { isoMin: '100' }, { isoMax: '400' }, { isoMode: 'fixed' },
    { shutter: '1/48' }, { shutter: '11' }, { shutter: '180' }, { mode: 'burst' }
  ];
  for (const value of invalid) assert.throws(() => G.buildGoProCommand({ ...blank(), ...value }, pro));
  assert.throws(() => G.buildGoProCommand(blank(), 'hero13'), /model/);
  assert.throws(() => G.buildGoProCommand({ ...blank(), resolution: 'toString', frameRate: '24' }, pro), /Unsupported/);
});
test('shutter limits and EV interactions reject combinations the tool cannot represent', () => {
  const high = P.resolve('high', pro);
  // 22 degrees at 240 fps is about 1/3927, still within the 1/7680 limit.
  assert.doesNotThrow(() => G.buildGoProCommand({ ...high, frameRate: '240', shutter: '22' }, pro));
  assert.throws(() => G.buildGoProCommand({ ...high, ev: '0' }, pro), /EV compensation/);
  assert.equal(G.buildGoProCommand({ ...high, shutter: 'auto', ev: '-0.5' }, pro), 'mVr4p120e0d1hH0cLbHw55i16s0x-.5sL');
  assert.match(G.shutterHint(P.resolve('cinema', pro)), /1\/48/);
  assert.match(G.shutterHint(P.resolve('slow', pro)), /1\/120/);
  assert.match(G.shutterHint(high), /1\/240/);
});
test('stabilization coverage and ILS lens confirmation are checked by the builder', () => {
  assert.throws(() => G.buildGoProCommand({ ...P.resolve('cinema', pro), resolution: '8k-open', stabilization: 'on' }, pro), /not been verified/);
  assert.throws(() => G.buildGoProCommand({ ...P.resolve('high', pro), stabilization: 'auto' }, pro), /not been verified/);
  assert.throws(() => G.buildGoProCommand(P.resolve('run', pro), 'mission-1-pro-ils'), /supported for HyperSmooth/);
  assert.equal(G.buildGoProCommand({ ...P.resolve('run', pro), ilsLens: true }, 'mission-1-pro-ils'), 'mVr8p24e1d1hH0cLbHwAi16s0sL');
});
test('editing each preset field changes only its corresponding command component', () => {
  const base = P.resolve('cinema', pro);
  const changes = { resolution: '4k', frameRate: '25', whiteBalance: '3200', shutter: '90', isoMax: '800', isoMode: 'fixed', bitrate: 'standard', colorProfile: 'natural', sharpness: 'high', denoise: 'low' };
  const original = G.components(base, pro);
  for (const [field, value] of Object.entries(changes)) {
    const component = field.startsWith('iso') ? 'iso' : field;
    const result = G.components({ ...base, [field]: value }, pro);
    assert.deepEqual(result.filter(part => part.field !== component), original.filter(part => part.field !== component), field);
    assert.notDeepEqual(result.find(part => part.field === component), original.find(part => part.field === component), field);
  }
  assert.equal(P.resolve('cinema', pro).whiteBalance, '5500');
});
test('Photo emits only explicitly supported controls and never video settings or capture actions', () => {
  const photo = { ...blank(), mode: 'photo', rawPhoto: 'on', whiteBalance: '5500', ev: '0.5' };
  assert.equal(G.buildGoProCommand(photo, pro), 'mPrw55x.5');
  assert.equal(G.buildGoProCommand({ ...photo, rawPhoto: 'off' }, pro), 'mPr0w55x.5');
  assert.throws(() => G.buildGoProCommand({ ...photo, resolution: '4k' }, pro), /Photo mode/);
  assert.throws(() => G.buildGoProCommand({ ...photo, shutter: '180' }, pro), /Photo mode/);
  assert.throws(() => G.buildGoProCommand({ ...blank(), rawPhoto: 'on' }, pro), /Photo mode/);
});
test('stored form data is versioned and validated; command injection is rejected', () => {
  const settings = P.resolve('cinema', pro);
  assert.deepEqual(G.decodeState(G.encodeState(settings, pro)), { settings, model: pro, target: P.defaultTarget, preset: 'custom' });
  for (const input of ['', 'null', '[]', '{}', '{"version":2}', 'x'.repeat(6001)]) assert.throws(() => G.decodeState(input));
  for (const field of Object.keys(C.options)) assert.throws(() => G.buildGoProCommand({ ...settings, [field]: 'mV!FORMAT' }, pro));
  assert.throws(() => G.buildGoProCommand(JSON.parse('{"mode":"video","__proto__":{"polluted":true}}'), pro), /Unknown setting/);
});

test('stored targets and preset overrides survive reload; legacy forms migrate without changing capture settings', () => {
  const target = { resolution: '4k', frameRate: '30' }, settings = P.resolve('slow', pro, target);
  assert.deepEqual(G.decodeState(G.encodeState(settings, pro, target, 'slow')), { model: pro, settings, target, preset: 'slow' });
  const legacy = P.resolve('cinema', pro, target);
  assert.deepEqual(G.decodeState(JSON.stringify({ version: 1, model: pro, settings: legacy })), { model: pro, settings: legacy, target, preset: 'custom' });
  const photo = { ...blank(), mode: 'photo' };
  assert.deepEqual(G.decodeState(JSON.stringify({ version: 1, model: pro, settings: photo })).target, P.defaultTarget);
  for (const bad of [null, [], {}, { resolution: '4k' }, { resolution: '4k', frameRate: 30 }, { resolution: '!FORMAT', frameRate: '24' }, { ...target, extra: true }]) {
    assert.throws(() => P.resolve('cinema', pro, bad), /target/);
    assert.throws(() => G.decodeState(JSON.stringify({ version: 2, model: pro, settings, target: bad, preset: 'slow' })), /target/);
  }
  assert.throws(() => G.decodeState(JSON.stringify({ version: 2, model: pro, settings, target, preset: '!FORMAT' })), /preset/);
});
test('settings QR uses automatic sizing with four white modules even for long commands', () => {
  const command = G.buildGoProCommand({ ...P.resolve('run', pro), shutter: 'auto', isoMax: '6400', isoMode: 'fixed', whiteBalance: '6500', ev: '-1.5', denoise: 'medium', frameRate: '60' }, pro);
  const rectangles = [];
  const ctx = { fillStyle: '', fillRect(x, y, w, h) { rectangles.push({ color: this.fillStyle, x, y, w, h }); } };
  const canvas = { width: 0, height: 0, getContext: () => ctx };
  QR.render(canvas, command, encoder, 0);
  assert.ok(canvas.width >= 592);
  assert.equal(canvas.height, canvas.width);
  assert.equal(rectangles[0].color, '#fff');
  for (const rect of rectangles.slice(1)) assert.ok(rect.x >= 64 && rect.y >= 64 && rect.x + rect.w <= canvas.width - 64 && rect.y + rect.h <= canvas.height - 64);
});
