'use strict';
// Optional static distribution. Hosts can also serve public/ directly.
require('./check.cjs');
const fs = require('node:fs');
const path = require('node:path');
const root = fs.realpathSync(path.resolve(__dirname,'..'));
const output = path.resolve(root,'dist');
if (path.dirname(output) !== root || path.basename(output) !== 'dist') throw new Error('Invalid build output path');
if (fs.existsSync(output) && fs.lstatSync(output).isSymbolicLink()) throw new Error('Build output must not be a symlink');
fs.rmSync(output,{recursive:true,force:true});
fs.cpSync(path.join(root,'public'),output,{recursive:true});
console.log('Static assets copied to dist/.');
