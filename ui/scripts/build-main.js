// Build script for main process using esbuild
// Fast compilation without strict type checking

const esbuild = require('esbuild');
const path = require('path');

const entryPoints = [
  'src/main/main.ts',
  'src/main/preload.ts'
];

async function build() {
  try {
    await esbuild.build({
      entryPoints,
      bundle: true,
      platform: 'node',
      target: 'node18',
      outdir: 'dist/main',
      external: ['electron', 'electron-reload', 'electron-store', 'sharp'],
      sourcemap: true,
      minify: false,
      format: 'cjs',
      logLevel: 'info'
    });
    
    console.log('✓ Main process built successfully');
  } catch (error) {
    console.error('✗ Build failed:', error);
    process.exit(1);
  }
}

build();
