/* IgorBox Timecode — MIT. Pure camera-settings validation and command generation. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./settings-capabilities.js'), require('./settings-presets.js'));
  else root.IgorCamera = factory(root.IgorCameraCapabilities, root.IgorCameraPresets);
})(typeof globalThis !== 'undefined' ? globalThis : this, function (C, P) {
  'use strict';
  const photoFields = new Set(['mode', 'whiteBalance', 'ev', 'rawPhoto', 'ilsLens']);
  const fields = new Set(['mode', 'ilsLens', ...Object.keys(C.options)]);
  function validate(settings, model) {
    const errors = [];
    if (!Object.hasOwn(C.models, model)) return ['Choose a supported MISSION camera model.'];
    if (!settings || typeof settings !== 'object' || Array.isArray(settings)) return ['Settings must be an object.'];
    for (const key of Object.keys(settings)) if (!fields.has(key)) errors.push('Unknown setting: ' + key + '.');
    if (!['video', 'photo'].includes(settings.mode)) errors.push('Choose Video or Photo mode.');
    if (settings.ilsLens != null && typeof settings.ilsLens !== 'boolean') errors.push('ILS lens confirmation must be true or false.');
    for (const [key, options] of Object.entries(C.options)) {
      const value = settings[key];
      if (value != null && (typeof value !== 'string' || !Object.hasOwn(options, value))) errors.push('Unsupported value for ' + key + '.');
      if (settings.mode === 'photo' && !photoFields.has(key) && value != null) errors.push(key + ' is not supported in this tool’s Photo mode.');
    }
    if (settings.mode === 'video') {
      const { resolution, frameRate, shutter, stabilization, isoMode, isoMax } = settings;
      if (settings.rawPhoto != null) errors.push('RAW photo output applies only to Photo mode.');
      if ((resolution != null) !== (frameRate != null)) errors.push('Choose resolution and frame rate together so compatibility can be checked.');
      if (resolution != null && (!Object.hasOwn(C.models[model].modes, resolution) || !C.models[model].modes[resolution].includes(frameRate))) errors.push('This resolution and frame-rate combination is unavailable on ' + C.models[model].label + '.');
      if (settings.colorProfile === 'log2' && settings.bitDepth !== '10') errors.push('GP-Log2 requires an explicit 10-bit selection.');
      if ((isoMode != null) !== (isoMax != null)) errors.push('Choose an ISO mode and value together.');
      if (shutter != null && shutter !== 'auto' && frameRate == null) errors.push('Select a resolution and frame rate before setting a manual shutter angle.');
      if (shutter != null && shutter !== 'auto' && frameRate != null && Number(frameRate) * 360 / Number(shutter) > 7680) errors.push('This shutter angle exceeds MISSION’s documented 1/7680 second video limit.');
      if (settings.ev != null && shutter != null && shutter !== 'auto' && isoMode != null) errors.push('EV compensation is not offered with a manual shutter and an explicit ISO setting; leave EV unchanged.');
      if (['on', 'auto'].includes(stabilization)) {
        if (!C.stabilizationCovered(settings)) errors.push('HyperSmooth On/AutoBoost is offered here only for 16:9 modes through 60 fps. Other combinations have not been verified for this tool; choose Off or leave unchanged.');
        if (C.models[model].ils && settings.ilsLens !== true) errors.push('Confirm that your ILS lens is supported for HyperSmooth and set up on the camera, or select Off.');
      }
    }
    return errors;
  }
  function components(settings, model) {
    const errors = validate(settings, model);
    if (errors.length) throw new Error(errors.join(' '));
    const result = [{ field: 'mode', command: settings.mode === 'video' ? 'mV' : 'mP' }];
    function add(field) {
      if (settings[field] != null) result.push({ field, command: C.options[field][settings[field]][1] });
    }
    if (settings.mode === 'photo') {
      ['rawPhoto', 'whiteBalance', 'ev'].forEach(add);
      return result;
    }
    ['resolution', 'frameRate', 'stabilization', 'bitDepth'].forEach(add);
    // HLG changes the available color profiles. Explicitly select non-HLG video
    // before applying a depth/color request, as in GoPro's MISSION configurator.
    if (settings.bitDepth != null || settings.colorProfile != null) result.push({ field: 'hlg', command: 'hH0' });
    ['colorProfile', 'bitrate', 'whiteBalance'].forEach(add);
    if (settings.isoMax != null) {
      const units = Number(settings.isoMax) / 100;
      result.push({ field: 'iso', command: 'i' + units + (settings.isoMode === 'fixed' ? 'M' + units : '') });
    }
    ['shutter', 'ev', 'sharpness', 'denoise'].forEach(add);
    return result;
  }
  function buildGoProCommand(settings, model) {
    const command = components(settings, model).map(part => part.command).join('');
    if (command.length > 180) throw new Error('Settings exceed this tool’s QR size limit.');
    return command;
  }
  function shutterHint(settings) {
    if (!settings.shutter || settings.shutter === 'auto' || !settings.frameRate) return 'MISSION uses shutter angles. Auto lets the camera choose exposure time.';
    const speed = Number(settings.frameRate) * 360 / Number(settings.shutter);
    return settings.shutter + '° ≈ 1/' + Number(speed.toFixed(2)) + ' second (nominal frame rate).';
  }
  // Strict, versioned local state. Restoring a form never restores a displayed QR.
  function encodeState(settings, model, target = P.defaultTarget, preset = 'custom') {
    buildGoProCommand(settings, model);
    P.validateTarget(target);
    if (typeof preset !== 'string' || !Object.hasOwn(P.definitions, preset)) throw new Error('Unknown saved preset.');
    return JSON.stringify({ version: 2, model, settings, target, preset });
  }
  function decodeState(text) {
    if (typeof text !== 'string' || text.length > 6000) throw new Error('Saved settings are too large.');
    const state = JSON.parse(text);
    if (![1, 2].includes(state?.version)) throw new Error('Unsupported saved-settings version.');
    buildGoProCommand(state.settings, state.model);
    // Existing saved forms retain their capture choices during the upgrade.
    const target = state.version === 1
      ? (state.settings.mode === 'video' && state.settings.resolution && state.settings.frameRate
        ? { resolution: state.settings.resolution, frameRate: state.settings.frameRate } : P.defaultTarget)
      : state.target;
    const preset = state.version === 1 ? 'custom' : state.preset;
    P.validateTarget(target);
    if (typeof preset !== 'string' || !Object.hasOwn(P.definitions, preset)) throw new Error('Unknown saved preset.');
    return { model: state.model, settings: { ...state.settings }, target: { ...target }, preset };
  }
  return { validate, components, buildGoProCommand, shutterHint, encodeState, decodeState };
});
