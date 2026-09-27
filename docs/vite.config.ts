import { createReadStream, existsSync, statSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';
import babelPluginEmotion from '@emotion/babel-plugin';
import babel from '@rolldown/plugin-babel';
import react from '@vitejs/plugin-react';
import type { Connect, Plugin } from 'vite';
import { defineConfig } from 'vite';
import { vocs } from 'vocs/vite';
import presets from '../infra/babelPresets.tsx';
import createResolver from '../infra/createResolver.tsx';
import pixelarticonsPlugin from '../infra/pixelarticonsPlugin.ts';

const docsDir = fileURLToPath(new URL('.', import.meta.url));
const v20Root = join(docsDir, '../public/v20');

function serveV20Assets(): Plugin {
  const handler: Connect.NextHandleFunction = (req, res, next) => {
    const url = req.url || '';
    if (!url.startsWith('/v20/')) {
      next();
      return;
    }
    const rel = decodeURIComponent(url.slice('/v20/'.length).split('?')[0] || '');
    const file = normalize(join(v20Root, rel));
    if (!file.startsWith(v20Root) || !existsSync(file) || !statSync(file).isFile()) {
      res.statusCode = 404;
      res.end('Not found');
      return;
    }
    if (file.endsWith('.png')) {
      res.setHeader('Content-Type', 'image/png');
    }
    createReadStream(file).pipe(res);
  };

  return {
    name: 'serve-v20-assets',
    configurePreviewServer(server) {
      server.middlewares.use(handler);
    },
    configureServer(server) {
      server.middlewares.use(handler);
    },
  };
}

export default defineConfig(async () => ({
  build: {
    target: 'esnext',
  },
  define: {
    'process.env.IS_LANDING_PAGE': `1`,
  },
  plugins: [
    serveV20Assets(),
    createResolver(),
    pixelarticonsPlugin(),
    babel({
      plugins: [babelPluginEmotion],
      presets,
    }),
    react(),
    await vocs(),
  ],
  resolve: {
    alias: [
      {
        find: 'canvas',
        replacement: 'canvas/browser.js',
      },
      {
        find: 'vocs/waku/middleware',
        replacement: fileURLToPath(new URL('./wakuMiddleware.ts', import.meta.url)),
      },
    ],
  },
}));
