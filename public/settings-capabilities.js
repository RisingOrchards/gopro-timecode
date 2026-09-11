/* IgorBox Timecode — MIT. Documented MISSION command values; see docs/CAMERA_SETTINGS.md. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IgorCameraCapabilities = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function freeze(value) {
    Object.values(value).forEach(item => { if (item && typeof item === 'object') freeze(item); });
    return Object.freeze(value);
  }
  const low = ['24', '25', '30'], medium = [...low, '50', '60'];
  const fast = [...medium, '100', '120'], high = [...fast, '200', '240'];
  const baseModes = { '8k': low, '4k': fast, '4k-open': fast, '1080': high, '1440': high, '4k-vertical': ['25', '30'], '1080-vertical': ['25', '30', '50', '60'] };
  const proModes = { ...baseModes, '8k': medium, '8k-open': low, '4k': high };
  const models = {
    'mission-1': { label: 'MISSION 1', modes: baseModes, cinemaResolution: '4k-open', ils: false, firmware: 'MISSION Labs 2.02.70 or later' },
    'mission-1-pro': { label: 'MISSION 1 PRO', modes: proModes, cinemaResolution: '8k-open', ils: false, firmware: 'MISSION Labs 2.02.70 or later' },
    'mission-1-pro-ils': { label: 'MISSION 1 PRO ILS', modes: proModes, cinemaResolution: '8k-open', ils: true, firmware: 'ILS Labs 3.00.70 or later' }
  };
  // Values are UI identifiers. Only these literal tokens may enter a QR.
  const options = {
    resolution: {
      '8k-open': ['8K Open Gate · 4:3', 'r8T'], '8k': ['8K · 16:9', 'r8'],
      '4k-open': ['4K Open Gate · 4:3', 'r4T'], '4k': ['4K · 16:9', 'r4'],
      '1440': ['1440p · 4:3', 'r14'], '1080': ['1080p · 16:9', 'r1'],
      '4k-vertical': ['4K Vertical · 9:16', 'r4V'], '1080-vertical': ['1080p Vertical · 9:16', 'r1V']
    },
    frameRate: Object.fromEntries(high.map(rate => [rate, [rate + ' fps mode', 'p' + rate]])),
    bitDepth: { '8': ['8-bit', 'd0'], '10': ['10-bit', 'd1'] },
    colorProfile: { log2: ['GP-Log2', 'cL'], natural: ['Natural', 'cN'], cinematic: ['Cinematic', 'cC'], flat: ['Flat', 'cF'], vibrant: ['Vibrant', 'cG'] },
    bitrate: { standard: ['Standard', 'bS'], high: ['High', 'bH'] },
    whiteBalance: { auto: ['Auto', 'wA'], '2300': ['2300K', 'w23'], '2800': ['2800K', 'w28'], '3200': ['3200K', 'w32'], '4000': ['4000K', 'w40'], '4500': ['4500K', 'w45'], '5000': ['5000K', 'w50'], '5500': ['5500K', 'w55'], '6000': ['6000K', 'w60'], '6500': ['6500K', 'w65'], native: ['Native', 'wN'] },
    shutter: { auto: ['Auto', 's0'], '360': ['360°', 's360'], '180': ['180°', 's180'], '90': ['90°', 's90'], '45': ['45°', 's45'], '22': ['22°', 's22'] },
    isoMode: { range: ['Auto range', ''], fixed: ['Fixed ISO', ''] },
    isoMax: Object.fromEntries(['100', '200', '400', '800', '1600', '3200', '6400'].map(iso => [iso, [iso, 'i' + Number(iso) / 100]])),
    sharpness: { low: ['Low', 'sL'], medium: ['Medium', 'sM'], high: ['High', 'sH'] },
    stabilization: { off: ['Off', 'e0'], on: ['On', 'e1'], auto: ['AutoBoost', 'e4'] },
    ev: { '-2': ['−2', 'x-2'], '-1.5': ['−1.5', 'x-1.5'], '-1': ['−1', 'x-1'], '-0.5': ['−0.5', 'x-.5'], '0': ['0', 'x0'], '0.5': ['+0.5', 'x.5'], '1': ['+1', 'x1'], '1.5': ['+1.5', 'x1.5'], '2': ['+2', 'x2'] },
    denoise: { low: ['Low', 'dL'], medium: ['Medium', 'dM'], high: ['High', 'dH'] },
    rawPhoto: { on: ['RAW + standard photo', 'r'], off: ['Standard photo', 'r0'] }
  };
  // A deliberately bounded stabilization profile, not a claim about hardware limits.
  function stabilizationCovered(settings) {
    return ['8k', '4k', '1080'].includes(settings.resolution) && medium.includes(settings.frameRate);
  }
  return freeze({ models, options, stabilizationCovered, verified: '2026-09-11' });
});
