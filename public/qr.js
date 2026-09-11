/* IgorBox Timecode — MIT. Canvas renderer, four-module quiet zone. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IgorQR = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  function render(canvas, text, encoder, version = 3) {
    const code = encoder(version, 'M');
    code.addData(text, 'Byte');
    code.make();
    const count = code.getModuleCount(), quiet = 4, scale = 16;
    const size = (count + quiet * 2) * scale;
    if (canvas.width !== size || canvas.height !== size) canvas.width = canvas.height = size;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) throw new Error('Canvas is unavailable.');
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#000';
    for (let row = 0; row < count; row++) for (let col = 0; col < count; col++)
      if (code.isDark(row, col)) ctx.fillRect((col + quiet) * scale, (row + quiet) * scale, scale, scale);
  }
  return { render };
});
