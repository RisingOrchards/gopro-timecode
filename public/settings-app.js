/* IgorBox Timecode — MIT. Camera form state and DOM only; no timecode lifecycle changes. */
(function () {
  'use strict';
  const C = window.IgorCameraCapabilities, P = window.IgorCameraPresets, G = window.IgorCamera;
  const $ = id => document.getElementById(id);
  const key = 'igorbox.camera-settings.v1';
  let target = { ...P.defaultTarget };
  let model = 'mission-1-pro', settings = P.resolve('cinema', model, target), preset = 'cinema';
  let videoDraft = null, command = '', expanded = false;
  const controls = Object.fromEntries(Object.keys(C.options).map(name => [name, $('setting-' + name)]));
  function option(select, value, label) {
    const item = document.createElement('option'); item.value = value; item.textContent = label; select.append(item);
  }
  Object.entries(C.models).forEach(([id, item]) => option($('camera-model'), id, item.label));
  Object.entries(P.definitions).forEach(([id, item]) => option($('camera-preset'), id, item.label));
  for (const name of ['resolution', 'frameRate']) {
    Object.entries(C.options[name]).forEach(([value, [label]]) => option($('target-' + name), value, name === 'frameRate' ? value + ' fps' : label));
  }
  for (const [name, select] of Object.entries(controls)) {
    option(select, '', 'Leave unchanged');
    Object.entries(C.options[name]).forEach(([value, [label]]) => option(select, value, label));
  }
  function hideQR(message = 'Settings changed. Generate a new QR.') {
    command = '';
    $('camera-qr').hidden = true; $('camera-placeholder').hidden = false;
    $('camera-copy').disabled = true; $('camera-fullscreen').disabled = !expanded;
    $('camera-command').textContent = 'Generate a QR to see the command.';
    $('camera-copy-status').textContent = '';
    $('camera-signal').textContent = 'QR OFF'; $('camera-signal').classList.remove('live');
    $('camera-scan-status').textContent = message;
  }
  function save() {
    try {
      if ($('camera-remember').checked && !G.validate(settings, model).length) {
        localStorage.setItem(key, G.encodeState(settings, model, target, preset));
        $('camera-storage-status').textContent = 'Saved locally. The QR stays off when you return.';
      } else {
        localStorage.removeItem(key);
        $('camera-storage-status').textContent = $('camera-remember').checked ? 'Fix the settings to save this form.' : '';
      }
    } catch (_) { $('camera-storage-status').textContent = 'Local storage is unavailable. You can still generate a QR.'; }
  }
  function captureLabel(capture) {
    return [C.options.resolution[capture.resolution]?.[0] || 'resolution unchanged',
      capture.frameRate ? capture.frameRate + ' fps mode' : 'rate unchanged'].join(' / ');
  }
  function renderTarget(photo) {
    for (const name of ['resolution', 'frameRate']) $('target-' + name).value = target[name];
    for (const item of $('target-resolution').options) item.disabled = !Object.hasOwn(C.models[model].modes, item.value);
    for (const item of $('target-frameRate').options) item.disabled = !C.models[model].modes[target.resolution]?.includes(item.value);
    const available = C.models[model].modes[target.resolution]?.includes(target.frameRate);
    $('camera-target-status').textContent = photo ? 'Video target saved for when you return to Video mode.' : available
      ? 'Cinema, Run & Gun and Custom follow this target. Slow Motion and High Frame Rate use their own capture settings.'
      : 'This target is unavailable on ' + C.models[model].label + '. Choose a supported pair, or review the preset override below.';
    $('camera-target-status').classList.toggle('error', !photo && !available);
    const differs = settings.resolution !== target.resolution || settings.frameRate !== target.frameRate;
    const special = ['slow', 'high'].includes(preset);
    let note = differs
      ? (special ? P.definitions[preset].label + ' overrides your target: ' : 'Custom override: ') + captureLabel(settings) + '. Target: ' + captureLabel(target) + '.'
      : 'Matches your target: ' + captureLabel(target) + '.';
    if (special) note += ' This preset keeps its capture settings when the target changes.';
    if (preset === 'run' && settings.stabilization === 'off') note += C.models[model].ils
      ? ' HyperSmooth starts Off on ILS; confirm a supported lens before enabling it.'
      : ' HyperSmooth is Off because this target is outside this tool’s verified stabilization coverage.';
    $('camera-capture-status').textContent = note;
    $('camera-capture-status').classList.toggle('target-override', differs);
  }
  function render() {
    $('camera-model').value = model; $('camera-preset').value = preset;
    $('camera-mode').value = settings.mode;
    $('preset-description').textContent = preset === 'custom' ? 'Changing the target updates only resolution and frame rate. Other edits stay as entered; Leave unchanged omits a setting.' : P.definitions[preset].description;
    for (const [name, select] of Object.entries(controls)) select.value = settings[name] ?? '';
    for (const item of controls.resolution.options) item.disabled = !!item.value && !Object.hasOwn(C.models[model].modes, item.value);
    for (const item of controls.frameRate.options) item.disabled = !!item.value && !!settings.resolution && !C.models[model].modes[settings.resolution]?.includes(item.value);
    for (const item of controls.colorProfile.options) item.disabled = item.value === 'log2' && settings.bitDepth !== '10';
    for (const item of controls.stabilization.options) item.disabled = ['on', 'auto'].includes(item.value) && !C.stabilizationCovered(settings);
    const photo = settings.mode === 'photo';
    $('camera-preset').disabled = photo;
    if (photo) $('preset-description').textContent = 'Video presets are available in Video mode. Your video draft is kept while you edit Photo settings.';
    renderTarget(photo);
    for (const id of ['camera-video-fields', 'camera-shutter-field', 'camera-shutter-hint', 'camera-stabilization-field', 'camera-video-advanced']) $(id).hidden = photo;
    $('camera-photo-fields').hidden = !photo;
    $('camera-ils-label').hidden = photo || !C.models[model].ils;
    $('camera-ils-lens').checked = settings.ilsLens === true;
    $('camera-iso-label').textContent = settings.isoMode === 'fixed' ? 'Fixed ISO (min = max)' : 'ISO maximum';
    $('camera-shutter-hint').textContent = G.shutterHint(settings);
    $('camera-firmware-note').textContent = 'Documentation baseline: ' + C.models[model].firmware + '.';
    const errors = G.validate(settings, model);
    $('camera-form-status').textContent = errors.join(' ') || 'Ready to generate. Review the camera acknowledgment after scanning.';
    $('camera-form-status').classList.toggle('error', errors.length > 0);
    $('camera-generate').disabled = errors.length > 0;
    $('camera-summary').textContent = C.models[model].label + ' · ' + (photo ? 'Photo' : [C.options.resolution[settings.resolution]?.[0], settings.frameRate && settings.frameRate + ' fps mode', C.options.colorProfile[settings.colorProfile]?.[0]].filter(Boolean).join(' · ') || 'Video');
  }
  function changed() { hideQR(); render(); save(); }
  function withTarget(current, id) {
    return id === 'custom' ? { ...current, ...target } : { ...P.resolve(id, model, target), ilsLens: current.ilsLens };
  }
  for (const name of ['resolution', 'frameRate']) $('target-' + name).addEventListener('change', () => {
    target[name] = $('target-' + name).value;
    if (settings.mode === 'photo') {
      if (videoDraft) videoDraft.settings = withTarget(videoDraft.settings, videoDraft.preset);
    } else settings = withTarget(settings, preset);
    changed();
  });
  for (const [name, select] of Object.entries(controls)) select.addEventListener('change', () => {
    settings[name] = select.value || null;
    if (name === 'isoMode' && settings.isoMode == null) settings.isoMax = null;
    if (name === 'isoMode' && settings.isoMode != null && settings.isoMax == null) settings.isoMax = '400';
    preset = 'custom'; changed();
  });
  $('camera-model').addEventListener('change', () => {
    model = $('camera-model').value;
    settings.ilsLens = false; videoDraft = null;
    if (preset !== 'custom') settings = P.resolve(preset, model, target);
    changed();
  });
  $('camera-preset').addEventListener('change', () => {
    preset = $('camera-preset').value; settings = P.resolve(preset, model, target); videoDraft = null; changed();
  });
  $('camera-mode').addEventListener('change', () => {
    if ($('camera-mode').value === 'photo') {
      videoDraft = { settings: { ...settings }, preset };
      settings = { ...P.resolve('custom', model, target), mode: 'photo', resolution: null, frameRate: null, whiteBalance: settings.whiteBalance };
      preset = 'custom';
    } else {
      settings = videoDraft?.settings || P.resolve('custom', model, target);
      preset = videoDraft?.preset || 'custom'; videoDraft = null;
    }
    changed();
  });
  $('camera-ils-lens').addEventListener('change', () => { settings.ilsLens = $('camera-ils-lens').checked; changed(); });
  $('camera-remember').addEventListener('change', save);
  $('camera-reset').addEventListener('click', () => {
    preset = 'cinema'; settings = P.resolve(preset, model, target); videoDraft = null;
    $('camera-remember').checked = false; changed();
  });
  $('camera-form').addEventListener('submit', event => {
    event.preventDefault(); hideQR();
    try {
      const next = G.buildGoProCommand(settings, model);
      window.IgorQR.render($('camera-qr'), next, window.qrcode, 0);
      command = next; $('camera-command').textContent = command;
      $('camera-qr').hidden = false; $('camera-placeholder').hidden = true;
      $('camera-copy').disabled = false; $('camera-fullscreen').disabled = false;
      $('camera-signal').textContent = 'SETTINGS'; $('camera-signal').classList.add('live');
      $('camera-scan-status').textContent = 'Scan while idle, wait for acknowledgment, then check your camera’s settings.';
      save(); $('camera-qr-panel').scrollIntoView({ block: 'start', behavior: 'instant' }); $('camera-qr-panel').focus({ preventScroll: true });
    } catch (error) {
      hideQR('QR could not be generated.'); $('camera-form-status').textContent = error.message; $('camera-form-status').classList.add('error');
    }
  });
  $('camera-copy').addEventListener('click', async () => {
    const copied = command; if (!copied) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(copied);
      if (command === copied) $('camera-copy-status').textContent = 'Command copied.';
    } catch (_) {
      if (command !== copied) return;
      const selection = window.getSelection(), range = document.createRange();
      range.selectNodeContents($('camera-command')); selection.removeAllRanges(); selection.addRange(range);
      $('camera-copy-status').textContent = 'Command selected. Use your device’s Copy action.';
    }
  });
  function fullscreenState() {
    expanded = document.fullscreenElement === $('camera-qr-panel') || $('camera-qr-panel').classList.contains('expanded');
    $('camera-fullscreen').textContent = expanded ? 'Exit full screen' : 'Full screen QR';
    $('camera-fullscreen').disabled = !command && !expanded;
  }
  async function closeFullScreen() {
    if (document.fullscreenElement === $('camera-qr-panel')) await document.exitFullscreen();
    $('camera-qr-panel').classList.remove('expanded'); fullscreenState();
  }
  $('camera-fullscreen').addEventListener('click', async () => {
    if (expanded) { await closeFullScreen(); return; }
    if (!command) return;
    try {
      if (!$('camera-qr-panel').requestFullscreen) throw new Error('Fullscreen unavailable');
      await $('camera-qr-panel').requestFullscreen();
    } catch (_) { $('camera-qr-panel').classList.add('expanded'); }
    fullscreenState();
  });
  document.addEventListener('fullscreenchange', fullscreenState);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && expanded) closeFullScreen(); });
  document.querySelector('.settings-qr-panel a[href="#camera-form"]').addEventListener('click', () => { if (expanded) closeFullScreen(); });
  window.addEventListener('pageshow', event => { if (event.persisted) hideQR('Returned to settings. Generate a QR when ready.'); });
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const restored = G.decodeState(saved); model = restored.model; settings = restored.settings; preset = restored.preset; target = restored.target;
      $('camera-remember').checked = true; $('camera-storage-status').textContent = 'Restored local settings. Review before generating.';
    }
  } catch (_) { $('camera-storage-status').textContent = 'Saved settings could not be restored. Using the starting preset.'; }
  render();
})();
