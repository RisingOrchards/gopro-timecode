/* IgorBox Timecode — MIT. Pure timing and GoPro payload functions. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IgorTime = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DAY = 86400000;
  const RATES = Object.freeze({
    '23.976': Object.freeze({ num: 24000, den: 1001, nominal: 24, label: '23.976 NDF' }),
    '24': Object.freeze({ num: 24, den: 1, nominal: 24, label: '24' }),
    '25': Object.freeze({ num: 25, den: 1, nominal: 25, label: '25' }),
    '29.97': Object.freeze({ num: 30000, den: 1001, nominal: 30, label: '29.97 NDF' }),
    '30': Object.freeze({ num: 30, den: 1, nominal: 30, label: '30' }),
    '50': Object.freeze({ num: 50, den: 1, nominal: 50, label: '50' }),
    '59.94': Object.freeze({ num: 60000, den: 1001, nominal: 60, label: '59.94 NDF' }),
    '60': Object.freeze({ num: 60, den: 1, nominal: 60, label: '60' })
  });
  // Capture cadence is independent of the reference timecode label base.
  const CAPTURE_RATES = Object.freeze({
    '23.976': 24000 / 1001, '24': 24, '25': 25, '29.97': 30000 / 1001,
    '30': 30, '50': 50, '59.94': 60000 / 1001, '60': 60,
    '100': 100, '119.88': 120000 / 1001, '120': 120,
    '200': 200, '239.76': 240000 / 1001, '240': 240
  });
  function captureRatio(captureKey, timecodeKey) {
    if (!Object.hasOwn(CAPTURE_RATES, captureKey)) throw new RangeError('Select a supported capture rate.');
    const r = rateFor(timecodeKey);
    return CAPTURE_RATES[captureKey] / (r.num / r.den);
  }
  const pad = (n, length = 2) => String(n).padStart(length, '0');
  const mod = (n, divisor) => ((n % divisor) + divisor) % divisor;
  function rateFor(key) {
    if (!Object.hasOwn(RATES, key)) throw new RangeError('Select a supported frame rate.');
    return RATES[key];
  }
  function numberIn(value, min, max, label, step = 1) {
    if (String(value).trim() === '') throw new RangeError(`${label} is required.`);
    const n = Number(value);
    if (!Number.isFinite(n) || n < min || n > max || Math.abs(n / step - Math.round(n / step)) > 1e-8)
      throw new RangeError(`${label} must be ${min} to ${max}, in steps of ${step}.`);
    return n;
  }
  // A fixed production UTC offset avoids unexpected DST changes within a jam session.
  function localParts(epochMs, zoneMinutes) {
    numberIn(zoneMinutes, -720, 840, 'UTC offset', 15);
    if (!Number.isFinite(epochMs)) throw new RangeError('Invalid clock reference.');
    const localMs = Math.floor(epochMs + zoneMinutes * 60000);
    const d = new Date(localMs);
    const year = d.getUTCFullYear();
    if (!(year >= 2000 && year <= 2099)) throw new RangeError('GoPro QR dates must be in 2000–2099.');
    return {
      year, month: d.getUTCMonth() + 1, day: d.getUTCDate(),
      hour: d.getUTCHours(), minute: d.getUTCMinutes(), second: d.getUTCSeconds(),
      millisecond: d.getUTCMilliseconds(), dayMs: mod(localMs, DAY),
      date: `${year}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`,
      dateIndex: Math.floor(localMs / DAY)
    };
  }
  function formatFrames(frames, key) {
    const r = rateFor(key);
    let f = mod(Math.floor(frames), r.nominal * 86400);
    const ff = f % r.nominal;
    f = Math.floor(f / r.nominal);
    return `${pad(Math.floor(f / 3600))}:${pad(Math.floor(f / 60) % 60)}:${pad(f % 60)}:${pad(ff)}`;
  }
  function timecode(epochMs, key, zoneMinutes) {
    const r = rateFor(key);
    // Integer rational arithmetic matches the GoPro TOD model without 29.97 rounding.
    const frames = Math.floor(localParts(epochMs, zoneMinutes).dayMs * r.num / (1000 * r.den));
    return formatFrames(frames, key);
  }
  function parseTimecode(text, key) {
    const r = rateFor(key);
    if (!/^\d{2}:\d{2}:\d{2}:\d{2}$/.test(text)) throw new RangeError('Enter HH:MM:SS:FF, using colons (NDF).');
    const [h, m, s, f] = text.split(':').map(Number);
    if (h > 23 || m > 59 || s > 59 || f >= r.nominal)
      throw new RangeError(`Use hours 00–23, minutes/seconds 00–59 and frames 00–${r.nominal - 1}.`);
    return ((h * 60 + m) * 60 + s) * r.nominal + f;
  }
  function dateMidnight(date, zoneMinutes) {
    if (!/^20\d{2}-\d{2}-\d{2}$/.test(date)) throw new RangeError('Choose a date in 2000–2099.');
    const [y, m, d] = date.split('-').map(Number);
    const epoch = Date.UTC(y, m - 1, d) - zoneMinutes * 60000;
    if (localParts(epoch, zoneMinutes).date !== date) throw new RangeError('Choose a valid date.');
    return epoch;
  }
  function epochForTimecode(date, text, key, zoneMinutes) {
    const r = rateFor(key);
    const frames = parseTimecode(text, key);
    // Ceil to an integer millisecond inside the requested frame, never one frame early.
    const ms = Math.ceil(frames * 1000 * r.den / r.num);
    if (ms >= DAY) throw new RangeError('This NDF value falls beyond the GoPro daily clock range. Match again after midnight; see the guide.');
    return dateMidnight(date, zoneMinutes) + ms;
  }
  function payload(epochMs, zoneMinutes) {
    const p = localParts(epochMs, zoneMinutes);
    // GoPro accepts integral hours or minutes. Offset includes DST; TD stays zero.
    const tz = zoneMinutes % 60 === 0 ? zoneMinutes / 60 : zoneMinutes;
    return `oT${pad(p.year - 2000)}${pad(p.month)}${pad(p.day)}${pad(p.hour)}${pad(p.minute)}${pad(p.second)}.${pad(p.millisecond, 3)}oTD0oTZ${tz}oTI0`;
  }
  function frameMs(key) { const r = rateFor(key); return 1000 * r.den / r.num; }
  function clockIssue({ wallNow, monoNow, wallBase, monoBase, lastMono }) {
    if (Math.abs((wallNow - wallBase) - (monoNow - monoBase)) > 250) return 'clock';
    if (lastMono != null && monoNow - lastMono > 200) return 'stall';
    return null;
  }
  return Object.freeze({ DAY, RATES, CAPTURE_RATES, captureRatio, pad, rateFor, numberIn, localParts, formatFrames,
    timecode, parseTimecode, dateMidnight, epochForTimecode, payload, frameMs, clockIssue });
});
