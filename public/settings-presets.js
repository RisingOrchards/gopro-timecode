/* IgorBox Timecode — MIT. Editable starting points; no camera identities. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./settings-capabilities.js'));
  else root.IgorCameraPresets = factory(root.IgorCameraCapabilities);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C) {
  'use strict';
  const definitions = Object.freeze({
    cinema: Object.freeze({ label: 'Production / Cinema', description: '8K 16:9 · 24 fps mode · 180° shutter · 10-bit GP-Log2', settings: Object.freeze({ resolution: '8k', frameRate: '24', whiteBalance: '5500', shutter: '180', isoMax: '400', stabilization: 'off' }) }),
    run: Object.freeze({ label: 'Run & Gun', description: '8K30 16:9 with automatic exposure, auto white balance and stabilization.', settings: Object.freeze({ resolution: '8k', frameRate: '30', whiteBalance: 'auto', shutter: 'auto', isoMax: '1600', stabilization: 'on' }) }),
    slow: Object.freeze({ label: 'Slow Motion', description: '4K60 with 180° shutter (about 1/120 second).', settings: Object.freeze({ resolution: '4k', frameRate: '60', whiteBalance: '5500', shutter: '180', isoMax: '800', stabilization: 'off' }) }),
    high: Object.freeze({ label: 'High Frame Rate', description: '4K120 with 180° shutter (about 1/240 second).', settings: Object.freeze({ resolution: '4k', frameRate: '120', whiteBalance: '5500', shutter: '180', isoMax: '1600', stabilization: 'off' }) }),
    custom: Object.freeze({ label: 'Custom', description: 'Start at 4K30 16:9; other settings are unchanged.', settings: Object.freeze({ resolution: '4k', frameRate: '30' }) })
  });
  function resolve(id, model) {
    if (!Object.hasOwn(definitions, id) || !Object.hasOwn(C.models, model)) throw new Error('Unknown preset or camera model.');
    const blank = Object.fromEntries(Object.keys(C.options).map(key => [key, null]));
    const settings = { ...blank, mode: 'video', ilsLens: false };
    if (id === 'custom') return Object.assign(settings, definitions.custom.settings);
    Object.assign(settings, { bitDepth: '10', colorProfile: 'log2', bitrate: 'high', isoMode: 'range', sharpness: 'low' }, definitions[id].settings);
    // Stabilization with an ILS requires the user to identify a suitable lens.
    if (C.models[model].ils && id === 'run') settings.stabilization = 'off';
    return settings;
  }
  return { definitions, resolve };
});
