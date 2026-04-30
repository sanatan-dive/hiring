import { build, context } from 'esbuild';
import fs from 'node:fs/promises';
import path from 'node:path';

const watch = process.argv.includes('--watch');

const DIST = 'dist';
const PUBLIC = 'public';

async function copyStatic() {
  await fs.mkdir(DIST, { recursive: true });
  // Copy manifest + popup HTML + icons
  const files = ['manifest.json', 'popup.html'];
  for (const f of files) {
    try {
      await fs.copyFile(path.join(PUBLIC, f), path.join(DIST, f));
      console.log(`copied ${f}`);
    } catch (err) {
      if (err.code !== 'ENOENT') throw err;
    }
  }
  // Copy icons dir if it exists
  try {
    const icons = await fs.readdir(path.join(PUBLIC, 'icons'));
    await fs.mkdir(path.join(DIST, 'icons'), { recursive: true });
    for (const icon of icons) {
      await fs.copyFile(path.join(PUBLIC, 'icons', icon), path.join(DIST, 'icons', icon));
    }
  } catch (err) {
    if (err.code !== 'ENOENT') throw err;
  }
}

const buildOptions = {
  entryPoints: {
    background: 'src/background.ts',
    content: 'src/content.ts',
    popup: 'src/popup.ts',
  },
  bundle: true,
  outdir: DIST,
  format: 'iife',
  target: 'chrome120',
  sourcemap: watch ? 'inline' : false,
  minify: !watch,
  define: {
    'process.env.NODE_ENV': JSON.stringify(watch ? 'development' : 'production'),
  },
};

if (watch) {
  await copyStatic();
  const ctx = await context(buildOptions);
  await ctx.watch();
  console.log('watching for changes...');
} else {
  await copyStatic();
  await build(buildOptions);
  console.log('build complete');
}
