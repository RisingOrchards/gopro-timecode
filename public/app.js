/* IgorBox Timecode — MIT. No network calls, storage, or external timecode connection. */
(function () {
  'use strict';
  const T = window.IgorTime;
  const $ = id => document.getElementById(id);
  const el = Object.fromEntries(['rate','capture-rate','capture-note','source','zone','offset','reference-form','manual-fields',
    'reference-date','reference-tc','apply','reference-status','frame-length','rate-note','rate-label',
    'timecode','clock-detail','qr','qr-placeholder','placeholder-title','placeholder-text','signal',
    'scan-status','toggle','fullscreen','jam-panel','refresh-rate','wake-status','payload'].map(id => [id, $(id)]));
  let reference = null, valid = false, active = false, lastMono = null;
  let warmup = 0, refreshCount = 0, refreshStart = 0, wake = null;
  const utcLabel = minutes => `UTC${minutes < 0 ? '−' : '+'}${T.pad(Math.floor(Math.abs(minutes) / 60))}:${T.pad(Math.abs(minutes) % 60)}`;
  const deviceZone = Math.round(-new Date().getTimezoneOffset() / 15) * 15;
  for (let minutes = -720; minutes <= 840; minutes += 15) {
    const option = document.createElement('option');
    option.value = String(minutes);
    option.textContent = utcLabel(minutes) + (minutes === deviceZone ? ' · device' : '');
    el.zone.append(option);
  }
  el.zone.value = String(deviceZone);
  el['reference-date'].value = T.localParts(Date.now(), deviceZone).date;

  function message(text, error = false) {
    el['reference-status'].textContent = text;
    el['reference-status'].classList.toggle('error', error);
  }
  function releaseWake() {
    const old = wake;
    wake = null;
    if (old) old.release().catch(() => {});
    el['wake-status'].textContent = 'Keep this screen awake';
  }
  async function requestWake() {
    if (!navigator.wakeLock) return;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!active || document.hidden) { await lock.release(); return; }
      wake = lock;
      el['wake-status'].textContent = 'Screen awake';
      lock.addEventListener('release', () => {
        if (wake === lock) { wake = null; el['wake-status'].textContent = 'Keep this screen awake'; }
      });
    } catch { el['wake-status'].textContent = 'Keep this screen awake'; }
  }
  function stop(reason = 'Check the reference, then start the QR.', invalidate = false) {
    active = false;
    if (invalidate) valid = false;
    el.qr.hidden = true;
    el['qr-placeholder'].hidden = false;
    el['placeholder-title'].textContent = invalidate ? 'Check the reference' : 'QR is off';
    el['placeholder-text'].textContent = reason;
    const ctx = el.qr.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, el.qr.width, el.qr.height);
    el.signal.textContent = 'QR OFF';
    el.signal.classList.remove('live');
    el.toggle.textContent = 'Start QR →';
    el.toggle.disabled = !valid;
    el['refresh-rate'].textContent = 'QR hidden';
    el.payload.textContent = 'QR off — no scannable timestamp.';
    el['scan-status'].textContent = reason;
    releaseWake();
  }
  function updateRateNote() {
    const key = sourceRateKey(), r = T.rateFor(key);
    const ratio = T.captureRatio(el['capture-rate'].value, key);
    el['capture-note'].textContent = `${el['capture-rate'].value} fps capture · ${Number(ratio.toFixed(3))} capture frame${Math.abs(ratio - 1) < 1e-8 ? '' : 's'} per timecode frame. Verify the reference rate and the clip’s timecode base.`;
    el['frame-length'].textContent = T.frameMs(key).toFixed(3);
    el['rate-note'].textContent = el.source.value === 'device'
      ? 'Device Clock displays time at 30 fps. The QR sends date and time; it does not change the camera’s frame rate.'
      : r.den === 1001
      ? 'NDF timecode runs about 3.6 seconds per hour behind wall time. Check that your source uses the same NDF convention before scanning.'
      : ['25','50'].includes(key) ? `Using ${key} fps timecode. High-speed capture can use a lower timecode base; check a recorded clip before the shoot.`
        : `Using true ${key}.000 fps timecode. Check actual capture and timecode rates: a GoPro mode label may represent a fractional rate. See Documentation.`;
  }
  function sourceRateKey() {
    return el.source.value === 'manual' ? el.rate.value : '30';
  }
  function settings() {
    const key = sourceRateKey();
    T.rateFor(key);
    T.captureRatio(el['capture-rate'].value, key);
    return { key, capture: el['capture-rate'].value, source: el.source.value,
      zone: T.numberIn(el.zone.value, -720, 840, 'UTC offset', 15),
      offset: T.numberIn(el.offset.value, -T.DAY, T.DAY, 'Offset', 0.001) };
  }
  function applyReference(event) {
    event?.preventDefault();
    stop('Reference changed. Start QR when ready.');
    try {
      const s = settings(), wall = Date.now(), mono = performance.now();
      const epoch = (s.source === 'manual'
        ? T.epochForTimecode(el['reference-date'].value, el['reference-tc'].value.trim(), s.key, s.zone)
        : wall) + s.offset;
      const parts = T.localParts(epoch, s.zone);
      reference = { ...s, epoch, mono, wall, dateIndex: parts.dateIndex };
      valid = true;
      lastMono = mono;
      el.toggle.disabled = false;
      el['rate-label'].textContent = T.rateFor(s.key).label;
      message(s.source === 'manual' ? 'Jammed at button press. Check against your source.' : 'Device Clock reference applied. Ready to scan.');
      updateReadout(mono);
    } catch (e) { valid = false; el.toggle.disabled = true; message(e.message, true); }
  }
  function updateSourceFields() {
    el['manual-fields'].hidden = el.source.value !== 'manual';
    el.rate.disabled = el.source.value !== 'manual';
    el.apply.textContent = el.source.value === 'manual' ? 'Jam now' : 'Apply reference';
    el['reference-date'].required = el['reference-tc'].required = el.source.value === 'manual';
  }
  function dirty() {
    updateSourceFields();
    stop('Apply your reference before scanning.', true);
    el.timecode.textContent = '--:--:--:--';
    el['clock-detail'].textContent = 'Changes not applied';
    message('Reference changed. Apply it to continue.');
    updateRateNote();
  }
  function updateReadout(mono) {
    if (!reference || !valid) return null;
    const epoch = reference.epoch + mono - reference.mono;
    const p = T.localParts(epoch, reference.zone);
    if (reference.source === 'manual' && p.dateIndex !== reference.dateIndex) {
      stop('QR clock crossed midnight. Jam the reference again.', true);
      message('Midnight rollover: jam the reference again.', true);
      return null;
    }
    el.timecode.textContent = T.timecode(epoch, reference.key, reference.zone);
    el['clock-detail'].textContent = `QR clock ${p.date} ${T.pad(p.hour)}:${T.pad(p.minute)}:${T.pad(p.second)} · ${utcLabel(reference.zone)}`;
    return epoch;
  }
  function tick() {
    try {
      const mono = performance.now();
      if (valid && reference) {
        const issue = T.clockIssue({ wallNow: Date.now(), monoNow: mono,
          wallBase: reference.wall, monoBase: reference.mono, lastMono });
        if (issue) {
          const reason = issue === 'clock' ? 'Device clock changed or device slept. Apply the reference again.' : 'Display updates stalled. Apply the reference again.';
          stop(reason, true); message(reason, true);
        }
      }
      lastMono = mono;
      const epoch = updateReadout(mono);
      if (active && valid && epoch !== null && !document.hidden) {
        const command = T.payload(epoch, reference.zone);
        window.IgorQR.render(el.qr, command, window.qrcode);
        // Refuse a frame that took too long to prepare; no guessed latency correction.
        if (performance.now() - mono > 100) {
          stop('QR rendering was too slow. Apply the reference again.', true);
        } else if (++warmup >= 3) {
          el.qr.hidden = false;
          el['qr-placeholder'].hidden = true;
          el.signal.textContent = 'LIVE QR'; el.signal.classList.add('live');
          el.payload.textContent = command;
          refreshCount++;
          if (mono - refreshStart >= 1000) {
            el['refresh-rate'].textContent = `${Math.round(refreshCount * 1000 / (mono - refreshStart))} QR updates/s`;
            refreshStart = mono; refreshCount = 0;
          }
        }
      }
    } catch (error) { stop('Unable to generate QR. Reload and check this device.', true); message(error.message, true); }
    requestAnimationFrame(tick);
  }
  el['reference-form'].addEventListener('submit', applyReference);
  for (const input of [el.rate, el['capture-rate'], el.zone, el.offset, el['reference-date'], el['reference-tc']]) input.addEventListener('input', dirty);
  el.source.addEventListener('input', () => {
    dirty();
    if (el.source.value === 'device') applyReference();
  });
  for (const [id, sign] of [['minus-frame', -1], ['plus-frame', 1]]) $(id).addEventListener('click', () => {
    try {
      const value = T.numberIn(el.offset.value, -T.DAY, T.DAY, 'Offset', .001);
      el.offset.value = Math.max(-T.DAY, Math.min(T.DAY, value + sign * T.frameMs(sourceRateKey()))).toFixed(3);
      dirty();
    } catch (e) { stop('Correct the offset, then apply.', true); message(e.message, true); }
  });
  el.toggle.addEventListener('click', () => {
    if (active) { stop('QR paused. The reference clock continues.'); return; }
    if (!valid || document.hidden) return;
    if (typeof window.qrcode !== 'function' || !window.IgorQR) { stop('QR encoder did not load. Reload the page.', true); return; }
    active = true; warmup = 0; refreshCount = 0; refreshStart = performance.now();
    el.toggle.textContent = 'Pause QR';
    el['scan-status'].textContent = 'Scan each idle camera. Wait for its confirmation.';
    el['placeholder-title'].textContent = 'Starting live QR';
    el['placeholder-text'].textContent = 'Preparing fresh timestamps…';
    requestWake();
  });
  async function enlarge() {
    const panel = el['jam-panel'];
    if (document.fullscreenElement) { await document.exitFullscreen(); return; }
    if (panel.classList.contains('expanded')) { panel.classList.remove('expanded'); el.fullscreen.textContent = 'Enlarge'; return; }
    try { if (!panel.requestFullscreen) throw new Error('Fullscreen unavailable'); await panel.requestFullscreen(); }
    catch { panel.classList.add('expanded'); }
    el.fullscreen.textContent = 'Exit large view';
  }
  el.fullscreen.addEventListener('click', () => { enlarge().catch(() => {}); });
  document.addEventListener('fullscreenchange', () => { el.fullscreen.textContent = document.fullscreenElement ? 'Exit large view' : 'Enlarge'; });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { el['jam-panel'].classList.remove('expanded'); el.fullscreen.textContent = 'Enlarge'; } });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { stop('Page was hidden. Apply the reference again.', true); message('Page was hidden. Apply the reference again.'); }
  });
  window.addEventListener('pagehide', () => stop('Page was closed. Apply the reference again.', true));
  window.addEventListener('pageshow', e => { if (e.persisted) { stop('Page restored. Apply the reference again.', true); message('Page restored. Apply the reference again.'); } });
  window.addEventListener('beforeprint', () => stop('Live QR cannot be printed. Apply the reference again.', true));
  window.addEventListener('error', () => stop('An error stopped the QR. Reload before scanning.', true));
  updateSourceFields();
  updateRateNote();
  applyReference();
  requestAnimationFrame(tick);
})();
