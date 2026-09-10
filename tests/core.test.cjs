'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const T = require('../public/core.js');
const midnight = Date.UTC(2026, 8, 9);

test('known precision-time payload and millisecond padding', () => {
  assert.equal(T.payload(midnight + 13 * 3600000 + 125, 0), 'oT260909130000.125oTD0oTZ0oTI0');
  assert.equal(T.payload(midnight + 9, 0), 'oT260909000000.009oTD0oTZ0oTI0');
});
test('timezone fields use local calendar time with unambiguous hour/minute forms', () => {
  assert.equal(T.payload(midnight, -240), 'oT260908200000.000oTD0oTZ-4oTI0');
  assert.equal(T.payload(midnight, 330), 'oT260909053000.000oTD0oTZ330oTI0');
  assert.equal(T.payload(midnight, 345), 'oT260909054500.000oTD0oTZ345oTI0');
  assert.equal(T.payload(midnight, -210), 'oT260908203000.000oTD0oTZ-210oTI0');
  assert.equal(T.payload(midnight, 840), 'oT260909140000.000oTD0oTZ14oTI0');
});
test('positive and negative offsets roll dates and years correctly', () => {
  assert.equal(T.payload(Date.UTC(2026, 11, 31, 23, 59, 59, 990) + 20, 0), 'oT270101000000.010oTD0oTZ0oTI0');
  assert.equal(T.payload(Date.UTC(2026, 0, 1) - 1, 0), 'oT251231235959.999oTD0oTZ0oTI0');
  assert.equal(T.localParts(Date.UTC(2028, 1, 29), 0).date, '2028-02-29');
});
test('rational NDF conversion differs from integer rates at one real hour', () => {
  for (const key of ['24','25','30','50','60']) assert.equal(T.timecode(midnight + 3600000, key, 0), '01:00:00:00');
  assert.equal(T.timecode(midnight + 3600000, '23.976', 0), '00:59:56:09');
  assert.equal(T.timecode(midnight + 3600000, '29.97', 0), '00:59:56:12');
  assert.equal(T.timecode(midnight + 3603600, '29.97', 0), '01:00:00:00');
});
test('NDF frame transitions use 1001/30000 duration', () => {
  assert.equal(T.timecode(midnight + 33, '29.97', 0), '00:00:00:00');
  assert.equal(T.timecode(midnight + 34, '29.97', 0), '00:00:00:01');
  assert.equal(T.timecode(midnight + 1000, '29.97', 0), '00:00:00:29');
  assert.equal(T.timecode(midnight + 1001, '29.97', 0), '00:00:01:00');
});
test('manual timecode maps to the corresponding QR clock, including fractional frame starts', () => {
  assert.equal(T.epochForTimecode('2026-09-09', '01:00:00:00', '29.97', 0), midnight + 3603600);
  assert.equal(T.epochForTimecode('2026-09-09', '00:00:00:01', '29.97', 0), midnight + 34);
  assert.equal(T.epochForTimecode('2026-09-09', '12:00:00:00', '25', 330), midnight + 6.5 * 3600000);
});
test('manual inverse stays in the requested frame across all rates', () => {
  for (const key of Object.keys(T.RATES)) {
    for (let frames = 0; frames < T.RATES[key].nominal * 85000; frames += 1987) {
      const label = T.formatFrames(frames, key);
      const epoch = T.epochForTimecode('2026-09-09', label, key, -240);
      assert.equal(T.timecode(epoch, key, -240), label, `${key} ${label}`);
    }
  }
});
test('unsupported rates, DF notation, invalid dates and out-of-range frames are rejected', () => {
  for (const key of ['29.97 DF','59.94 DF','120','toString']) assert.throws(() => T.rateFor(key));
  for (const tc of ['24:00:00:00','12:60:00:00','12:00:60:00','12:00:00:24','12:00:00;00','1:00:00:00',''])
    assert.throws(() => T.parseTimecode(tc, '24'));
  for (const date of ['2026-02-29','2026-13-01','1999-01-01','2100-01-01'])
    assert.throws(() => T.dateMidnight(date, 0));
  for (const n of ['', 'NaN','Infinity','1e99','0.0001']) assert.throws(() => T.numberIn(n, -1000, 1000, 'Offset', .001));
});
test('daily NDF reset is explicit and unreachable manual labels are rejected', () => {
  assert.equal(T.timecode(midnight + T.DAY - 1, '29.97', 0), '23:58:33:20');
  assert.equal(T.timecode(midnight + T.DAY, '29.97', 0), '00:00:00:00');
  assert.throws(() => T.epochForTimecode('2026-09-09','23:58:33:21','29.97',0), /daily clock range/);
  assert.throws(() => T.epochForTimecode('2026-09-09','23:59:59:23','23.976',0), /daily clock range/);
  assert.doesNotThrow(() => T.epochForTimecode('2026-09-09','23:59:59:29','30',0));
});
test('frame durations, wall clock jumps and stalled display are distinguished', () => {
  assert.equal(T.frameMs('29.97'), 1001 / 30);
  assert.equal(T.frameMs('23.976'), 1001 / 24);
  const base = { wallBase: 50000, monoBase: 1000, lastMono: 1000 };
  assert.equal(T.clockIssue({ ...base, wallNow: 50016, monoNow: 1016 }), null);
  assert.equal(T.clockIssue({ ...base, wallNow: 49700, monoNow: 1016 }), 'clock');
  assert.equal(T.clockIssue({ ...base, wallNow: 50500, monoNow: 1500 }), 'stall');
});
test('60 and 59.94 support high frame labels with distinct clocks and durations', () => {
  assert.equal(T.frameMs('60'),1000/60);
  assert.equal(T.frameMs('59.94'),1001/60);
  assert.equal(T.timecode(midnight+999,'60',0),'00:00:00:59');
  assert.equal(T.timecode(midnight+1000,'60',0),'00:00:01:00');
  assert.equal(T.timecode(midnight+1000,'59.94',0),'00:00:00:59');
  assert.equal(T.timecode(midnight+1001,'59.94',0),'00:00:01:00');
  assert.equal(T.timecode(midnight+3600000,'59.94',0),'00:59:56:24');
  assert.equal(T.epochForTimecode('2026-09-09','01:00:00:00','59.94',0),midnight+3603600);
  assert.equal(T.timecode(midnight+T.DAY-1,'59.94',0),'23:58:33:41');
  assert.throws(()=>T.epochForTimecode('2026-09-09','23:58:33:42','59.94',0),/daily clock range/);
  assert.throws(()=>T.parseTimecode('12:00:00:60','60'));
});
test('all capture modes through 240 are distinct from timecode label rates', () => {
  for (const key of ['24','25','30','50','60','100','120','200','240']) assert.equal(T.CAPTURE_RATES[key],Number(key));
  assert.equal(T.captureRatio('240','60'),4);
  assert.equal(T.captureRatio('239.76','59.94'),4);
  assert.equal(T.captureRatio('119.88','29.97'),4);
  assert.equal(T.captureRatio('200','50'),4);
  assert.throws(()=>T.rateFor('240'));
  assert.throws(()=>T.captureRatio('960','60'));
});
