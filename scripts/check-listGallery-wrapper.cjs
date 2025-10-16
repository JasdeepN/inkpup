// Small wrapper to run the TS diagnostic using ts-node's register
require('ts-node').register({ transpileOnly: true, compilerOptions: { module: 'commonjs' } });
require('./check-listGallery.ts');
