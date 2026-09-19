/* IgorBox Timecode — MIT. Editable starting points; no camera identities. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./settings-capabilities.js'));
  else root.IgorCameraPresets = factory(root.IgorCameraCapabilities);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';
  const defaultTarget = Object.freeze({ resolution: '4k', frameRate: '24' });
  const definitions = Object.freeze({
    cinema: Object.freeze({ label: 'Production / Cinema', description: 'Your target · 180° shutter · 5500K · ISO 800 · 10-bit GP-Log2', settings: Object.freeze({ whiteBalance: '5500', shutter: '180', isoMax: '800', stabilization: 'off' }) }),
    run: Object.freeze({ label: 'Run & Gun', description: 'Your target · 180° shutter · 5500K · ISO 800 · HyperSmooth On · 10-bit GP-Log2', settings: Object.freeze({ whiteBalance: '5500', shutter: '180', isoMax: '800', stabilization: 'on' }) }),
    live: Object.freeze({ label: 'Streaming / Live', description: '1080p 16:9 · target rate up to 60 fps · Natural color · 5500K · 180° shutter · ISO 800 · HyperSmooth Off for a mounted camera', settings: Object.freeze({ resolution: '1080', colorProfile: 'natural', whiteBalance: '5500', shutter: '180', isoMax: '800', stabilization: 'off' }) }),
    slow: Object.freeze({ label: 'Slow Motion', description: '4K60 with 180° shutter (about 1/120 second).', settings: Object.freeze({ resolution: '4k', frameRate: '60', whiteBalance: '5500', shutter: '180', isoMax: '800', stabilization: 'off' }) }),
    high: Object.freeze({ label: 'High Frame Rate', description: '4K120 with 180° shutter (about 1/240 second).', settings: Object.freeze({ resolution: '4k', frameRate: '120', whiteBalance: '5500', shutter: '180', isoMax: '1600', stabilization: 'off' }) }),
    custom: Object.freeze({ label: 'Custom', description: 'Start with your target; other settings are unchanged.', settings: Object.freeze({}) })
  });
  function validateTarget(target) {
    if (!target || typeof target !== 'object' || Array.isArray(target) ||
        Object.keys(target).length !== 2 || !['resolution', 'frameRate'].every(key =>
          typeof target[key] === 'string' && Object.hasOwn(C.options[key], target[key]))) {
      throw new Error('Choose a supported target resolution and frame rate.');
    }
  }
  function resolve(id, model, target = defaultTarget) {
    if (!Object.hasOwn(definitions, id) || !Object.hasOwn(C.models, model)) throw new Error('Unknown preset or camera model.');
    validateTarget(target);
    const blank = Object.fromEntries(Object.keys(C.options).map(key => [key, null]));
    const settings = { ...blank, mode: 'video', ilsLens: false, ...target };
    if (id === 'custom') return settings;
    Object.assign(settings, { bitDepth: '10', colorProfile: 'log2', bitrate: 'high', isoMode: 'range', sharpness: 'low' }, definitions[id].settings);
    // A capture starting point within the documented MISSION Media Mod 4K60
    // output ceiling. HDMI output/negotiation itself is configured on-camera.
    if (id === 'live' && Number(target.frameRate) > 60) settings.frameRate = '60';
    // Preserve the capture target. Use Off when stabilization needs separate setup
    // or this tool has no verified coverage for the target's aspect/rate.
    if (id === 'run' && (C.models[model].ils || !C.stabilizationCovered(settings))) settings.stabilization = 'off';
    return settings;
  }
  return { defaultTarget, definitions, validateTarget, resolve };
});
